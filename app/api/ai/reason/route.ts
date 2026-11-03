import { NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";
import { askMetaModel, degradedNote, mockEnabled, warn } from "@/lib/ai";

const Body = z.object({
  fallback: z.string().min(1).max(300),
  locale: z.enum(["en", "id"]).optional().default("id"),
});

const limited = createRateLimiter(20, 60_000);

const AiResult = z.object({ text: z.string().min(1).max(300) });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const base = body.data.fallback.trim().slice(0, 200);
  if (mockEnabled()) {
    const suffix = body.data.locale === "id" ? " \u2014 cocok buat vibemu!" : " \u2014 right up your alley!";
    const text = (base + suffix).slice(0, 200);
    return NextResponse.json({ data: { text }, source: "fallback", mock: true });
  }

  const outcome = await askMetaModel({
    tag: "ai.reason",
    developer: `Rewrite a buddy-match explanation to be warmer and personal in ${body.data.locale === "id" ? "Indonesian" : "English"}. One sentence, at most 140 characters. Keep every fact from the input; add no new facts.`,
    user: base,
    schema: AiResult,
    maxTokens: 1_500,
    temperature: 0.7,
  });

  if (!outcome.ok) {
    warn("ai.reason", outcome.failure);
    return NextResponse.json({ data: { text: base }, source: "fallback", degraded: degradedNote(outcome.failure) });
  }
  return NextResponse.json({ data: { text: outcome.value.text.trim().slice(0, 200) }, source: "ai" });
}
