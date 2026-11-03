import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

// The model may leave budgetMax/chatLevel null when the text does not say.
// Those must fall back to the deterministic parse, never to a schema bound.

type SentPayload = { response_format: { type: string }; messages: { content: string }[] };

const stub = async (content: Record<string, unknown>) => {
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const payload = JSON.parse(raw || "{}") as SentPayload;
      assert.ok(payload.response_format, "schema-constrained request");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) }, finish_reason: "stop" }] }));
    });
  });
  const { promise, resolve } = Promise.withResolvers<void>();
  server.listen(0, "127.0.0.1", resolve);
  await promise;
  const { port } = server.address() as { port: number };
  return { url: `http://127.0.0.1:${port}/v1`, close: () => server.close() };
};

const post = async (text: string) => {
  const { POST } = await import("../app/api/ai/parse/route.ts");
  const response = await POST(
    new Request("http://localhost/api/ai/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, locale: "en" }),
    }),
  );
  return response.json() as Promise<{ source: string; data: Record<string, unknown> }>;
};

test("null budget and mood fall back to the deterministic parse", async () => {
  const server = await stub({ category: "movie", areaId: "tebet", budgetMax: null, chatLevel: null });
  try {
    process.env.META_MODEL_URL = server.url;
    process.env.META_MODEL_API_KEY = "k";
    delete process.env.META_MODEL_NAME;
    delete process.env.MOCK_AI;

    const body = await post("nonton film di Tebet sabtu sore");
    assert.equal(body.source, "ai");
    assert.equal(body.data.category, "movie");
    assert.equal(body.data.areaId, "tebet");
    assert.equal(body.data.budgetMax, 100000, "not the 10000000 schema ceiling");
    assert.equal(body.data.chatLevel, "moderate");
  } finally {
    server.close();
  }
});

test("a stated budget and mood still come from the model", async () => {
  const server = await stub({ category: "coffee", areaId: "kemang", budgetMax: 75000, chatLevel: "chatty" });
  try {
    process.env.META_MODEL_URL = server.url;
    process.env.META_MODEL_API_KEY = "k";

    const body = await post("ngopi di Kemang budget 75 ribu, aku banyak ngobrol");
    assert.equal(body.source, "ai");
    assert.equal(body.data.budgetMax, 75000);
    assert.equal(body.data.chatLevel, "chatty");
  } finally {
    server.close();
  }
});
