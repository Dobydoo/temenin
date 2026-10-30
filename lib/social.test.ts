import { test } from "node:test";
import assert from "node:assert/strict";
import { authorAggregate, suggestSongs, trendingScores, visiblePosts } from "./social.ts";
import type { Activity, AuthorReview, Photo, Post, Song } from "./types.ts";
import { rules as baseRules, activity as baseActivity } from "./test-helpers.ts";

const post = (overrides: Partial<Post> = {}): Post => ({
  id: "p-test",
  authorId: "u-arif",
  activityId: "a-sekar-coffee",
  kind: "recap",
  body: "Seru banget!",
  photoId: null,
  songId: null,
  visibility: "public",
  areaId: "tebet",
  createdAt: "2026-10-29T10:00:00+07:00",
  ...overrides,
});

test("visiblePosts hides members-only recaps from outsiders", () => {
  const mine = post({ id: "p-mine", authorId: "u-nadia", visibility: "members" });
  const joined = post({ id: "p-joined", authorId: "u-rani", visibility: "members" });
  const stranger = post({ id: "p-stranger", authorId: "u-eko", visibility: "members", activityId: "a-other" });
  const pub = post({ id: "p-pub", authorId: "u-eko", visibility: "public" });
  const out = visiblePosts([mine, joined, stranger, pub], "u-nadia", { "a-sekar-coffee": ["u-nadia", "u-rani"], "a-other": ["u-eko"] });
  const ids = out.map((p) => p.id).sort();
  assert.deepEqual(ids, ["p-joined", "p-mine", "p-pub"]);
});

test("suggestSongs ranks shared moods first", () => {
  const photo: Photo = { id: "ph-1", label: "Night gig", src: "/photos/gig.jpg", gradient: "a", moods: ["hype", "cozy"] };
  const songs: Song[] = [
    { id: "s-1", title: "Calm", artist: "X", moods: ["cozy"] },
    { id: "s-2", title: "Loud", artist: "Y", moods: ["hype", "cozy"] },
    { id: "s-3", title: "Sad", artist: "Z", moods: ["blue"] },
  ];
  assert.deepEqual(suggestSongs(photo, songs).map((s) => s.id), ["s-2", "s-1", "s-3"]);
});

test("authorAggregate averages ratings", () => {
  const reviews: AuthorReview[] = [
    { id: "r1", activityId: "a1", reviewerId: "u-a", authorId: "u-arif", rating: 5, tags: [], comment: "", createdAt: "2026-10-28T10:00:00+07:00" },
    { id: "r2", activityId: "a2", reviewerId: "u-b", authorId: "u-arif", rating: 3, tags: [], comment: "", createdAt: "2026-10-29T10:00:00+07:00" },
  ];
  assert.deepEqual(authorAggregate(reviews, "u-arif"), { average: 4, count: 2 });
  assert.equal(authorAggregate(reviews, "u-nobody"), null);
});

test("trendingScores ranks joined recent plans first", () => {
  const now = new Date("2026-10-31T12:00:00+07:00").getTime();
  const hot = baseActivity({ id: "a-hot", areaId: "kemang" });
  const cold = baseActivity({ id: "a-cold", areaId: "kemang", createdAt: "2026-09-01T10:00:00+07:00" });
  void baseRules;
  const out = trendingScores([hot, cold] as Activity[], { "a-hot": ["u-a", "u-b", "u-c"], "a-cold": [] }, [], now);
  assert.equal(out[0]?.activityId, "a-hot");
  assert.ok((out[0]?.facts.joins ?? 0) >= 3);
});
