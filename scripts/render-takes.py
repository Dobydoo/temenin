"""Render recorded takes: frames -> CFR mp4, synthetic 30fps cursor + click
ripples overlaid. Reads /tmp/temenin-takes/<take>/{f*.jpg,cursor.json},
writes /tmp/temenin-takes/<take>/final.mp4 (+ cursor.mov intermediate).
"""
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

FPS = 30
W, H = 1920, 1080
TAKES = Path("/tmp/temenin-takes")
NAVY = (66, 91, 154)


def cursor_sprite(size: int = 40) -> Image.Image:
    """White arrow cursor with dark outline and soft shadow."""
    s = size
    img = Image.new("RGBA", (s + 12, s + 18), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pts = [(6, 4), (6, s), (15, s - 8), (19, s + 6), (24, s + 4), (20, s - 10), (28, s - 10)]
    for off, fill in [((2, 3), (0, 0, 0, 110)), ((0, 0), (30, 30, 34, 255))]:
        d.polygon([(x + off[0], y + off[1]) for x, y in pts], fill=fill)
    inner = [(9, 9), (9, s - 5), (15, s - 10), (18, s + 1), (21, s), (18, s - 11), (24, s - 11)]
    d.polygon(inner, fill=(255, 255, 255, 255))
    return img


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True)


def valid_frames(d: Path) -> list[Path]:
    frames = []
    for p in sorted(d.glob("f*.jpg")):
        try:
            with Image.open(p) as im:
                im.verify()
            frames.append(p)
        except Exception:
            print(f"  skip corrupt {p.name}")
    if not frames:
        raise SystemExit(f"no valid frames in {d}")
    return frames


def render_cursor(d: Path, dur: float, moves: list, clicks: list) -> Path:
    n = max(1, round(dur * FPS))
    sprite = cursor_sprite()
    sw, sh = sprite.size
    seq = d / "cursor-frames"
    seq.mkdir(exist_ok=True)
    mv = sorted(moves, key=lambda m: m["t"]) or [{"t": 0, "x": 960, "y": 900}]
    ck = sorted(clicks, key=lambda c: c["t"])
    mi = 0
    for f in range(n):
        t = f / FPS
        while mi + 1 < len(mv) and mv[mi + 1]["t"] <= t:
            mi += 1
        a, b = mv[mi], mv[min(mi + 1, len(mv) - 1)]
        span = (b["t"] - a["t"]) or 1e-6
        p = min(1.0, max(0.0, (t - a["t"]) / span))
        x = int(a["x"] + (b["x"] - a["x"]) * p)
        y = int(a["y"] + (b["y"] - a["y"]) * p)
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        dr = ImageDraw.Draw(img)
        for c in ck:
            age = t - c["t"]
            if 0 <= age <= 0.4:
                r = int(10 + age / 0.4 * 46)
                alpha = int(220 * (1 - age / 0.4))
                dr.ellipse([c["x"] - r, c["y"] - r, c["x"] + r, c["y"] + r],
                           outline=NAVY + (alpha,), width=4)
        img.alpha_composite(sprite, (x, y))
        img.save(seq / f"c{f:05d}.png")
    out = d / "cursor.mov"
    run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", str(seq / "c%05d.png"),
         "-c:v", "qtrle", str(out)])
    return out


def render_take(name: str) -> Path:
    d = TAKES / name
    meta = json.loads((d / "cursor.json").read_text())
    dur = float(meta["actual"])
    frames = valid_frames(d)
    per = dur / len(frames)
    lst = d / "frames.txt"
    lst.write_text("".join(f"file '{p.name}'\nduration {per:.6f}\n" for p in frames) + f"file '{frames[-1].name}'\n")
    screen = d / "screen.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-vsync", "cfr", "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast",
         "-crf", "18", "-t", f"{dur:.3f}", str(screen)])
    cursor = render_cursor(d, dur, meta["moves"], meta["clicks"])
    final = d / "final.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-i", str(screen), "-i", str(cursor),
         "-filter_complex", "[0:v][1:v]overlay=0:0:format=yuv420[v]", "-map", "[v]",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-t", f"{dur:.3f}", str(final)])
    print(f"{name}: {len(frames)} frames -> {final} ({dur:.1f}s)")
    return final


if __name__ == "__main__":
    import sys

    names = sys.argv[1:] or ["t2", "t3", "t4", "t5", "t6", "t7", "t8a"]
    for n in names:
        render_take(n)
