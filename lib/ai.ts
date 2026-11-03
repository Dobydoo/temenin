// Shared Meta Model API client for the four /api/ai/* routes.
//
// Two live-only bugs put every route on the fallback path:
//  1. `model: "muse-spark"` is not a model id; the API hosts muse-spark-1.3.
//  2. Muse Spark always reasons, and reasoning tokens count against
//     `max_tokens` (150-400). The budget ran out before any JSON was emitted,
//     so content came back empty and the route fell back silently.
// So: real model id, `max_completion_tokens`, low reasoning effort, and JSON
// mode instead of scraping fences out of prose.

import { z } from "zod";

export type AiFailure = {
  stage: "env" | "upstream" | "shape";
  /** Shape sub-case: which part of the response did not line up. */
  kind?: "empty" | "budget" | "not-json" | "schema";
  detail: string;
};

export type AiOutcome<T> = { ok: true; value: T } | { ok: false; failure: AiFailure };

/**
 * Accepts either the documented base URL (`https://api.meta.ai/v1`) or the
 * full endpoint. Sending a base URL as-is POSTs to `/v1`, which 404s.
 */
function chatCompletionsUrl(configured: string) {
  const url = configured.trim().replace(/\/+$/, "");
  return /\/chat\/completions$/.test(url) ? url : `${url}/chat/completions`;
}

export function metaModelConfig() {
  const url = process.env.META_MODEL_URL;
  const key = process.env.META_MODEL_API_KEY;
  if (!url || !key) return null;
  // Deployed envs still carry the retired bare alias from .env.example.
  const configured = process.env.META_MODEL_NAME?.trim();
  const model = !configured || configured === "muse-spark" ? "muse-spark-1.3-contributor" : configured;
  return { url: chatCompletionsUrl(url), key, model };
}

export function mockEnabled() {
  return process.env.MOCK_AI === "true";
}

export function warn(tag: string, failure: AiFailure) {
  console.warn(`[${tag}] ${failure.stage}`, failure.detail);
}

/**
 * A deployment whose logs are out of reach hides the only fact that matters:
 * whether the live call failed on env, upstream, or shape. `degraded` carries
 * just the stage and, for an upstream rejection, the HTTP status, so a curl
 * can tell the cases apart. No prompt, response text, or credential leaves
 * the server.
 */
export function degradedNote(failure: AiFailure) {
  if (failure.stage === "env") return "env";
  if (failure.stage === "shape") return `shape:${failure.kind}`;
  const status = /^(\d{3})\b/.exec(failure.detail)?.[1];
  return status ? `upstream:${status}` : "upstream:network";
}

export async function askMetaModel<T>(options: {
  tag: string;
  developer: string;
  user: string;
  schema: z.ZodType<T>;
  /** Response-format name; required for schema-constrained decoding. */
  schemaName: string;
  /** Budget for reasoning + visible JSON; reasoning alone can exceed a few hundred tokens. */
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}): Promise<AiOutcome<T>> {
  const config = metaModelConfig();
  if (!config) return { ok: false, failure: { stage: "env", detail: "missing META_MODEL_URL/META_MODEL_API_KEY" } };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), options.timeoutMs ?? 12_000);
  try {
    const send = (responseFormat: object) =>
      fetch(config.url, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "developer", content: `${options.developer} Reply with one JSON object only, no markdown fences and no extra text.` },
            { role: "user", content: options.user },
          ],
          reasoning_effort: "minimal",
          temperature: options.temperature ?? 0,
          max_completion_tokens: options.maxTokens ?? 2_000,
          response_format: responseFormat,
        }),
      });

    // Schema-constrained decoding removes the "valid JSON, wrong fields" case.
    // Meta supports a JSON Schema subset, so a rejection falls back to JSON
    // mode rather than losing the live call.
    // `$schema`/`$id` are not part of the subset Meta accepts.
    const schema = z.toJSONSchema(options.schema) as Record<string, unknown>;
    delete schema.$schema;
    delete schema.$id;
    let res = await send({
      type: "json_schema",
      json_schema: { name: options.schemaName, strict: true, schema },
    });
    if (res.status === 400) {
      res = await send({ type: "json_object" });
    }

    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 300);
      return { ok: false, failure: { stage: "upstream", detail: `${res.status} ${body}` } };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string | null }; finish_reason?: string }[];
    };
    // Nothing here to recover from: report which part the payload lacked.
    const choice = json.choices?.[0];
    const content = (choice?.message?.content ?? "").replace(/^[\s\S]*?```(?:json)?\s*|\s*```[\s\S]*$/g, "");
    if (!content.trim()) {
      const budget = choice?.finish_reason === "length";
      return {
        ok: false,
        failure: {
          stage: "shape",
          kind: budget ? "budget" : "empty",
          detail: `empty content finish=${choice?.finish_reason ?? "?"} resp=${Object.keys(json).join(",")}`,
        },
      };
    }

    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      return { ok: false, failure: { stage: "shape", kind: "not-json", detail: content.slice(0, 200) } };
    }
    const parsed = options.schema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => issue.path.join(".") || "(root)").join(",");
      return { ok: false, failure: { stage: "shape", kind: "schema", detail: `mismatch at ${issues}: ${content.slice(0, 200)}` } };
    }
    return { ok: true, value: parsed.data };
  } catch (err) {
    return { ok: false, failure: { stage: "upstream", detail: err instanceof Error ? err.message : String(err) } };
  } finally {
    clearTimeout(timer);
  }
}
