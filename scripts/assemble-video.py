"""Assemble the 3-minute Temenin demo video, v2: real interaction takes.

Inputs: /tmp/temenin-takes/<take>/final.mp4 (scripts/record-takes.mjs +
scripts/render-takes.py), docs/demo/audio/s*.mp3, title/outro cards.
Output: docs/demo/temenin-demo-3min.mp4 (1080p30 H.264 + stereo AAC),
docs/demo/captions.srt (YouTube sidecar) + captions.ass (burned in).

Takes that overran their slot are gently sped up to it (t7 1.2x, t8a 1.27x)
so narration stays in sync; everything else plays at 1x. Hard cuts between
takes, one fade in/out around the whole film, no Ken Burns drift.
"""
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FPS = 30
LEAD, GAP, TAIL = 0.4, 0.35, 0.8
W, H = 1920, 1080
NAVY, CREAM, PINK = "#425B9A", "#FFF6DC", "#FF95A5"
SANS = "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf"
SANS_B = "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf"
SANS_I = "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Italic.ttf"

DEMO = Path("docs/demo")
AUDIO = DEMO / "audio"
SHOTS = DEMO / "shots"
TAKES = Path("/tmp/temenin-takes")

# (audio, caption cues, visual kind)
SEGMENTS = [
    ("s1-title", [
        "In a city of millions, the hardest part",
        "of the weekend isn't picking a movie.",
        "It's finding someone to go with.",
        "Meet Temenin, the app that finds you a",
        "verified activity buddy.",
        "Vibes click. Plans stick.",
    ], ("still", "card-title.png", 1.0)),
    ("s2-sealed", [
        "This is Nadia. She's new in Jakarta,",
        "and this Saturday she wants to catch a film in Tebet,",
        "but nobody she knows is free.",
        "She opens Temenin as an unverified account.",
        "Notice the board: you can read every plan's description,",
        "but names, places, and times stay locked. Verified eyes only.",
    ], ("take", "t2", 1.0)),
    ("s3-verify", [
        "One quick ID check in the Safety Center,",
        "and the same board opens up.",
        "Names, areas, and times appear, each with a verified badge.",
        "And this isn't just hidden on screen.",
        "The privacy rule is enforced in the data layer,",
        "so a display bug can never leak who's going where.",
    ], ("take", "t3", 1.0)),
    ("s4-create", [
        "Now Nadia posts her own plan.",
        "She just types one sentence, like she'd text a friend.",
        "Temenin's concierge turns it into a structured draft:",
        "category, area, budget, even chat level.",
        "Then she sets her House Rules for this plan:",
        "what's a must, what's just a bonus.",
        "Every plan can have different rules, because every plan is different.",
    ], ("take", "t4", 1.0)),
    ("s5-matches", [
        "Here's the part we love most.",
        "Every candidate gets a deterministic score from five components:",
        "gender preference, shared interests, energy fit, context, and trust.",
        "Nothing is a black box.",
        "Weaker fits drop down the ranking with their score in the open,",
        "next to a checklist showing exactly which of your rules they meet.",
    ], ("take", "t5", 1.0)),
    ("s6-detail", [
        "Tap a candidate and you get the full story.",
        "Five score bars, a plain-language reason written for humans,",
        "three icebreakers to start the chat,",
        "and three public venues picked only from a curated list.",
        "The app never invents a place.",
        "A safety checklist sits right there before you can reach out.",
    ], ("take", "t6", 1.0)),
    ("s7-chat", [
        "They chat inside the app, and watch this:",
        "when Nadia tries to share her phone number,",
        "the filter holds the message with a gentle reminder to stay in-app until they meet.",
        "Then both sides tick the safety checklist and confirm.",
        "Only now, after a two-sided yes, does the exact meeting point appear.",
        "One tap shares the whole plan with a trusted contact.",
    ], ("take", "t7", 1.0)),
    ("s8-close", [
        "After the movie, Nadia taps home safe, then leaves stars, quick tags,",
        "and a note.",
        "Her buddy's trust and reliability scores go up,",
        "so the next plan sticks even better.",
        "That's Temenin: real plans, verified buddies,",
        "safety built in, not bolted on.",
        "The link to the live demo is in the description. See you out there.",
    ], ("split", "t8a", 0.68)),
]


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def text_center(draw: ImageDraw.ImageDraw, cx: int, y: int, text: str, font: ImageFont.FreeTypeFont, fill: str):
    box = draw.textbbox((0, 0), text, font=font)
    draw.text((cx - (box[2] - box[0]) / 2, y), text, font=font, fill=fill)


