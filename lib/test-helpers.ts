import type { Activity, ActivityRules } from "./types.ts";

export const rules = (overrides: Partial<ActivityRules> = {}): ActivityRules => ({
  chatLevel: { value: "moderate", required: false },
  mbti: { mode: "any", types: [], required: false },
  interest: { id: "film", required: false },
  mode: { value: "any", required: false },
  radius: { value: "km10", hardFilter: false },
  gender: { value: "any", hardFilter: false },
  ...overrides,
});

export const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: "a-test",
  creatorId: "u-nadia",
  category: "movie",
  description: "Test plan",
  startsAt: "2026-11-03T16:30:00+07:00",
  areaId: "tebet",
  venueName: null,
  budgetMin: 60000,
  budgetMax: 100000,
  partySize: 2,
  source: "form",
  status: "open",
  rules: rules(),
  ...overrides,
});
