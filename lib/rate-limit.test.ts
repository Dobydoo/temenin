import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "./rate-limit.ts";

test("rate limiter allows the first N hits then blocks", () => {
  const limited = createRateLimiter(3, 60_000, () => 0);
  assert.equal(limited("ip"), false);
  assert.equal(limited("ip"), false);
  assert.equal(limited("ip"), false);
  assert.equal(limited("ip"), true);
});

test("rate limiter isolates keys from each other", () => {
  const limited = createRateLimiter(1, 60_000, () => 0);
  assert.equal(limited("a"), false);
  assert.equal(limited("a"), true);
  assert.equal(limited("b"), false);
});

test("rate limiter forgets hits outside the window", () => {
  let at = 0;
  const limited = createRateLimiter(1, 60_000, () => at);
  assert.equal(limited("ip"), false);
  assert.equal(limited("ip"), true);
  at = 60_001;
  assert.equal(limited("ip"), false);
});
