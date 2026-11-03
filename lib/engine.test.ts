import { test } from "node:test";
import type { ContactVerdict } from "./engine.ts";
import assert from "node:assert/strict";
import { distanceBand, distanceKm, inspectMessage, parseFreeText, rankCandidates, recommendVenues } from "./engine.ts";
import { AREA_BY_ID } from "./data/areas.ts";
import { PERSONAS, VIEWER } from "./data/users.ts";
import { VENUES } from "./data/venues.ts";
import { exactVenueVisible, visibleActivityFor } from "./privacy.ts";
import type { Activity, ActivityRules } from "./types.ts";

const rules = (overrides: Partial<ActivityRules> = {}): ActivityRules => ({
  chatLevel: { value: "moderate", required: false },
  mbti: { mode: "any", types: [], required: false },
  interest: { id: "film", required: false },
  mode: { value: "any", required: false },
  radius: { value: "km10", hardFilter: false },
  gender: { value: "any", hardFilter: false },
  ...overrides,
});

const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: "a-test",
  creatorId: VIEWER.id,
  category: "movie",
  description: "Test plan",
  startsAt: "2026-10-31T16:30:00+07:00",
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

test("distance bands never expose a precise number", () => {
  assert.equal(distanceBand(0.4), "same_area");
  assert.equal(distanceBand(4), "km3_5");
  assert.equal(distanceBand(7.5), "km5_10");
  assert.equal(distanceBand(17), "km10_25");
  assert.equal(distanceBand(60), "beyond");
  const tebet = AREA_BY_ID.get("tebet");
  const bintaro = AREA_BY_ID.get("bintaro");
  assert.ok(tebet && bintaro);
  assert.ok(distanceKm(tebet, bintaro) > 10);
});

test("gender preference is the heaviest component and labels outsiders", () => {
  const ranked = rankCandidates(activity({ rules: rules({ gender: { value: "female", hardFilter: false } }) }), PERSONAS, VIEWER);
  const outsider = ranked.find((match) => match.outsideGenderPreference);
  const insider = ranked.find((match) => !match.outsideGenderPreference);
  assert.ok(outsider && insider);
  assert.equal(outsider.scores.gender, 0);
  assert.ok(ranked[0]?.outsideGenderPreference === false, "top match respects the gender preference");
  assert.ok(ranked.indexOf(outsider) > ranked.indexOf(insider));
});

test("required rules filter candidates instead of only reordering", () => {
  const strict = rankCandidates(activity({ rules: rules({ chatLevel: { value: "quiet", required: true } }) }), PERSONAS, VIEWER);
  const loose = rankCandidates(activity({ rules: rules({ chatLevel: { value: "quiet", required: false } }) }), PERSONAS, VIEWER);
  assert.ok(strict.length < loose.length);
  assert.ok(strict.every((match) => match.checklist.find((item) => item.key === "chat")?.met));
});

test("an empty result explains itself rather than inventing a candidate", () => {
  const impossible = rankCandidates(
    activity({ rules: rules({ radius: { value: "own_area", hardFilter: true }, interest: { id: "gaming", required: true } }) }),
    PERSONAS,
    VIEWER,
  );
  assert.ok(impossible.every((match) => match.candidateId !== VIEWER.id));
  assert.ok(impossible.every((match) => match.checklist.every((item) => !item.required || item.met)));
});

test("the same plan and people always produce the same order", () => {
  const plan = activity();
  const first = rankCandidates(plan, PERSONAS, VIEWER).map((match) => `${match.candidateId}:${match.total}`);
  const second = rankCandidates(plan, PERSONAS, VIEWER).map((match) => `${match.candidateId}:${match.total}`);
  assert.deepEqual(first, second);
});

test("contact details are held until both sides confirm", () => {
  assert.equal(inspectMessage("nomor aku 081234567890", false).held, true);
  assert.equal(inspectMessage("add me @nadia.p", false).held, true);
  assert.equal(inspectMessage("nol delapan satu dua tiga empat lima enam tujuh", false).held, true);
  assert.equal(inspectMessage("nomor aku 081234567890", true).held, false);
  assert.equal(inspectMessage("kita ketemu di depan bioskop", false).held, false);
});

test("spelled-out numbers using kosong and lapan are held", () => {
  assert.equal(inspectMessage("nomor aku kosong delapan satu dua tiga empat lima enam tujuh", false).held, true);
  assert.equal(inspectMessage("kosong lapan satu dua tiga empat lima enam", false).held, true);
});

test("invisible separators do not defeat the digit scan", () => {
  const ZWSP = String.fromCharCode(0x200b);
  const zeroWidth = "081234567890".split("").join(ZWSP);
  assert.equal(inspectMessage(`hub ${zeroWidth} ya`, false).held, true);
});

test("possessive platform handles are held", () => {
  assert.equal(inspectMessage("ig-ku nadia_prameswari", false).held, true);
  assert.equal(inspectMessage("follow line-ku nadia.p ya", false).held, true);
  assert.equal(inspectMessage("antre in line with the others", false).held, false);
});

