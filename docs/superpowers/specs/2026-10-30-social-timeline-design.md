# Social Timeline Rework — Design Doc

> Status: proposed · approach A (full simulated social) picked 2026-10-30 · needs partner approval before any build.

## Intent / why

Home is a plans board today. For the Meta hackathon demo it becomes an Instagram-like social timeline:
recap posts from people near the viewer and people the viewer follows. The social loop —
join a plan → finish it → review the author → post a recap with a song → get followed —
is the thing judges click through. Everything stays a front-end-only demo (seeded personas + `localStorage`).

## Goals

1. Home page becomes a timeline of posts (Nearby / Following tabs), hero greeting stays.
2. Follow / unfollow users; Following tab and post author headers reflect it.
3. After a plan is done, participants can review the plan's author (stars + tags + comment).
4. Participants can publish a recap post about a finished plan, choosing visibility
   (public vs. members-only), with optional photo and song.
5. Songs attachable to posts; picking a photo suggests matching songs (mood-tag heuristic, Instagram-style).
6. Trending plans view: heuristic "AI" ranking for the viewer's area + other areas, with a keyless map.
7. "About me" field in profile settings (You page), shown on the profile card.

## Non-goals / anti-goals

- No backend, accounts, uploads, audio playback, push, or real ML/API calls.
- Song "auto-detect" is a mood-tag match, never claimed as recognition.
- Map is a keyless SVG plot of area centers, not real map tiles.
- Failure = anything needing a key, network, or persistence beyond `localStorage`.

## Constraints

- Front-end-only Next.js app; state in `lib/store.tsx` persisted to `temenin.state.v2` (bump key if shape breaks).
- Bilingual `en`/`id` via `lib/i18n.ts`; light + dark via CSS vars; existing card/chip/btn styles in `app/globals.css`.
- Personas are hardcoded (`lib/data/users.ts`); areas carry lat/lng (`lib/data/areas.ts`).
- An existing `Review` type is meetup-based — do not disturb it; author reviews are a new type.

## Approaches considered

- **A. Full simulated social (picked).** All seven features, seeded + `localStorage`, keyless heuristics.
  Trades raw "real AI" sparkle for zero demo-day risk; everything clickable offline. Fits the hackathon-brief
  reason: judges experience the loop, not the infrastructure.
- **B. Llama inside (rejected).** Real API calls for trending/song/review summaries. Rejected: needs a key +
  network on stage, fallback complexity, and partner confirmed demo-prototype scope.
- **C. Timeline-first, rest staged (rejected).** Safer for tight deadlines but thinnest demo; rejected because
  partner wants the full loop visible.

## Design (what gets built)

### 1. Data model (additions to `lib/types.ts`, state in `lib/store.tsx`, seeds in `lib/data/`)

- `Post { id, authorId, activityId?, kind: "recap" | "moment", body, photoId?, songId?, visibility: "public" | "members", areaId, createdAt }`.
  Members-only posts are visible to the author + that plan's joiners.
- `Follow`: `following: string[]` on state (single-viewer demo; keyed per viewer if login-switching matters — builder's call).
- `AuthorReview { id, activityId, reviewerId, authorId, rating 1–5, tags[], comment, createdAt }`; author aggregate (avg + count) derived.
- `Song { id, title, artist, moods: Mood[] }` seed catalog (~12 tracks, en/id titles as-is, no audio files).
- `Photo { id, label, gradient (CSS), moods: Mood[] }` seed set (~8) standing in for uploads; `Mood = "chill" | "hype" | "cozy" | "focus" | "romantic" | "blue"`.
- `profile.aboutMe: string` (single user-written field, not translated — my call).
- Seed ~15 posts across personas/areas/visibilities + a few author reviews so the timeline, trending, and map are alive on first load.

### 2. Home timeline (`app/page.tsx`, new `components/PostCard.tsx`, `components/Composer.tsx`)

- Hero greeting + nearest own plan stay; the board section becomes timeline tabs: **For You** (mix) / **Following** / **Nearby**.
- Nearby = posts whose `areaId` is the viewer's zone or adjacent `km10`-ish band (reuse engine distance bands — my call).
- `PostCard`: avatar, name, follow button, time, linked plan chip, photo block, song card, visibility badge, review snippet if author was reviewed.
- Composer (own posts): text + seeded-photo picker → song suggestions ranked by photo-mood overlap → visibility toggle → publish to state.

### 3. Follow

- Follow/unfollow button on `PostCard` headers and plan participant rows; Following tab filters to followed authors; counts on profile.

### 4. Reviews

- On a finished plan (its `startsAt` passed + viewer joined/created), show "Review the author" (stars 1–5, tag chips, comment).
- One review per reviewer per plan; aggregate shown on author's future posts and profile snippet.

### 5. Recap posts

- "Post about this plan" entry on finished plans for creator + joiners; form = composer pre-linked to the plan; visibility radio (public / members-only).

### 6. Songs + photo-mood suggestion

- Seeded `SONGS` catalog; attaching = card with title/artist/mood tag (no playback — non-goal).
- Choosing a photo surfaces "Suggested for this photo" songs sorted by shared moods; user can still browse all.

### 7. Trending + map (`app/explore/page.tsx` extension or new `app/trending/page.tsx` — builder's call, prefer new route)

- Score per plan: joins velocity + recency + category popularity in zone + author rating. Show "why trending" line (e.g. "5 joins in 2 days in Kemang").
- Zone switcher (own area vs. other zones); map = SVG scatter of `AREAS` lat/lng with count bubbles, keyless.

### 8. About me (`app/you/page.tsx`)

- Textarea in settings, persisted to `profile.aboutMe`, rendered on the profile card.

## What's left to the builder

Exact file splits, component prop shapes, seed copy (en/id), trending weights, tab order, and whether trending is a new route or an Explore tab. Follow the repo's existing patterns (client components, `useStore`, `t(locale, …)`, card/chip/btn classes).

## Calls I made (check while reading)

- Board moves to Explore (already lists plans); Home becomes timeline. Hero stays.
- Members-only (not followers-only) as the private visibility — matches "seen with other user after the plan done or no".
- `aboutMe` untranslated; songs unplayable cards; map keyless SVG.
