import { NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";
import { AREA_BY_ID } from "@/lib/data/areas";
import { VENUES } from "@/lib/data/venues";
import { askMetaModel, degradedNote, mockEnabled, warn } from "@/lib/ai";

const Body = z.object({
  activityId: z.string().min(1).max(100),
  areaId: z.string().min(1).max(64),
  category: z.string().min(1).max(32),
  budgetMax: z.number().int().min(0).max(10000000),
  locale: z.enum(["en", "id"]).optional().default("id"),
});

const limited = createRateLimiter(20, 60_000);

const AiResult = z.object({
  order: z.array(z.string()).max(10),
  line: z.string().min(1).max(300),
});

const venueIds = (areaId: string) =>
  VENUES.filter((venue) => venue.areaId === areaId).map((venue) => venue.id);

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const empty = { order: [], line: "" };
  if (mockEnabled()) return NextResponse.json({ data: empty, source: "fallback", mock: true });

  const { areaId, category, budgetMax, locale } = body.data;
  const candidates = venueIds(areaId);
  if (candidates.length === 0) return NextResponse.json({ data: empty, source: "fallback" });

  const area = AREA_BY_ID.get(areaId);
  const outcome = await askMetaModel({
    tag: "ai.venues",
    developer: `Pick public meetup spots ranked best-first from this id list only: ${candidates.join(", ")}. Plan: ${category}, area ${area?.name ?? areaId}, budget max ${budgetMax} rupiah. order holds up to 3 ids from the list. line explains the top pick in one sentence, at most 140 characters, in ${locale === "id" ? "Indonesian" : "English"}.`,
    user: `Rank for ${category} under ${budgetMax}.`,
    schema: AiResult,
    maxTokens: 2_000,
    temperature: 0.3,
  });

  if (!outcome.ok) {
    warn("ai.venues", outcome.failure);
    return NextResponse.json({ data: empty, source: "fallback", degraded: degradedNote(outcome.failure) });
  }

  const order = outcome.value.order.filter((id) => candidates.includes(id)).slice(0, 3);
  const line = outcome.value.line.trim().slice(0, 200);
  if (order.length === 0 || !line) {
    return NextResponse.json({ data: empty, source: "fallback", degraded: "shape" });
  }
  return NextResponse.json({ data: { order, line }, source: "ai" });
}