test("platform abbreviations and handle phrasings are held", () => {
  assert.equal(inspectMessage("chat gw di tele: nadia_p", false).held, true);
  assert.equal(inspectMessage("lineid nadia.p", false).held, true);
  assert.equal(inspectMessage("line-id: nadia_p", false).held, true);
  assert.equal(inspectMessage("add line gw nadia.p", false).held, true);
  assert.equal(inspectMessage("line ku nadia_prameswari", false).held, true);
});

test("platform words inside ordinary prose pass through", () => {
  assert.equal(inspectMessage("telepon aku kalau sudah sampai", false).held, false);
  assert.equal(inspectMessage("deadline aku besok pagi", false).held, false);
  assert.equal(inspectMessage("line kuota habis", false).held, false);
});

test("emoji separators do not defeat the digit scan", () => {
  const grin = String.fromCodePoint(0x1f600);
  const run = "081234567890".split("").join(grin);
  assert.equal(inspectMessage(`hub ${run} ya`, false).held, true);
  assert.equal(inspectMessage(`ketemu jam 8${grin}malam di depan`, false).held, false);
});

test("email addresses are held as contact details", () => {
  const verdict = inspectMessage("email aku nadia.prameswari@gmail.com ya", false);
  assert.equal(verdict.held, true);
  assert.equal(verdict.reason, "social_handle");
  assert.equal(inspectMessage("kirim ke alamat kantor ya", false).held, false);
});

test("ordinary plans with numbers and times pass through", () => {
  assert.equal(inspectMessage("ketemu jam 8 malam di depan", false).held, false);
  assert.equal(inspectMessage("budget 100 ribuan, patungan 50000", false).held, false);
  assert.equal(inspectMessage("filmnya mulai 19.30, datang jam 18.00", false).held, false);
  assert.equal(inspectMessage("my big idea for tonight", false).held, false);
});

test("free text becomes a draft and reports what it could not read", () => {
  const parsed = parseFreeText("Sabtu sore mau nonton di daerah Tebet, budget 100 ribuan, pengen teman yang asik diajak ngobrol");
  assert.equal(parsed.category, "movie");
  assert.equal(parsed.areaId, "tebet");
  assert.equal(parsed.budgetMax, 100000);
  assert.equal(parsed.chatLevel, "chatty");
  assert.deepEqual(parsed.missing, []);

  const vague = parseFreeText("pengen ketemu orang baru");
  assert.equal(vague.category, "other");
  assert.equal(vague.areaId, null);
  assert.ok(vague.missing.includes("category"));
  assert.ok(vague.missing.includes("area"));
});

test("venue suggestions stay inside the curated list and the plan's area", () => {
  const suggestions = recommendVenues(activity(), VENUES, "en");
  assert.ok(suggestions.length > 0);
  for (const { venue } of suggestions) {
    assert.ok(VENUES.some((entry) => entry.id === venue.id));
    assert.equal(venue.areaId, "tebet");
  }
});

test("unverified viewers receive no name, area or time from the data layer", () => {
  const plan = activity();
  const sealed = visibleActivityFor(plan, "unverified");
  assert.equal(sealed.creatorId, null);
  assert.equal(sealed.areaId, null);
  assert.equal(sealed.startsAt, null);
  assert.equal(sealed.description, plan.description);

  const open = visibleActivityFor(plan, "verified");
  assert.equal(open.creatorId, plan.creatorId);
  assert.equal(open.startsAt, plan.startsAt);
});

test("the exact venue waits for both confirmations", () => {
  const base = {
    id: "mu-1",
    matchId: "a-test:u-arif",
    venueName: "Cinema 21 Tebet",
    areaId: "tebet",
    scheduledAt: "2026-10-31T16:30:00+07:00",
    checklistCreator: true,
    checklistCandidate: true,
    confirmedByCreatorAt: "2026-10-30T10:00:00+07:00",
    confirmedByCandidateAt: null,
    planSharedAt: null,
    status: "pending" as const,
  };
  assert.equal(exactVenueVisible(base), false);
  assert.equal(exactVenueVisible({ ...base, confirmedByCandidateAt: "2026-10-30T11:00:00+07:00" }), true);
});

test("ai safety verdict rides the held channel without touching pattern filter", () => {
  const verdict: ContactVerdict = { held: true, reason: "ai_safety_check" };
  assert.equal(verdict.held, true);
  assert.equal(verdict.reason, "ai_safety_check");
  assert.equal(inspectMessage("kita ketemu di depan bioskop", false).held, false);
});

test("venue fallback never leaves the curated list or plan area", () => {
  const suggestions = recommendVenues(activity(), VENUES, "id");
  assert.ok(suggestions.length > 0 && suggestions.length <= 3);
  for (const { venue } of suggestions) {
    assert.ok(VENUES.some((entry) => entry.id === venue.id));
    assert.equal(venue.areaId, "tebet");
  }
});
