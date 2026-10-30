export type Locale = "en" | "id";

export type Gender = "female" | "male";

export type VerificationStatus = "unverified" | "pending" | "verified";

export type ChatLevel = "quiet" | "moderate" | "chatty";

export type RadiusOption = "own_area" | "km5" | "km10" | "km25" | "jabodetabek";

export type GenderPreference = "any" | "female" | "male";

export type MatchMode = "one_on_one" | "small_group" | "any";

export type MbtiPreferenceMode = "any" | "same" | "specific";

export type Category =
  | "movie"
  | "coffee"
  | "study"
  | "shopping"
  | "sports"
  | "food"
  | "music"
  | "other";

export type DistanceBand =
  | "same_area"
  | "km3_5"
  | "km5_10"
  | "km10_25"
  | "beyond";

export type ActivityStatus =
  | "open"
  | "matched"
  | "confirmed"
  | "completed"
  | "cancelled";

export type EnergyProfile = {
  socialEnergy: "low" | "medium" | "high";
  chatStyle: ChatLevel;
  spontaneity: "planner" | "balanced" | "spontaneous";
  setting: "indoor" | "outdoor" | "both";
};

export type Area = {
  id: string;
  name: string;
  city: string;
  zone: "jaksel" | "jakpus" | "jakbar" | "jakut" | "jaktim" | "depok" | "tangerang" | "bekasi";
  center: { lat: number; lng: number };
};

export type InterestId =
  | "film"
  | "coffee"
  | "study"
  | "sports"
  | "food"
  | "music"
  | "books"
  | "gaming"
  | "art"
  | "photography";

export type User = {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string;
  areaId: string;
  avatarInitials: string;
  mbti: string | null;
  interests: InterestId[];
  energyProfile: EnergyProfile;
  safety: { publicPlacesOnly: boolean; groupOk: boolean };
  verification: VerificationStatus;
  trustScore: number;
  reliability: number;
  activitiesCompleted: number;
  bio: { en: string; id: string };
  isDemoPersona: boolean;
};

export type RuleField<T> = { value: T; required: boolean };

export type ActivityRules = {
  chatLevel: RuleField<ChatLevel>;
  mbti: { mode: MbtiPreferenceMode; types: string[]; required: boolean };
  interest: { id: InterestId | null; required: boolean };
  mode: RuleField<MatchMode>;
  radius: { value: RadiusOption; hardFilter: boolean };
  gender: { value: GenderPreference; hardFilter: boolean };
};

export type Activity = {
  id: string;
  creatorId: string;
  category: Category;
  description: string;
  startsAt: string;
  // Optional: seeds and legacy stored states predate it; callers fall back to startsAt.
  createdAt?: string;
  areaId: string;
  venueName: string | null;
  budgetMin: number;
  budgetMax: number;
  partySize: number;
  source: "form" | "free_text";
  status: ActivityStatus;
  rules: ActivityRules;
};

export type ScoreBreakdown = {
  gender: number;
  interest: number;
  energy: number;
  context: number;
  trust: number;
};

export type ChecklistItem = {
  key: string;
  met: boolean;
  required: boolean;
};

export type Match = {
  id: string;
  activityId: string;
  candidateId: string;
  scores: ScoreBreakdown;
  total: number;
  distanceBand: DistanceBand;
  checklist: ChecklistItem[];
  outsideGenderPreference: boolean;
  explanation: { en: string; id: string };
  icebreakers: { en: string[]; id: string[] };
  status: "suggested" | "selected" | "rejected";
};

export type Message = {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
  held: boolean;
  heldReason: "phone_pattern" | "social_handle" | "ai_safety_check" | null;
};

export type Meetup = {
  id: string;
  matchId: string;
  venueName: string;
  areaId: string;
  scheduledAt: string;
  checklistCreator: boolean;
  checklistCandidate: boolean;
  checklistTicks?: [boolean, boolean, boolean];
  confirmedByCreatorAt: string | null;
  confirmedByCandidateAt: string | null;
  planSharedAt: string | null;
  status: "pending" | "confirmed" | "completed" | "no_show";
};

export type Checkin = {
  id: string;
  meetupId: string;
  userId: string;
  status: "prompted" | "safe" | "no_response";
  respondedAt: string | null;
};

export type Review = {
  id: string;
  meetupId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  tags: string[];
  comment: string;
  reportedNoShow: boolean;
  createdAt: string;
};

export type Venue = {
  id: string;
  name: string;
  areaId: string;
  category: Category;
  note: { en: string; id: string };
  budgetBand: "low" | "mid" | "high";
};

export type TrustedContact = {
  name: string;
  channel: "whatsapp" | "sms" | "email";
  destination: string;
};

export type Mood = "chill" | "hype" | "cozy" | "focus" | "romantic" | "blue";

export type Spot = {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  moods: Mood[];
};

export type Photo = {
  id: string;
  label: string;
  src: string;
  gradient: string;
  moods: Mood[];
};

export type PostVisibility = "public" | "members";

export type Post = {
  id: string;
  authorId: string;
  activityId: string | null;
  kind: "recap" | "moment";
  body: string;
  photoId: string | null;
  songId: string | null;
  visibility: PostVisibility;
  areaId: string;
  createdAt: string;
};

export type AuthorReview = {
  id: string;
  activityId: string;
  reviewerId: string;
  authorId: string;
  rating: number;
  tags: string[];
  comment: string;
  createdAt: string;
};
