import type {
  Activity,
  ActivityRules,
  Area,
  Category,
  ChatLevel,
  ChecklistItem,
  DistanceBand,
  GenderPreference,
  Match,
  RadiusOption,
  User,
  Venue,
} from "./types";
import { AREA_BY_ID, AREAS } from "./data/areas";
import { CATEGORY_INTEREST } from "./data/interests";
import type { Locale } from "./types";

export const WEIGHTS = { gender: 0.3, interest: 0.25, energy: 0.2, context: 0.15, trust: 0.1 } as const;

export const RADIUS_KM: Record<RadiusOption, number> = {
  own_area: 1,
  km5: 5,
  km10: 10,
  km25: 25,
  jabodetabek: 120,
};

const BAND_KM: Record<DistanceBand, number> = {
  same_area: 0.5,
  km3_5: 4,
  km5_10: 7.5,
  km10_25: 17,
  beyond: 40,
};

const BAND_TEXT: Record<DistanceBand, { en: string; id: string }> = {
  same_area: { en: "Same area", id: "Satu area" },
  km3_5: { en: "About 3 to 5 km", id: "Sekitar 3 sampai 5 km" },
  km5_10: { en: "About 5 to 10 km", id: "Sekitar 5 sampai 10 km" },
  km10_25: { en: "About 10 to 25 km", id: "Sekitar 10 sampai 25 km" },
  beyond: { en: "Outside your radius", id: "Di luar radiusmu" },
};

export function bandLabel(band: DistanceBand, locale: Locale): string {
  return BAND_TEXT[band][locale];
}

