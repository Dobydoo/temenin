import { z } from "zod";
import type { State } from "./types";

export const STORAGE_KEY = "temenin.state.v6";
export const LEGACY_KEYS = ["temenin.state.v5", "temenin.state.v2"] as const;

const Locale = z.enum(["en", "id"]);
const Mode = z.enum(["system", "light", "dark"]);
const Verification = z.enum(["unverified", "pending", "verified"]);
const Gender = z.enum(["female", "male"]);
const ChatLevel = z.enum(["quiet", "moderate", "chatty"]);
const InterestId = z.enum(["film", "coffee", "study", "sports", "food", "music", "books", "gaming", "art", "photography"]);
const Category = z.enum(["movie", "coffee", "study", "shopping", "sports", "food", "music", "other"]);

const EnergyProfile = z.object({
  socialEnergy: z.enum(["low", "medium", "high"]),
  chatStyle: ChatLevel,
  spontaneity: z.enum(["planner", "balanced", "spontaneous"]),
  setting: z.enum(["indoor", "outdoor", "both"]),
});

const ViewerProfile = z.object({
  name: z.string(),
  gender: Gender,
  birthDate: z.string(),
  areaId: z.string(),
  mbti: z.string().nullable(),
  interests: z.array(InterestId),
  energyProfile: EnergyProfile,
  aboutMe: z.string(),
});

const ActivityRules = z.object({
  chatLevel: z.object({ value: ChatLevel, required: z.boolean() }),
  mbti: z.object({ mode: z.enum(["any", "same", "specific"]), types: z.array(z.string()), required: z.boolean() }),
  interest: z.object({ id: InterestId.nullable(), required: z.boolean() }),
  mode: z.object({ value: z.enum(["one_on_one", "small_group", "any"]), required: z.boolean() }),
  radius: z.object({ value: z.enum(["own_area", "km5", "km10", "km25", "jabodetabek"]), hardFilter: z.boolean() }),
  gender: z.object({ value: z.enum(["any", "female", "male"]), hardFilter: z.boolean() }),
});

const Activity = z.object({
  id: z.string(),
  creatorId: z.string(),
  category: Category,
  description: z.string(),
  startsAt: z.string(),
  createdAt: z.string().optional(),
  areaId: z.string(),
  venueName: z.string().nullable(),
  budgetMin: z.number(),
  budgetMax: z.number(),
  partySize: z.number(),
  openGroup: z.boolean().optional(),
  durationMin: z.number().optional(),
  source: z.enum(["form", "free_text"]),
  status: z.enum(["open", "matched", "confirmed", "completed", "cancelled"]),
  rules: ActivityRules,
});

const Message = z.object({
  id: z.string(),
  matchId: z.string(),
  senderId: z.string(),
  body: z.string(),
  createdAt: z.string(),
  held: z.boolean(),
  heldReason: z.enum(["phone_pattern", "social_handle", "ai_safety_check"]).nullable(),
});

const Meetup = z.object({
  id: z.string(),
  matchId: z.string(),
  venueName: z.string(),
  areaId: z.string(),
  scheduledAt: z.string(),
  checklistCreator: z.boolean(),
  checklistCandidate: z.boolean(),
  checklistTicks: z.tuple([z.boolean(), z.boolean(), z.boolean()]).optional(),
  confirmedByCreatorAt: z.string().nullable(),
  confirmedByCandidateAt: z.string().nullable(),
  planSharedAt: z.string().nullable(),
  status: z.enum(["pending", "confirmed", "completed", "no_show"]),
});

const Checkin = z.object({
  id: z.string(),
  meetupId: z.string(),
  userId: z.string(),
  status: z.enum(["prompted", "safe", "no_response"]),
  respondedAt: z.string().nullable(),
});

const Review = z.object({
  id: z.string(),
  meetupId: z.string(),
  reviewerId: z.string(),
  revieweeId: z.string(),
  rating: z.number(),
  tags: z.array(z.string()),
  comment: z.string(),
  reportedNoShow: z.boolean(),
  createdAt: z.string(),
});

const Post = z.object({
  id: z.string(),
  authorId: z.string(),
  activityId: z.string().nullable(),
  kind: z.enum(["recap", "moment"]),
  body: z.string(),
  photoId: z.string().nullable(),
  songId: z.string().nullable(),
  visibility: z.enum(["public", "members"]),
  areaId: z.string(),
  createdAt: z.string(),
});

const AuthorReview = z.object({
  id: z.string(),
  activityId: z.string(),
  reviewerId: z.string(),
  authorId: z.string(),
  rating: z.number(),
  tags: z.array(z.string()),
  comment: z.string(),
  createdAt: z.string(),
});

// Stored payloads merge over the seed INITIAL, so every top-level field is
// optional; any field that IS present must fully validate, or the whole
// payload is discarded and the app falls back to seeds.
const StoredState = z
  .object({
    viewerId: z.string().nullable(),
    locale: Locale,
    mode: Mode,
    verification: Verification,
    profile: ViewerProfile,
    activities: z.array(Activity),
    savedRules: ActivityRules.nullable(),
    selected: z.record(z.string(), z.string()),
    joins: z.record(z.string(), z.array(z.string())),
    approved: z.record(z.string(), z.array(z.string())),
    confirms: z.record(z.string(), z.array(z.string())),
    removed: z.record(z.string(), z.array(z.string())),
    blocked: z.record(z.string(), z.array(z.string())),
    reported: z.record(z.string(), z.array(z.string())),
    hiddenPlans: z.record(z.string(), z.array(z.string())),
    messages: z.array(Message),
    meetups: z.array(Meetup),
    checkins: z.array(Checkin),
    reviews: z.array(Review),
    planShared: z.record(z.string(), z.boolean()),
    posts: z.array(Post),
    following: z.array(z.string()),
    authorReviews: z.array(AuthorReview),
  })
  .partial();

export function parseStoredState(raw: string): Partial<State> | null {
  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) return null;
  // Per-key validation: one stale field must not discard the whole session.
  // Null (not {}) when nothing validates, so the key chain keeps looking.
  const kept: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(StoredState.shape)) {
    const value = (json as Record<string, unknown>)[key];
    if (value === undefined) continue;
    const parsed = schema.safeParse(value);
    if (parsed.success) kept[key] = parsed.data;
  }
  return Object.keys(kept).length > 0 ? (kept as Partial<State>) : null;
}

export function readStoredState(read: (key: string) => string | null): Partial<State> | null {
  for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
    const raw = read(key);
    if (!raw) continue;
    const parsed = parseStoredState(raw);
    if (parsed) return parsed;
  }
  return null;
}
