import { NextResponse } from "next/server";
import { z } from "zod";
import { parseFreeText, type ParsedActivity } from "@/lib/engine";
import { AREAS } from "@/lib/data/areas";
import { createRateLimiter } from "@/lib/rate-limit";
import { askMetaModel, degradedNote, mockEnabled, warn } from "@/lib/ai";
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

function merge(value: z.infer<typeof AiResult>, fallback: ParsedActivity): ParsedActivity {
  const areaId = value.areaId && AREA_IDS.has(value.areaId) ? value.areaId : fallback.areaId;
  return {
    category: value.category as Category,
    areaId,
    budgetMax: value.budgetMax,
    dayHint: fallback.dayHint,
    chatLevel: value.chatLevel as ChatLevel,
    missing: [...(value.category === "other" ? ["category"] : []), ...(areaId ? [] : ["area"])],
  };
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const fallback = parseFreeText(body.data.text);
  if (mockEnabled()) return NextResponse.json({ data: fallback, source: "fallback", mock: true });

  const outcome = await askMetaModel({
    tag: "ai.parse",
    developer: `Parse an Indonesian activity plan into JSON. Known area ids: ${[...AREA_IDS].join(", ")}. Use the closest known area id, or null when the text names no place. budgetMax is a rupiah integer; "100 ribuan" means 100000. chatLevel reflects how much conversation the plan implies.`,
    user: body.data.text.slice(0, 500),
    schema: AiResult,
    schemaName: "ParsedActivity",
    maxTokens: 2_000,
    temperature: 0,
  });

  if (!outcome.ok) {
    warn("ai.parse", outcome.failure);
    return NextResponse.json({ data: fallback, source: "fallback", degraded: degradedNote(outcome.failure) });
  }
  return NextResponse.json({ data: merge(outcome.value, fallback), source: "ai" });
}
