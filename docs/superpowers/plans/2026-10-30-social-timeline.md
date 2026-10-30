# Social Timeline Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Design: `docs/superpowers/specs/2026-10-30-social-timeline-design.md` (approved, globe amendment included).
Constraints: front-end only, no new runtime deps, bilingual en/id, light+dark, `temenin.state.v2` storage key (bump only if old shape breaks load).

## File map

- `lib/types.ts` — add `Post`, `AuthorReview`, `Song`, `Photo`, `Spot`, `Mood`, `profile.aboutMe`.
- `lib/social.ts` (new) — pure logic: `visiblePosts`, `trendingScores`, `suggestSongs`, `authorAggregate`. Unit-tested.
- `lib/data/spots.ts`, `lib/data/songs.ts`, `lib/data/photos.ts`, `lib/data/posts.ts` (new seeds).
- `lib/data/land-dots.json` (generated, committed) + `scripts/generate-globe-dots.mjs` (one-time, needs network once).
- `lib/store.tsx` — extend state: `posts`, `following`, `authorReviews`, `profile.aboutMe`.
- `components/PostCard.tsx`, `components/Composer.tsx`, `components/Globe.tsx` (new).
- `app/page.tsx` (timeline), `app/trending/page.tsx` (new), `app/you/page.tsx` (about me), match/detail + plan pages (review + recap entries).
- `lib/i18n.ts` — new keys per slice. `lib/social.test.ts` — unit tests (`npm test` runs `tsx --test lib/*.test.ts`).

## Slice 1 — Data model, seeds, pure logic

- [ ] Types: `Post`, `AuthorReview`, `Song`, `Photo`, `Spot`, `Mood`; `profile.aboutMe` in store profile type.
- [ ] Seeds: 10 spots, 12 songs, 8 photos, ~15 posts (mixed visibility/areas), 3–5 author reviews.
- [ ] `lib/social.ts`: `visiblePosts(posts, viewerId, following, joins)`, `suggestSongs(photo, songs)`, `authorAggregate(reviews, authorId)`, `trendingScores(activities, joins, reviews)`.
- [ ] `lib/social.test.ts`: visibility rules (members-only hidden from outsiders), song ranking by mood overlap, aggregate math, trending ordering.
- [ ] Run: `npm test`, `npm run typecheck`. Commit.

## Slice 2 — Home timeline + follow

- [ ] `PostCard`: header (avatar, name, follow btn, time), linked-plan chip, photo, song card, visibility badge.
- [ ] `app/page.tsx`: hero stays; board section → tabs For You / Following / Nearby using `visiblePosts`.
- [ ] Follow/unfollow updates `following`; Following tab + button states reflect it.
- [ ] Run: `npm test`, `typecheck`, `lint`. Commit.

## Slice 3 — Reviews + recap posts

- [ ] Finished-plan entry points ("Review the author", "Post about this plan") for creator + joiners.
- [ ] Review form (stars, tags, comment), one per reviewer per plan; aggregate on author posts/profile snippet.
- [ ] Recap composer pre-linked to plan with public/members-only radio; general moments via `Composer`.
- [ ] Run: `npm test`, `typecheck`, `lint`. Commit.

## Slice 4 — Songs + photo-mood suggestions

- [ ] Photo picker in composer; `suggestSongs` powers "Suggested for this photo"; browse-all fallback; song card on post.
- [ ] Run: `npm test`, `typecheck`, `lint`. Commit.

## Slice 5 — Trending + globe

- [ ] `scripts/generate-globe-dots.mjs` + committed `land-dots.json` (graticule+pin fallback when absent).
- [ ] `components/Globe.tsx`: canvas orthographic, drag-rotate, auto-spin (reduced-motion off), pins by score, click-to-select spot.
- [ ] `app/trending/page.tsx`: spot switcher + ranked list with "why trending" lines.
- [ ] Run: `npm test`, `typecheck`, `lint`, `npm run build`. Commit.

## Slice 6 — About me + i18n sweep

- [ ] `app/you/page.tsx`: about-me textarea → profile card; missing-key sweep en/id across all slices.
- [ ] Run full: `npm test`, `typecheck`, `lint`, `build`, `smoke`. Commit.

Order: 1 → 2 → 3 → 4 → 5 → 6. Each slice is demoable on its own. Globe dots script is the only step needing network (run once, user-side).