def make_cards() -> None:
    lockup = Image.open("public/brand/lockup-cream-text.png").convert("RGBA")
    lockup = lockup.resize((760, round(760 * lockup.height / lockup.width)))
    img = Image.new("RGB", (W, H), NAVY)
    img.paste(lockup, ((W - lockup.width) // 2, 180), lockup)
    d = ImageDraw.Draw(img)
    text_center(d, W // 2, 560, "Vibes click. Plans stick.",
                ImageFont.truetype(SANS_B, 60), PINK)
    text_center(d, W // 2, 665, "Find a verified buddy for the plan you already have.",
                ImageFont.truetype(SANS, 38), CREAM)
    img.save(SHOTS / "card-title.png")
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    text_center(d, W // 2, 330, "Try the live demo.",
                ImageFont.truetype(SANS_B, 88), CREAM)
    text_center(d, W // 2, 470, "Link in the description.",
                ImageFont.truetype(SANS, 48), PINK)
    small = lockup.resize((440, round(440 * lockup.height / lockup.width)))
    img.paste(small, ((W - small.width) // 2, 640), small)
    text_center(d, W // 2, 850, "Vibes click. Plans stick.",
                ImageFont.truetype(SANS_I, 40), CREAM)
    img.save(SHOTS / "card-outro.png")
    print("cards written")


def wrap(text: str, width: int = 40) -> str:
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if len(trial) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    if len(lines) <= 2:
        return "\n".join(lines)
    mid = (len(lines) + 1) // 2
    return " ".join(lines[:mid]) + "\n" + " ".join(lines[mid:])


def srt_time(sec: float) -> str:
    ms = round(sec * 1000)
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def ass_time(sec: float) -> str:
    cs = round(sec * 100)
    h, rem = divmod(cs, 360000)
    m, rem = divmod(rem, 6000)
    s, cs = divmod(rem, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def main() -> None:
    make_cards()
    manifest = json.loads((TAKES / "manifest.json").read_text())
    actual_dur = manifest["actualDur"]
    durations = {name: probe_duration(AUDIO / f"{name}.mp3") for name, _, _ in SEGMENTS}

    # video-led timeline: title still, takes at planned slots, outro still
    clips = []  # (kind, src, planned_dur, rate)
    cues = []
    cursor = LEAD
    for idx, (name, sentences, (kind, src, frac)) in enumerate(SEGMENTS):
        tail = TAIL if idx == len(SEGMENTS) - 1 else GAP
        seg_dur = durations[name] + tail
        if kind == "still":
            clips.append(("still", src, seg_dur, 1.0))
        elif kind == "take":
            actual = actual_dur[src]
            clips.append(("take", src, seg_dur, seg_dur / actual))
        else:  # split: feedback take then outro card
            take_dur, card_dur = seg_dur * frac, seg_dur * (1 - frac)
            actual = actual_dur[src]
            clips.append(("take", src, take_dur, take_dur / actual))
            clips.append(("still", "card-outro.png", card_dur, 1.0))
        weights = [len(s) for s in sentences]
        pos = cursor
        for s, w in zip(sentences, weights):
            nxt = pos + durations[name] * w / sum(weights)
            cues.append((pos, nxt - 0.04, wrap(s)))
            pos = nxt
        cursor += seg_dur
    total = cursor
    print(f"total: {total:.2f}s, {len(clips)} clips, {len(cues)} cues")
    for kind, src, d, r in clips:
        print(f"  {kind:5s} {src:16s} {d:6.2f}s rate={r:.3f}")

    srt_path = DEMO / "captions.srt"
    with open(srt_path, "w") as f:
        for i, (a, b, text) in enumerate(cues, 1):
            f.write(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{text}\n\n")
    ass_path = DEMO / "captions.ass"
    with open(ass_path, "w") as f:
        f.write("[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n"
                "WrapStyle: 1\nScaledBorderAndShadow: yes\n\n"
                "[V4+ Styles]\n"
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
                "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
                "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
                "Alignment, MarginL, MarginR, MarginV, Encoding\n"
                "Style: Default,Liberation Sans,58,&H00FFFFFF,&H000000FF,&H90000000,"
                "&H90000000,0,0,0,0,100,100,0,0,1,2,0,2,60,60,44,1\n\n"
                "[Events]\n"
                "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        for a, b, text in cues:
            f.write(f"Dialogue: 0,{ass_time(a)},{ass_time(b)},Default,,0,0,0,,"
                    f"{text.replace(chr(10), chr(92) + 'N')}\n")

    cmd = ["ffmpeg", "-y"]
    for kind, src, dur, _ in clips:
        if kind == "still":
            cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}",
                    "-i", str(SHOTS / src)]
        else:
            cmd += ["-i", str(TAKES / src / "final.mp4")]
    for name, _, _ in SEGMENTS:
        cmd += ["-i", str(AUDIO / f"{name}.mp3")]

    filt, vlabels, n_vid = [], [], len(clips)
    for i, (kind, src, dur, rate) in enumerate(clips):
        if kind == "still":
            filt.append(f"[{i}:v]scale={W}:{H},setsar=1,fps={FPS}[v{i}]")
        else:
            filt.append(f"[{i}:v]setpts={rate:.6f}*PTS,fps={FPS},trim=0:{dur:.3f},setpts=PTS-STARTPTS[v{i}]")
        vlabels.append(f"[v{i}]")
    filt.append(f"{''.join(vlabels)}concat=n={len(clips)}:v=1:a=0,"
                f"fade=t=in:st=0:d=0.4,fade=t=out:st={total - 0.5:.3f}:d=0.5,"
                f"subtitles={ass_path},format=yuv420p[v]")
    alabels, acursor = [], LEAD
    for j, (name, _, _) in enumerate(SEGMENTS):
        ms = round(acursor * 1000)
        # mono VO -> dual-mono stereo so it plays on both speakers
        filt.append(f"[{n_vid + j}:a]adelay={ms}|{ms},aresample=44100,"
                    f"pan=stereo|c0=c0|c1=c0[a{j}]")
        alabels.append(f"[a{j}]")
        acursor += durations[name] + (TAIL if j == len(SEGMENTS) - 1 else GAP)
    filt.append(f"{''.join(alabels)}amix=inputs={len(SEGMENTS)}:normalize=0,apad[a]")

    out = DEMO / "temenin-demo-3min.mp4"
    cmd += ["-filter_complex", ";".join(filt),
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
            "-movflags", "+faststart", "-t", f"{total:.3f}", str(out)]
    print("running ffmpeg ...")
    subprocess.run(cmd, check=True)
    print("wrote", out, f"({out.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
