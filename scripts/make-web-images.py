"""Make the web-sized screen captures the manual shows.

Reads every PNG in public/captures/ (the capture script's <name>-light.png and
<name>-dark.png), writes public/captures-web/<stem>.webp (or .jpg) no wider than
--max-width, and records each image's file and pixel size in src/data/image-ratios.json,
which the figures read for their width and height. A figure links to its full-size PNG.

When the capture script's manifest.json is in public/captures/, its captions and sections
go to src/data/captures.json; a caption in a page's front matter takes precedence. When
capture-slots.json (written by `npm run slots`) is present, the slots still without a
capture and the captures no page uses are listed.

  python3 scripts/make-web-images.py                         after adding or recapturing
  python3 scripts/make-web-images.py --from ../captures/out  copy the PNGs and manifest in first
  python3 scripts/make-web-images.py --format jpg            JPEG instead of WebP
  python3 scripts/make-web-images.py --force                 redo images already up to date

Needs Pillow (pip install pillow). Nothing is deleted: web images whose PNG is gone are
listed as stale for you to remove.
"""
import argparse
import glob
import json
import os
import shutil
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "captures")
DST = os.path.join(ROOT, "public", "captures-web")
RATIOS = os.path.join(ROOT, "src", "data", "image-ratios.json")
CAPTIONS = os.path.join(ROOT, "src", "data", "captures.json")
SLOTS = os.path.join(ROOT, "capture-slots.json")
THEMES = ("-light", "-dark")


def base_name(stem):
    """The slot a file belongs to: its stem without -light or -dark."""
    for t in THEMES:
        if stem.endswith(t):
            return stem[: -len(t)]
    return stem


def read_manifest(path):
    """The capture manifest as {slot: {caption, section, files}}, whatever its outer shape:
    a list of entries, {"captures": [...]}, or a dict keyed by name."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict) and isinstance(data.get("captures"), list):
        data = data["captures"]
    if isinstance(data, dict):
        data = [dict(v, name=k) for k, v in data.items()]
    out = {}
    for e in data:
        stem = os.path.splitext(os.path.basename(e.get("file") or e.get("name", "")))[0]
        name = base_name(e.get("name") or stem)
        rec = out.setdefault(name, {"files": []})
        if e.get("caption") and not rec.get("caption"):
            rec["caption"] = e["caption"]
        if e.get("section") and not rec.get("section"):
            rec["section"] = e["section"]
        if e.get("file"):
            rec["files"].append(os.path.basename(e["file"]))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--from", dest="src", help="folder of the capture script's output to copy in first")
    ap.add_argument("--format", choices=("webp", "jpg"), default="webp")
    ap.add_argument("--max-width", type=int, default=1600, help="widest web image, px (default 1600)")
    ap.add_argument("--quality", type=int, default=86)
    ap.add_argument("--force", action="store_true", help="rewrite web images that are up to date")
    a = ap.parse_args()

    os.makedirs(SRC, exist_ok=True)
    os.makedirs(DST, exist_ok=True)
    if a.src:
        n = 0
        for p in glob.glob(os.path.join(os.path.expanduser(a.src), "*.png")):
            shutil.copy2(p, SRC)
            n += 1
        m = os.path.join(os.path.expanduser(a.src), "manifest.json")
        if os.path.isfile(m):
            shutil.copy2(m, SRC)
        print(f"copied {n} PNG(s) from {a.src}" + (" and manifest.json" if os.path.isfile(m) else ""))

    ext = "jpg" if a.format == "jpg" else "webp"
    ratios, made = {}, 0
    for path in sorted(glob.glob(os.path.join(SRC, "*.png"))):
        stem = os.path.basename(path)[:-4]
        out = os.path.join(DST, f"{stem}.{ext}")
        im = Image.open(path)
        w, h = im.size
        if w > a.max_width:
            w, h = a.max_width, round(h * a.max_width / w)
        if a.force or not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(path):
            im = im.convert("RGB")
            if im.size != (w, h):
                im = im.resize((w, h), Image.LANCZOS)
            if ext == "jpg":
                im.save(out, quality=a.quality, optimize=True, progressive=True)
            else:
                im.save(out, quality=a.quality, method=6)
            made += 1
        ratios[stem] = {"file": f"{stem}.{ext}", "w": w, "h": h, "full": os.path.basename(path)}
    with open(RATIOS, "w", encoding="utf-8") as f:
        json.dump(ratios, f, indent=1, sort_keys=True)
        f.write("\n")
    print(f"{len(ratios)} capture(s), {made} web image(s) written, sizes in src/data/image-ratios.json")

    manifest = {}
    mpath = os.path.join(SRC, "manifest.json")
    if os.path.isfile(mpath):
        manifest = read_manifest(mpath)
        with open(CAPTIONS, "w", encoding="utf-8") as f:
            json.dump({k: {kk: vv for kk, vv in v.items() if kk != "files"} for k, v in manifest.items()},
                      f, indent=1, sort_keys=True)
            f.write("\n")
        print(f"{len(manifest)} slot(s) in manifest.json, captions in src/data/captures.json")

    stale = [os.path.basename(p) for p in glob.glob(os.path.join(DST, "*.*"))
             if os.path.splitext(os.path.basename(p))[0] not in ratios and not p.endswith(".gitkeep")]
    if stale:
        print("stale web images (no PNG):", ", ".join(sorted(stale)))

    have = {base_name(s) for s in ratios}
    if os.path.isfile(SLOTS):
        with open(SLOTS, encoding="utf-8") as f:
            slots = {s["name"] for s in json.load(f)["slots"]}
        missing = sorted(slots - have)
        unused = sorted(have - slots)
        one_theme = sorted(s for s in slots & have
                           if not all(f"{s}{t}" in ratios for t in THEMES) and s not in ratios)
        print(f"slots: {len(slots)}, captured: {len(slots & have)}, pending: {len(missing)}")
        if missing:
            print("  pending:", ", ".join(missing))
        if one_theme:
            print("  one theme only (shown in both):", ", ".join(one_theme))
        if unused:
            print("  captures no page uses:", ", ".join(unused))
    return 0


if __name__ == "__main__":
    sys.exit(main())
