import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { z } from "zod";

// Regression guard for the live-AI fallback bug: a retired model alias was
// sent verbatim, and the token budget was smaller than Muse Spark's reasoning
// pass, so content came back empty and every route silently fell back.

type SentPayload = {
  model: string;
  max_tokens?: number;
  max_completion_tokens: number;
  reasoning_effort: string;
  response_format: { type: string } | { type: string; json_schema: unknown };
  messages: { role: string; content: string }[];
};

const load = async (env: Record<string, string | undefined>) => {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return import("./ai.ts");
};

async function withStub(
  reply: (payload: SentPayload) => { status?: number; content?: string },
  run: (info: { url: string; sent: SentPayload[] }) => Promise<void>,
) {
  const sent: SentPayload[] = [];
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const parsed: unknown = JSON.parse(raw || "{}");
      const payload = parsed as SentPayload; // body this test itself wrote
      sent.push(payload);
      const { status = 200, content = "" } = reply(payload);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content }, finish_reason: content ? "stop" : "length" }] }));
    });
  });
  const { promise, resolve } = Promise.withResolvers<void>();
  server.listen(0, "127.0.0.1", resolve);
  await promise;
  try {
    const { port } = server.address() as { port: number };
    await run({ url: `http://127.0.0.1:${port}/v1/chat/completions`, sent });
  } finally {
    server.close();
  }
}

test("a documented base URL is completed to the chat completions endpoint", async () => {
  const ai = await load({ META_MODEL_URL: "https://api.meta.ai/v1", META_MODEL_API_KEY: "k" });
  assert.equal(ai.metaModelConfig()?.url, "https://api.meta.ai/v1/chat/completions");

  await load({ META_MODEL_URL: "https://api.meta.ai/v1/chat/completions/" });
  assert.equal(ai.metaModelConfig()?.url, "https://api.meta.ai/v1/chat/completions", "an endpoint stays as given");
});

test("the retired muse-spark alias resolves to a hosted model id", async () => {
  const ai = await load({ META_MODEL_URL: "http://x", META_MODEL_API_KEY: "k", META_MODEL_NAME: "muse-spark" });
  assert.equal(ai.metaModelConfig()?.model, "muse-spark-1.3-contributor");

  await load({ META_MODEL_NAME: undefined });
  assert.equal(ai.metaModelConfig()?.model, "muse-spark-1.3-contributor");

  await load({ META_MODEL_NAME: "muse-wonder-1.0" });
  assert.equal(ai.metaModelConfig()?.model, "muse-wonder-1.0", "an explicit model choice is never rewritten");
});

test("missing credentials report an env failure instead of calling out", async () => {
  const ai = await load({ META_MODEL_URL: undefined, META_MODEL_API_KEY: undefined });
  assert.equal(ai.metaModelConfig(), null);
  const outcome = await ai.askMetaModel({
    tag: "test",
    developer: "d",
    user: "u",
    schema: z.object({ ok: z.boolean() }),
    schemaName: "T",
  });
  assert.equal(outcome.ok, false);
  assert.equal(!outcome.ok && outcome.failure.stage, "env");
});

test("requests budget above the reasoning pass and constrain JSON", async () => {
  await withStub(
    () => ({ content: '{"ok":true}' }),
    async ({ url, sent }) => {
      const ai = await load({ META_MODEL_URL: url, META_MODEL_API_KEY: "secret", META_MODEL_NAME: undefined });
      const outcome = await ai.askMetaModel({
        tag: "test",
        developer: "Answer.",
        user: "hi",
        schema: z.object({ ok: z.boolean() }),
        schemaName: "T",
      });
      assert.equal(outcome.ok, true);
      assert.deepEqual(!outcome.ok ? null : outcome.value, { ok: true });

      const payload = sent[0];
      assert.ok(payload, "one upstream request");
      assert.ok(payload.max_completion_tokens >= 1000, "budget must clear reasoning tokens");
      assert.equal(payload.max_tokens, undefined, "max_tokens is deprecated");
      assert.equal(payload.reasoning_effort, "minimal");
      assert.equal(payload.response_format.type, "json_schema", "decoding is schema-constrained");
      const format = payload.response_format as { json_schema: { name: string; strict: boolean; schema: unknown } };
      assert.equal(format.json_schema.name, "T");
      assert.equal(format.json_schema.strict, true);
      assert.deepEqual(format.json_schema.schema, {
        type: "object",
        properties: { ok: { type: "boolean" } },
        required: ["ok"],
        additionalProperties: false,
      }, "no $schema/$id: Meta accepts a JSON Schema subset");
      assert.deepEqual(
        payload.messages.map((message) => message.role),
        ["developer", "user"],
      );
    },
  );
});

