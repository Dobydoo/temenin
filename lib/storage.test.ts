import { test } from "node:test";
import assert from "node:assert/strict";
import { LEGACY_KEYS, STORAGE_KEY, parseStoredState, readStoredState } from "./storage.ts";

const validActivity = {
  id: "a-test",
  creatorId: "u-nadia",
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
  rules: {
    chatLevel: { value: "moderate", required: false },
    mbti: { mode: "any", types: [], required: false },
    interest: { id: "film", required: false },
    mode: { value: "any", required: false },
    radius: { value: "km10", hardFilter: false },
    gender: { value: "any", hardFilter: false },
  },
};

test("stored state with a corrupt payload falls back instead of crashing", () => {
  assert.equal(parseStoredState("not-json{"), null);
  assert.equal(parseStoredState(JSON.stringify({ viewerId: 123 })), null);
  assert.equal(parseStoredState(JSON.stringify({ activities: [{ id: 1 }] })), null);
  assert.equal(parseStoredState(JSON.stringify(["array", "not", "state"])), null);
});

test("stored state keeps valid partial fields over the seed defaults", () => {
  const parsed = parseStoredState(
    JSON.stringify({ viewerId: "u-arif", locale: "id", mode: "dark", verification: "verified", activities: [validActivity] }),
  );
  assert.ok(parsed);
  assert.equal(parsed.viewerId, "u-arif");
  assert.equal(parsed.locale, "id");
  assert.equal(parsed.activities?.length, 1);
  assert.equal(parsed.activities?.[0]?.id, "a-test");
});

test("stored state drops unknown keys instead of rejecting the payload", () => {
  const parsed = parseStoredState(JSON.stringify({ locale: "en", futureField: { nested: true } }));
  assert.ok(parsed);
  assert.equal(parsed.locale, "en");
  assert.ok(!("futureField" in (parsed as Record<string, unknown>)));
});

test("stored state keeps valid fields when one field is stale", () => {
  const parsed = parseStoredState(JSON.stringify({ viewerId: "u-arif", locale: "id", activities: [{ id: 1 }] }));
  assert.ok(parsed);
  assert.equal(parsed.viewerId, "u-arif");
  assert.equal(parsed.locale, "id");
  assert.ok(!("activities" in parsed));
});

test("stored state is read from the newest key that validates", () => {
  const db = new Map<string, string>([
    [STORAGE_KEY, "corrupt{"],
    [LEGACY_KEYS[0] as string, JSON.stringify({ locale: "id" })],
  ]);
  const parsed = readStoredState((key) => db.get(key) ?? null);
  assert.ok(parsed);
  assert.equal(parsed.locale, "id");
  assert.equal(readStoredState(() => null), null);
  assert.equal(readStoredState(() => "corrupt{"), null);
});