export function distanceKm(a: Area, b: Area): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.center.lat - a.center.lat);
  const dLng = rad(b.center.lng - a.center.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.center.lat)) * Math.cos(rad(b.center.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceBand(km: number): DistanceBand {
  if (km < 1.5) return "same_area";
  if (km < 5) return "km3_5";
  if (km < 10) return "km5_10";
  if (km < 25) return "km10_25";
  return "beyond";
}

const CHAT_SCORE: Record<ChatLevel, number> = { quiet: 0, moderate: 1, chatty: 2 };
const SOCIAL_SCORE = { low: 0, medium: 1, high: 2 } as const;

function energyFit(owner: User, candidate: User): number {
  const social = 1 - Math.abs(SOCIAL_SCORE[owner.energyProfile.socialEnergy] - SOCIAL_SCORE[candidate.energyProfile.socialEnergy]) / 2;
  const chat = 1 - Math.abs(CHAT_SCORE[owner.energyProfile.chatStyle] - CHAT_SCORE[candidate.energyProfile.chatStyle]) / 2;
  const spontaneity = owner.energyProfile.spontaneity === candidate.energyProfile.spontaneity ? 1 : 0.55;
  const setting =
    owner.energyProfile.setting === candidate.energyProfile.setting || owner.energyProfile.setting === "both" || candidate.energyProfile.setting === "both"
      ? 1
      : 0.6;
  return social * 0.3 + chat * 0.3 + spontaneity * 0.2 + setting * 0.2;
}

export function requiredFieldCount(rules: ActivityRules): number {
  return [rules.chatLevel.required, rules.mbti.required, rules.interest.required, rules.mode.required].filter(Boolean).length;
}

export function meetsRequired(rules: ActivityRules, owner: User, candidate: User, band: DistanceBand): boolean {
  if (rules.gender.hardFilter && rules.gender.value !== "any" && candidate.gender !== rules.gender.value) return false;
  if (rules.radius.hardFilter && BAND_KM[band] > RADIUS_KM[rules.radius.value]) return false;
  if (rules.chatLevel.required && Math.abs(CHAT_SCORE[rules.chatLevel.value] - CHAT_SCORE[candidate.energyProfile.chatStyle]) > 1) return false;
  if (rules.interest.required && rules.interest.id && !candidate.interests.includes(rules.interest.id)) return false;
  if (rules.mbti.required) {
    if (rules.mbti.mode === "same" && candidate.mbti !== owner.mbti) return false;
    if (rules.mbti.mode === "specific" && (!candidate.mbti || !rules.mbti.types.includes(candidate.mbti))) return false;
  }
  return true;
}

function buildChecklist(activity: Activity, owner: User, candidate: User, band: DistanceBand): ChecklistItem[] {
  const rules = activity.rules;
  const wanted = rules.interest.id ?? CATEGORY_INTEREST[activity.category];
  return [
    { key: "gender", required: rules.gender.hardFilter, met: rules.gender.value === "any" || candidate.gender === rules.gender.value },
    { key: "interest", required: rules.interest.required, met: candidate.interests.includes(wanted) },
    {
      key: "chat",
      required: rules.chatLevel.required,
      met: Math.abs(CHAT_SCORE[rules.chatLevel.value] - CHAT_SCORE[candidate.energyProfile.chatStyle]) <= 1,
    },
    { key: "radius", required: rules.radius.hardFilter, met: BAND_KM[band] <= RADIUS_KM[rules.radius.value] },
    {
      key: "mbti",
      required: rules.mbti.required,
      met: rules.mbti.mode === "same" ? candidate.mbti === owner.mbti : rules.mbti.mode !== "specific" || (candidate.mbti !== null && rules.mbti.types.includes(candidate.mbti)),
    },
    { key: "verified", required: true, met: candidate.verification === "verified" },
  ];
}

export function composeMatch(activity: Activity, owner: User, candidate: User): Match {
  const area = AREA_BY_ID.get(activity.areaId);
  const candidateArea = AREA_BY_ID.get(candidate.areaId);
  if (!area || !candidateArea) throw new Error("Unknown area in seed data");
  const band = distanceBand(distanceKm(area, candidateArea));
  const rules = activity.rules;
  const wanted = rules.interest.id ?? CATEGORY_INTEREST[activity.category];
  const km = BAND_KM[band];
  const radius = RADIUS_KM[rules.radius.value];
  const scores = {
    gender: genderScoreFor(rules.gender.value, candidate),
    interest: candidate.interests.includes(wanted) ? 1 : candidate.interests.some((id) => owner.interests.includes(id)) ? 0.6 : 0.3,
    energy: energyFit(owner, candidate),
    context: km <= radius ? 1 - (km / radius) * 0.35 : 0.15,
    trust: candidate.trustScore / 5,
  };
  const total = Math.round(
    (scores.gender * WEIGHTS.gender +
      scores.interest * WEIGHTS.interest +
      scores.energy * WEIGHTS.energy +
      scores.context * WEIGHTS.context +
      scores.trust * WEIGHTS.trust) *
      100,
  );
  const first = candidate.name.split(" ")[0] ?? candidate.name;
  const shares = candidate.interests.includes(wanted);
  const within = km <= radius;
  return {
    id: `${activity.id}:${candidate.id}`,
    activityId: activity.id,
    candidateId: candidate.id,
    scores,
    total,
    distanceBand: band,
    checklist: buildChecklist(activity, owner, candidate, band),
    outsideGenderPreference: rules.gender.value !== "any" && candidate.gender !== rules.gender.value,
    explanation: {
      en: `${first} ${shares ? `already lists ${wanted} as an interest` : `does not list ${wanted}, but shares ${candidate.interests.filter((id) => owner.interests.includes(id)).length} interests with you`}. ${
        within ? "Their area sits inside your radius." : "Their area sits outside your radius, so agree on a middle point."
      }`,
      id: `${first} ${shares ? `sudah menandai ${wanted} sebagai minat` : `belum menandai ${wanted}, tapi punya ${candidate.interests.filter((id) => owner.interests.includes(id)).length} minat yang sama`}. ${
        within ? "Areanya masuk radiusmu." : "Areanya di luar radiusmu, jadi sepakati titik tengah."
      }`,
    },
    icebreakers: {
      en: [
        `Ask ${first} what they thought of the last film they saw alone.`,
        "Pick the seat rows before you meet, so nobody waits in the lobby.",
        "Agree on the walk back to the main road before the film ends.",
      ],
      id: [
        `Tanya ${first} soal film terakhir yang dia tonton sendiri.`,
        "Pilih baris kursi sebelum ketemu, biar nggak ada yang nunggu di lobi.",
        "Sepakati jalan pulang ke jalan besar sebelum film selesai.",
      ],
    },
    status: "suggested",
  };
}

function genderScoreFor(preference: GenderPreference, candidate: User): number {
  return preference === "any" || preference === candidate.gender ? 1 : 0;
}

export function rankCandidates(activity: Activity, candidates: User[], owner: User): Match[] {
  return candidates
    .filter((candidate) => candidate.id !== owner.id && candidate.verification === "verified")
    .map((candidate) => ({ candidate, band: bandOf(activity, candidate) }))
    .filter(({ candidate, band }) => meetsRequired(activity.rules, owner, candidate, band))
    .map(({ candidate }) => composeMatch(activity, owner, candidate))
    .sort((a, b) => b.total - a.total);
}

function bandOf(activity: Activity, candidate: User): DistanceBand {
  const area = AREA_BY_ID.get(activity.areaId);
  const candidateArea = AREA_BY_ID.get(candidate.areaId);
  if (!area || !candidateArea) return "beyond";
  return distanceBand(distanceKm(area, candidateArea));
}

export type ParsedActivity = {
  category: Category;
  areaId: string | null;
  budgetMax: number;
  dayHint: string;
  chatLevel: ChatLevel;
  missing: string[];
};

const CATEGORY_WORDS: { category: Category; words: string[] }[] = [
  { category: "movie", words: ["nonton", "film", "bioskop", "movie", "cinema"] },
  { category: "coffee", words: ["ngopi", "kopi", "kafe", "cafe", "coffee"] },
  { category: "study", words: ["belajar", "study", "ujian", "tugas", "perpustakaan", "library"] },
  { category: "sports", words: ["olahraga", "lari", "futsal", "badminton", "sports", "gym"] },
  { category: "shopping", words: ["belanja", "shopping", "mall", "pasar"] },
  { category: "food", words: ["makan", "kuliner", "food", "warung", "resto"] },
  { category: "music", words: ["musik", "konser", "gig", "music", "lagu"] },
];

const DAY_WORDS = ["sabtu", "minggu", "senin", "selasa", "rabu", "kamis", "jumat", "today", "tomorrow", "besok", "saturday", "sunday"];

export function parseFreeText(input: string): ParsedActivity {
  const text = input.toLowerCase();
  const category = CATEGORY_WORDS.find((entry) => entry.words.some((word) => text.includes(word)))?.category ?? "other";
  const area = AREAS.find((entry) => text.includes(entry.name.toLowerCase()));
  const budgetDigits = /(\d{2,4})\s*(ribu|k|rb)/.exec(text)?.[1];
  const dayHint = DAY_WORDS.find((word) => text.includes(word)) ?? "";
  const chatLevel: ChatLevel = /pendiam|diam|quiet|minim ngobrol|no small talk/.test(text)
    ? "quiet"
    : /banyak ngobrol|chatty|ngobrol|talk/.test(text)
      ? "chatty"
      : "moderate";
  return {
    category,
    areaId: area?.id ?? null,
    budgetMax: budgetDigits ? Number(budgetDigits) * 1000 : 100000,
    dayHint,
    chatLevel,
    missing: [...(category === "other" ? ["category"] : []), ...(area ? [] : ["area"])],
  };
}

export type ContactVerdict = { held: boolean; reason: "phone_pattern" | "social_handle" | "ai_safety_check" | null };

export function inspectMessage(body: string, meetupConfirmed: boolean): ContactVerdict {
  if (meetupConfirmed) return { held: false, reason: null };
  // Strip invisible format chars, non-spacing marks, and pictographs so they cannot
  // split a digit run. Punctuation and symbols stay: removing "+" would join
  // "100+200" into a false phone run.
  const text = body.replace(/[\p{Cf}\p{M}\p{Extended_Pictographic}]/gu, "");
  const digits = /(?:\+?62|0)\s*8(?:[\s.-]?\d){7,12}/.test(text) || /(?:\d[\s.-]?){9,14}\d/.test(text);
  const spelled =
    /(nol|zero|kosong)\s+(satu|dua|tiga|empat|lima|enam|tujuh|delapan|lapan|sembilan|one|two|three|four|five|six|seven|eight|nine)([\s.-]+(nol|zero|kosong|satu|dua|tiga|empat|lima|enam|tujuh|delapan|lapan|sembilan|one|two|three|four|five|six|seven|eight|nine)){3,}/i.test(
      text,
    );
  if (digits || spelled) return { held: true, reason: "phone_pattern" };
  // Bare "line" stays out: too common in ordinary prose ("in line with"); only qualified
  // "line" phrasings trigger. Email rides the social_handle reason: no enum variant exists.
  if (
    /(^|\s)@[a-z0-9._]{3,}|\b(ig|insta|instagram|wa|whatsapp|tele(?:gram)?|line\s*-?\s*id)\b(-ku)?\s*[:=]?\s*[\w.@]{3,}|\bline-ku\s*[:=]?\s*[\w.@]{3,}|\bline\s*(ku|gue|gw|aku)\b\s*[:=]?\s*[\w.@]{3,}|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/i.test(
      text,
    )
  ) {
    return { held: true, reason: "social_handle" };
  }
  return { held: false, reason: null };
}

export function recommendVenues(activity: Activity, venues: Venue[], locale: Locale): { venue: Venue; reason: string }[] {
  return venues
    .filter((venue) => venue.areaId === activity.areaId)
    .map((venue) => ({
      venue,
      score: (venue.category === activity.category ? 2 : 0) + (venue.budgetBand === "high" && activity.budgetMax < 150000 ? 0 : 1),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ venue, score }) => ({
      venue,
      reason:
        locale === "en"
          ? `${venue.note.en} ${score >= 2 ? "Matches the activity type." : "Close to the agreed area."}`
          : `${venue.note.id} ${score >= 2 ? "Cocok dengan jenis aktivitasnya." : "Dekat dengan area yang disepakati."}`,
    }));
}

export type ScoreRowKey = keyof typeof WEIGHTS;

export function scoreRows(match: Match): { key: ScoreRowKey; value: number; weight: number }[] {
  return (Object.keys(WEIGHTS) as ScoreRowKey[]).map((key) => ({
    key,
    value: match.scores[key],
    weight: WEIGHTS[key],
  }));
}
