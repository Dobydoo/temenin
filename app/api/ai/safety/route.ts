import { NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";

const Body = z.object({
  body: z.string().min(1).max(500),
  locale: z.enum(["en", "id"]).optional().default("id"),
});

const limited = createRateLimiter(20, 60_000);

const AiResult = z.object({ risky: z.boolean() });

async function tryMetaAi(body: string, locale: "en" | "id"): Promise<boolean | null> {
  const url = process.env.META_MODEL_URL;
  const key = process.env.META_MODEL_API_KEY;
  if (!url || !key) {
    console.warn("[ai.safety] missing env", { hasUrl: Boolean(url), hasKey: Boolean(key) });
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
            content: `You guard a meetup chat before both sides confirm. Reply JSON only: {"risky": true|false}. Risky means the message shares or asks for contact details (phone in digits, spelled-out words like "nol delapan", spaced/dotted numbers, social handles, email) or pushes to move off the app. Ordinary plans with times, prices, or "line" as queue are NOT risky. Locale: ${locale}.`,
          },
          { role: "user", content: body.slice(0, 500) },
        ],
        temperature: 0,
        max_tokens: 60,
      }),
    });
    if (!res.ok) {
      const snippet = (await res.text().catch(() => "")).slice(0, 200);
      console.warn("[ai.safety] upstream not ok", res.status, snippet);
      return null;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = /{[\s\S]*}/.exec(content)?.[0];
    if (!match) {
      console.warn("[ai.safety] no JSON in content", content.slice(0, 200));
      return null;
    }
    const parsed = AiResult.safeParse(JSON.parse(match));
    if (!parsed.success) return null;
    return parsed.data.risky;
  } catch (err) {
    console.warn("[ai.safety] fetch failed", err instanceof Error ? err.message : String(err));
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
  if (process.env.MOCK_AI === "true")
    return NextResponse.json({ data: { risky: false }, source: "fallback", mock: true });
  if (!process.env.META_MODEL_URL || !process.env.META_MODEL_API_KEY) {
    console.warn("[ai.safety] missing env at handler");
    return NextResponse.json({ data: { risky: false }, source: "fallback" });
  }
  const risky = await tryMetaAi(body.data.body, body.data.locale);
  if (risky === null) return NextResponse.json({ data: { risky: false }, source: "fallback" });
  return NextResponse.json({ data: { risky }, source: "ai" });
}
