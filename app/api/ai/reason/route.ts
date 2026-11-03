import { NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";

const Body = z.object({
  fallback: z.string().min(1).max(300),
  locale: z.enum(["en", "id"]).optional().default("id"),
});

const limited = createRateLimiter(20, 60_000);

const AiResult = z.object({ text: z.string().min(1).max(300) });

function sanitize(value: unknown): string | null {
  const parsed = AiResult.safeParse(value);
  if (!parsed.success) return null;
  const text = parsed.data.text.trim().slice(0, 200);
  return text ? text : null;
}

async function tryMetaAi(fallback: string, locale: "en" | "id"): Promise<string | null> {
  const url = process.env.META_MODEL_URL;
  const key = process.env.META_MODEL_API_KEY;
  if (!url || !key) {
    console.warn("[ai.reason] missing env", { hasUrl: Boolean(url), hasKey: Boolean(key) });
    return null;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.META_MODEL_NAME ?? "muse-spark",
        messages: [
          {
            role: "system",
            content: `Rewrite this buddy-match explanation warmer and personal, one sentence, max 140 characters, in ${locale === "id" ? "Indonesian" : "English"}. JSON only: {"text": "..."}.`,
          },
          { role: "user", content: fallback.slice(0, 300) },
        ],
        temperature: 0.7,
        max_tokens: 120,
      }),
    });
    if (!res.ok) {
      const snippet = (await res.text().catch(() => "")).slice(0, 200);
      console.warn("[ai.reason] upstream not ok", res.status, snippet);
      return null;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = /{[\s\S]*}/.exec(content)?.[0];
    if (!match) {
      console.warn("[ai.reason] no JSON in content", content.slice(0, 200));
      return null;
    }
    return sanitize(JSON.parse(match));
  } catch (err) {
    console.warn("[ai.reason] fetch failed", err instanceof Error ? err.message : String(err));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const base = body.data.fallback.trim().slice(0, 200);
  if (process.env.MOCK_AI === "true") {
    const suffix = body.data.locale === "id" ? " \u2014 cocok buat vibemu!" : " \u2014 right up your alley!";
    const text = (base + suffix).slice(0, 200);
    return NextResponse.json({ data: { text }, source: "fallback", mock: true });
  }
  if (!process.env.META_MODEL_URL || !process.env.META_MODEL_API_KEY) {
    console.warn("[ai.reason] missing env at handler");
    return NextResponse.json({ data: { text: base }, source: "fallback" });
  }
  const ai = await tryMetaAi(body.data.fallback, body.data.locale);
  if (ai) return NextResponse.json({ data: { text: ai }, source: "ai" });
  return NextResponse.json({ data: { text: base }, source: "fallback" });
}
