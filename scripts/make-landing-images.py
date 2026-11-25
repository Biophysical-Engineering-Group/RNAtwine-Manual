"""Make the landing page's illustrations from the render mode's PNGs.

Reads <name>-light.png and <name>-dark.png from the render output folder (by default
capture/landing_out, written by `RNAtwine --render capture/landing.toml capture/landing_out`),
trims each to its opaque pixels plus a small margin, writes public/landing/<name>-<theme>.webp
with its transparency, no wider than the width set for its name below, and records each
image's file and pixel size in src/data/landing.json, which the Art component reads.

  python3 scripts/make-landing-images.py
  python3 scripts/make-landing-images.py --from ../captures/landing_out

Needs Pillow (pip install pillow).
"""
import argparse
import glob
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, "public", "landing")
DATA = os.path.join(ROOT, "src", "data", "landing.json")
# Pixel width of the web image: twice the widest the page shows it, for high-density screens.
WIDTH = {"hero": 1400}
DEFAULT_WIDTH = 800
MARGIN = 0.03


def trim(im):
    """The image cropped to its opaque pixels, with a margin of MARGIN of the longer side."""
    box = im.getchannel("A").getbbox()
    if box is None:
        return im
    pad = int(MARGIN * max(box[2] - box[0], box[3] - box[1]))
    x0, y0 = max(0, box[0] - pad), max(0, box[1] - pad)
    x1, y1 = min(im.width, box[2] + pad), min(im.height, box[3] + pad)
    return im.crop((x0, y0, x1, y1))


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--from", dest="src", default=os.path.join(ROOT, "capture", "landing_out"))
    args = ap.parse_args()
    os.makedirs(DST, exist_ok=True)
    data = {}
    for p in sorted(glob.glob(os.path.join(args.src, "*.png"))):
        stem = os.path.splitext(os.path.basename(p))[0]
        name = stem.rsplit("-", 1)[0] if stem.endswith(("-light", "-dark")) else stem
        im = trim(Image.open(p).convert("RGBA"))
        width = WIDTH.get(name, DEFAULT_WIDTH)
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        out = f"{stem}.webp"
        im.save(os.path.join(DST, out), "WEBP", quality=88, method=6)
        data[stem] = {"file": out, "w": im.width, "h": im.height}
        print(f"{stem}: {im.width} x {im.height}")
    if not data:
        print(f"no PNGs in {args.src}")
        return
    with open(DATA, "w") as fh:
        json.dump(data, fh, indent=1, sort_keys=True)
        fh.write("\n")
    print(f"{len(data)} image(s) -> {os.path.relpath(DST, ROOT)}, sizes in {os.path.relpath(DATA, ROOT)}")


if __name__ == "__main__":
    main()
