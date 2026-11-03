# Temenin — 3-Minute Demo Video Script (English voiceover)

Format: 1920x1080, ~3 minutes, relaxed and friendly English voiceover.
Story: the 7-step Nadia demo (Saturday movie in Tebet, budget ~100k IDR).
Audio: one file per segment (`docs/demo/audio/s1-title.mp3` … `s8-close.mp3`),
generated with edge-tts `en-US-AriaNeural` at -5% rate (natural, relaxed).
Swap in OmniVoice with this same script anytime: one paragraph per segment.

## S1 — Title / hook (~16s)

Visual: title card on brand navy (#425B9A): "Temenin — Vibes click. Plans stick."

> In a city of millions, the hardest part of the weekend isn't picking a movie.
> It's finding someone to go with.
> Meet Temenin, the app that finds you a verified activity buddy.
> Vibes click. Plans stick.

## S2 — Sealed board as Nadia, unverified (~22s)

Visual: `/` logged in as Nadia (unverified). Board cards show description only,
name, area, and time locked behind "verified eyes only" markers.

> This is Nadia. She's new in Jakarta, and this Saturday she wants to catch
> a film in Tebet, but nobody she knows is free.
> She opens Temenin as an unverified account.
> Notice the board: you can read every plan's description, but names, places,
> and times stay locked. Verified eyes only.

## S3 — Verify once, the board opens (~21s)

Visual: `/safety` simulated ID check (pending to verified), then `/` again:
same board, now with names, areas, times, and verified badges.

> One quick ID check in the Safety Center, and the same board opens up.
> Names, areas, and times appear, each with a verified badge.
> And this isn't just hidden on screen.
> The privacy rule is enforced in the data layer, so a display bug can never
> leak who's going where.

## S4 — Post a plan in one sentence (~25s)

Visual: `/create`. The sentence is typed live; the draft card appears
(category, area, budget, chat level), then House Rules with
must-meet and bonus toggles.

> Now Nadia posts her own plan. She just types one sentence, like she'd text
> a friend.
> Temenin's concierge turns it into a structured draft: category, area,
> budget, even chat level.
> Then she sets her House Rules for this plan: what's a must, what's just
> a bonus.
> Every plan can have different rules, because every plan is different.

Typed on screen:
`Saturday afternoon, want to watch a movie in Tebet, around 100k budget, looking for a buddy who's fun to chat with after the film.`

## S5 — Matches you can read (~24s)

Visual: "Others for this plan" ranked list on the detail page (name plus
open score per candidate) and the "Your rules, checked" checklist.

> Here's the part we love most. Every candidate gets a deterministic score
> from five components: gender preference, shared interests, energy fit,
> context, and trust.
> Nothing is a black box.
> Weaker fits drop down the ranking with their score in the open, next to
> a checklist showing exactly which of your rules they meet.

## S6 — Match detail (~22s)

Visual: `/match/[id]/detail?candidate=` — five score bars, plain-language
reason, three icebreakers, three curated public venues, safety checklist.

> Tap a candidate and you get the full story.
> Five score bars, a plain-language reason written for humans, three
> icebreakers to start the chat, and three public venues picked only from
> a curated list.
> The app never invents a place.
> A safety checklist sits right there before you can reach out.

## S7 — Chat, filter, two-sided confirm (~28s)

Visual: `/messages/[id]` — a phone-number message held with a gentle
in-app reminder; safety checklist ticked; both sides confirm; the exact
venue appears; Share plan button.

> They chat inside the app, and watch this: when Nadia tries to share her
> phone number, the filter holds the message with a gentle reminder to stay
> in-app until they meet.
> Then both sides tick the safety checklist and confirm.
> Only now, after a two-sided yes, does the exact meeting point appear.
> One tap shares the whole plan with a trusted contact.

## S8 — Home safe, feedback, close (~24s)

Visual: `/feedback/[id]` stars and tags, trust and reliability going up,
then the outro card: live demo link, repo, "Vibes click. Plans stick."

> After the movie, Nadia taps home safe, then leaves stars, quick tags,
> and a note.
> Her buddy's trust and reliability scores go up, so the next plan sticks
> even better.
> That's Temenin: real plans, verified buddies, safety built in, not
> bolted on.
> The link to the live demo is in the description. See you out there.

---

## Build notes

- Total script: ~425 words, ≈ 3:00 at a relaxed pace.
- Voiceover: `docs/demo/audio/s*.mp3`, one file per segment, via
  `scripts/generate-vo.py` (edge-tts `en-US-AriaNeural`, -5% rate).
  Re-record any single segment by editing its text and re-running the script,
  or replace files one-for-one with OmniVoice takes.
- Screen takes: 7 real interaction takes recorded with headless Firefox
  through puppeteer at ~20fps, with a 30fps cursor and click ripples
  rendered on top. Record: `node scripts/record-takes.mjs` (needs
  `npm run build` first; footage lands in `/tmp/temenin-takes/`).
  Render cursor: `python3 scripts/render-takes.py`.
- Captions: `docs/demo/captions.srt` (YouTube sidecar upload) plus
  `docs/demo/captions.ass` (burned into the video), both timed from the
  real audio durations.
- Stills: `docs/demo/shots/*.png` via `PROD=1 node scripts/capture-demo.mjs`
  (title/outro cards plus spare key visuals, e.g. for the video thumbnail).
- Final video: `docs/demo/temenin-demo-3min.mp4` (1080p30 H.264 + stereo AAC,
  YouTube-ready), via `python3 scripts/assemble-video.py`. Hard cuts, one
  fade in/out, no Ken Burns drift.
- Full rebuild: `npm run build` → voiceover → record takes → render takes
  → assemble.
