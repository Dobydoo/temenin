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

export type AiFailure = { stage: "env" | "upstream" | "shape"; detail: string };

export type AiOutcome<T> = { ok: true; value: T } | { ok: false; failure: AiFailure };

export function metaModelConfig() {
  const url = process.env.META_MODEL_URL;
  const key = process.env.META_MODEL_API_KEY;
  if (!url || !key) return null;
  // Deployed envs still carry the retired bare alias from .env.example.
  const configured = process.env.META_MODEL_NAME?.trim();
  const model = !configured || configured === "muse-spark" ? "muse-spark-1.3-contributor" : configured;
  return { url, key, model };
}

export function mockEnabled() {
  return process.env.MOCK_AI === "true";
}

export function warn(tag: string, failure: AiFailure) {
  console.warn(`[${tag}] ${failure.stage}`, failure.detail);
}

export async function askMetaModel<T>(options: {
  tag: string;
  developer: string;
  user: string;
  schema: z.ZodType<T>;
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
    const res = await fetch(config.url, {
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
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 300);
      return { ok: false, failure: { stage: "upstream", detail: `${res.status} ${body}` } };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string | null }; finish_reason?: string }[];
    };
    const choice = json.choices?.[0];
    const content = (choice?.message?.content ?? "").replace(/^[\s\S]*?```(?:json)?\s*|\s*```[\s\S]*$/g, "");
    if (!content.trim()) {
      return { ok: false, failure: { stage: "shape", detail: `empty content finish=${choice?.finish_reason ?? "?"}` } };
    }

    const parsed = options.schema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      return { ok: false, failure: { stage: "shape", detail: `schema mismatch ${content.slice(0, 200)}` } };
    }
    return { ok: true, value: parsed.data };
  } catch (err) {
    return { ok: false, failure: { stage: "upstream", detail: err instanceof Error ? err.message : String(err) } };
  } finally {
    clearTimeout(timer);
  }
}
