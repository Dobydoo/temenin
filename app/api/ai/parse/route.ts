import { NextResponse } from "next/server";
import { z } from "zod";
import { parseFreeText, type ParsedActivity } from "@/lib/engine";
import { AREAS } from "@/lib/data/areas";
import { createRateLimiter } from "@/lib/rate-limit";
import type { Category, ChatLevel } from "@/lib/types";

const Body = z.object({
  text: z.string().min(1).max(500),
  locale: z.enum(["en", "id"]).optional().default("id"),
});

const AiResult = z.object({
  category: z.enum(["movie", "coffee", "study", "shopping", "sports", "food", "music", "other"]),
  areaId: z.string().nullable(),
  budgetMax: z.number().int().min(0).max(10000000),
  chatLevel: z.enum(["quiet", "moderate", "chatty"]),
});

const limited = createRateLimiter(20, 60_000);

const AREA_IDS = new Set(AREAS.map((a) => a.id));

function sanitize(value: unknown, fallback: ParsedActivity): ParsedActivity {
  const parsed = AiResult.safeParse(value);
  if (!parsed.success) {
    console.warn("[ai.parse] schema mismatch", JSON.stringify(value)?.slice(0, 200));
    return fallback;
  }
  const v = parsed.data;
  const areaId = v.areaId && AREA_IDS.has(v.areaId) ? v.areaId : fallback.areaId;
  return {
    category: v.category as Category,
    areaId,
    budgetMax: v.budgetMax,
    dayHint: fallback.dayHint,
    chatLevel: v.chatLevel as ChatLevel,
    missing: [...(v.category === "other" ? ["category"] : []), ...(areaId ? [] : ["area"])],
  };
}

async function tryMetaAi(text: string, locale: "en" | "id", fallback: ParsedActivity): Promise<ParsedActivity | null> {
  const url = process.env.META_MODEL_URL;
  const key = process.env.META_MODEL_API_KEY;
  if (!url || !key) {
    console.warn("[ai.parse] missing env", { hasUrl: Boolean(url), hasKey: Boolean(key) });
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
            content: `Parse an Indonesian activity plan into JSON only: {"category": one of movie|coffee|study|shopping|sports|food|music|other, "areaId": Jakarta district id or null, "budgetMax": number in rupiah, "chatLevel": quiet|moderate|chatty}. Known areas: ${[...AREA_IDS].join(",")}. Never invent other fields. Output ONLY the raw JSON object, no markdown fences, no extra text.`,
          },
          { role: "user", content: `${locale === "id" ? "Pars teks ini:" : "Parse this text:"} ${text.slice(0, 500)}` },
        ],
        temperature: 0,
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      const snippet = (await res.text().catch(() => "")).slice(0, 200);
      console.warn("[ai.parse] upstream not ok", res.status, snippet);
      return null;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(content)?.[1] ?? content;
    const match = /{[\s\S]*}/.exec(fenced)?.[0] ?? /{[\s\S]*}/.exec(content)?.[0];
    if (!match) {
      console.warn("[ai.parse] no JSON in content", content.slice(0, 200));
      return null;
    }
    return sanitize(JSON.parse(match), fallback);
  } catch (err) {
    console.warn("[ai.parse] fetch failed", err instanceof Error ? err.message : String(err));
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
  const fallback = parseFreeText(body.data.text);
  if (process.env.MOCK_AI === "true") return NextResponse.json({ data: fallback, source: "fallback", mock: true });
  if (!process.env.META_MODEL_URL || !process.env.META_MODEL_API_KEY) {
    console.warn("[ai.parse] missing env at handler");
    return NextResponse.json({ data: fallback, source: "fallback" });
  }
  const ai = await tryMetaAi(body.data.text, body.data.locale, fallback);
  if (ai) return NextResponse.json({ data: ai, source: "ai" });
  return NextResponse.json({ data: fallback, source: "fallback" });
}