test("empty content and non-matching JSON surface as failures, not silent success", async () => {
  await withStub(
    () => ({ content: "" }),
    async ({ url }) => {
      const ai = await load({ META_MODEL_URL: url, META_MODEL_API_KEY: "secret" });
      const outcome = await ai.askMetaModel({ tag: "t", developer: "d", user: "u", schema: z.object({ ok: z.boolean() }), schemaName: "T" });
      assert.equal(!outcome.ok && outcome.failure.stage, "shape");
    },
  );
  await withStub(
    () => ({ content: '{"ok":"yes"}' }),
    async ({ url }) => {
      const ai = await load({ META_MODEL_URL: url, META_MODEL_API_KEY: "secret" });
      const outcome = await ai.askMetaModel({ tag: "t", developer: "d", user: "u", schema: z.object({ ok: z.boolean() }), schemaName: "T" });
      assert.equal(!outcome.ok && outcome.failure.stage, "shape");
    },
  );
});

test("a rejected upstream reports the status for logs", async () => {
  await withStub(
    () => ({ status: 400, content: "" }),
    async ({ url }) => {
      const ai = await load({ META_MODEL_URL: url, META_MODEL_API_KEY: "secret" });
      const outcome = await ai.askMetaModel({ tag: "t", developer: "d", user: "u", schema: z.object({ ok: z.boolean() }), schemaName: "T" });
      assert.equal(!outcome.ok && outcome.failure.stage, "upstream");
      assert.ok(!outcome.ok && outcome.failure.detail.startsWith("400"));
    },
  );
});

test("the degraded note names the failure stage without leaking content", async () => {
  const ai = await load({});
  assert.equal(ai.degradedNote({ stage: "env", detail: "missing META_MODEL_URL/META_MODEL_API_KEY" }), "env");
  assert.equal(ai.degradedNote({ stage: "upstream", detail: "400 {\"error\":\"invalid model\"}" }), "upstream:400");
  assert.equal(ai.degradedNote({ stage: "upstream", detail: "fetch failed" }), "upstream:network");
  assert.equal(ai.degradedNote({ stage: "shape", kind: "budget", detail: "empty content finish=length" }), "shape:budget");
  assert.equal(ai.degradedNote({ stage: "shape", kind: "schema", detail: "schema mismatch {}" }), "shape:schema");
});

test("unparseable content is reported as not-json, not a network error", async () => {
  await withStub(
    () => ({ content: "Sure! Here is the JSON you asked for." }),
    async ({ url }) => {
      const ai = await load({ META_MODEL_URL: url, META_MODEL_API_KEY: "secret" });
      const outcome = await ai.askMetaModel({ tag: "t", developer: "d", user: "u", schema: z.object({ ok: z.boolean() }), schemaName: "T" });
      assert.equal(!outcome.ok && outcome.failure.stage, "shape");
      assert.equal(!outcome.ok && outcome.failure.kind, "not-json");
      assert.equal(!outcome.ok && ai.degradedNote(outcome.failure), "shape:not-json");
    },
  );
});

test("a rejected JSON Schema falls back to JSON mode instead of losing the call", async () => {
  let first = true;
  await withStub(
    () => {
      const reject = first;
      first = false;
      // Meta supports a JSON Schema subset; an unsupported schema is a 400.
      return reject ? { status: 400, content: "" } : { content: '{"ok":true}' };
    },
    async ({ url, sent }) => {
      const ai = await load({ META_MODEL_URL: url, META_MODEL_API_KEY: "secret" });
      const outcome = await ai.askMetaModel({ tag: "t", developer: "d", user: "u", schema: z.object({ ok: z.boolean() }), schemaName: "T" });
      assert.equal(outcome.ok, true, "the retry keeps the live call");
      assert.equal(sent.length, 2);
      assert.equal(sent[0]?.response_format.type, "json_schema");
      assert.deepEqual(sent[1]?.response_format, { type: "json_object" });
    },
  );
});
