import { NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";
import { AREA_BY_ID } from "@/lib/data/areas";
import { VENUES } from "@/lib/data/venues";

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

async function tryMetaAi(
  areaId: string,
  category: string,
  budgetMax: number,
  locale: "en" | "id",
): Promise<{ order: string[]; line: string } | null> {
  const url = process.env.META_MODEL_URL;
  const key = process.env.META_MODEL_API_KEY;
  if (!url || !key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const area = AREA_BY_ID.get(areaId);
    const candidates = venueIds(areaId);
    if (candidates.length === 0) return null;
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.META_MODEL_NAME ?? "muse-spark",
        messages: [
          {
            role: "system",
            content: `Pick public meetup spots from this id list only: ${candidates.join(",")}. Plan: ${category}, area ${area?.name ?? areaId}, budget max ${budgetMax} rupiah. Reply JSON only: {"order": ["id", ...up to 3 from the list], "line": "one sentence, max 140 chars, in ${locale === "id" ? "Indonesian" : "English"}, why the top pick fits"}. Never invent ids.`,
          },
          { role: "user", content: `Rank for ${category} under ${budgetMax}.` },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = /{[\s\S]*}/.exec(content)?.[0];
    if (!match) return null;
    const parsed = AiResult.safeParse(JSON.parse(match));
    if (!parsed.success) return null;
    const valid = parsed.data.order.filter((id) => candidates.includes(id)).slice(0, 3);
    const line = parsed.data.line.trim().slice(0, 200);
    if (valid.length === 0 || !line) return null;
    return { order: valid, line };
  } catch {
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
    return NextResponse.json({ data: { order: [], line: "" }, source: "fallback", mock: true });
  if (!process.env.META_MODEL_URL || !process.env.META_MODEL_API_KEY)
    return NextResponse.json({ data: { order: [], line: "" }, source: "fallback" });
  const ai = await tryMetaAi(body.data.areaId, body.data.category, body.data.budgetMax, body.data.locale);
  if (!ai) return NextResponse.json({ data: { order: [], line: "" }, source: "fallback" });
  return NextResponse.json({ data: ai, source: "ai" });
}
