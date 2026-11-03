"""Generate the English demo voiceover with edge-tts (en-US-AriaNeural, -5%).

Run:  python3 -m venv .venv-tts && .venv-tts/bin/pip install edge-tts
      .venv-tts/bin/python scripts/generate-vo.py
Output: docs/demo/audio/s1-title.mp3 ... s8-close.mp3 (one file per segment,
so any segment can be re-recorded or swapped for an OmniVoice take).
"""
import asyncio
import os
from pathlib import Path
import edge_tts

VOICE = "en-US-AriaNeural"
RATE = "-5%"
PROXY = os.environ.get("https_proxy") or os.environ.get("HTTPS_PROXY")

SEGMENTS = {
    "s1-title": "In a city of millions, the hardest part of the weekend isn't picking a movie. "
                "It's finding someone to go with. "
                "Meet Temenin, the app that finds you a verified activity buddy. "
                "Vibes click. Plans stick.",
    "s2-sealed": "This is Nadia. She's new in Jakarta, and this Saturday she wants to catch "
                 "a film in Tebet, but nobody she knows is free. "
                 "She opens Temenin as an unverified account. "
                 "Notice the board: you can read every plan's description, but names, places, "
                 "and times stay locked. Verified eyes only.",
    "s3-verify": "One quick ID check in the Safety Center, and the same board opens up. "
                 "Names, areas, and times appear, each with a verified badge. "
                 "And this isn't just hidden on screen. "
                 "The privacy rule is enforced in the data layer, so a display bug can never "
                 "leak who's going where.",
    "s4-create": "Now Nadia posts her own plan. She just types one sentence, like she'd text "
                 "a friend. "
                 "Temenin's concierge turns it into a structured draft: category, area, "
                 "budget, even chat level. "
                 "Then she sets her House Rules for this plan: what's a must, what's just "
                 "a bonus. "
                 "Every plan can have different rules, because every plan is different.",
    "s5-matches": "Here's the part we love most. Every candidate gets a deterministic score "
                  "from five components: gender preference, shared interests, energy fit, "
                  "context, and trust. "
                  "Nothing is a black box. "
                  "Weaker fits drop down the ranking with their score in the open, next to "
                  "a checklist showing exactly which of your rules they meet.",
    "s6-detail": "Tap a candidate and you get the full story. "
                 "Five score bars, a plain-language reason written for humans, three "
                 "icebreakers to start the chat, and three public venues picked only from "
                 "a curated list. "
                 "The app never invents a place. "
                 "A safety checklist sits right there before you can reach out.",
    "s7-chat": "They chat inside the app, and watch this: when Nadia tries to share her "
               "phone number, the filter holds the message with a gentle reminder to stay "
               "in-app until they meet. "
               "Then both sides tick the safety checklist and confirm. "
               "Only now, after a two-sided yes, does the exact meeting point appear. "
               "One tap shares the whole plan with a trusted contact.",
    "s8-close": "After the movie, Nadia taps home safe, then leaves stars, quick tags, "
                "and a note. "
                "Her buddy's trust and reliability scores go up, so the next plan sticks "
                "even better. "
                "That's Temenin: real plans, verified buddies, safety built in, not "
                "bolted on. "
                "The link to the live demo is in the description. See you out there.",
}

async def main() -> None:
    outdir = Path("docs/demo/audio")
    outdir.mkdir(parents=True, exist_ok=True)
    for name, text in SEGMENTS.items():
        path = outdir / f"{name}.mp3"
        await edge_tts.Communicate(text, VOICE, rate=RATE, proxy=PROXY).save(str(path))
        print(f"wrote {path} ({len(text.split())} words)")

asyncio.run(main())
