import { NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";
import { askMetaModel, degradedNote, mockEnabled, warn } from "@/lib/ai";

const Body = z.object({
  body: z.string().min(1).max(500),
  locale: z.enum(["en", "id"]).optional().default("id"),
});

const limited = createRateLimiter(20, 60_000);

const AiResult = z.object({ risky: z.boolean() });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsedBody = Body.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  if (mockEnabled()) return NextResponse.json({ data: { risky: false }, source: "fallback", mock: true });

  const outcome = await askMetaModel({
    tag: "ai.safety",
    developer: `You guard a meetup chat before both sides confirm. risky means the message shares or asks for contact details (phone in digits, spelled-out words like "nol delapan", spaced or dotted numbers, social handles, email) or pushes to move off the app. Ordinary plans with times, prices, or "line" as a queue are not risky. Locale: ${parsedBody.data.locale}.`,
    user: parsedBody.data.body.slice(0, 500),
    schema: AiResult,
    maxTokens: 1_500,
    temperature: 0,
  });

  if (!outcome.ok) {
    warn("ai.safety", outcome.failure);
    return NextResponse.json({ data: { risky: false }, source: "fallback", degraded: degradedNote(outcome.failure) });
  }
  return NextResponse.json({ data: { risky: outcome.value.risky }, source: "ai" });
}
