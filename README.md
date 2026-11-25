# RNAtwine user manual (Astro)

The user manual of the RNAtwine desktop app, as a static site. The setup follows the CV funk
manual (Astro 4, the same fonts, image pipeline and GitHub Pages workflow) with a docs layout:
a rail of sections on the left in the app's graphite, the page on the right, light and dark
themes in the app's palette, and screen captures that follow the theme.

## Run locally

```sh
npm install
npm run dev          # http://localhost:4321/rnatwine-manual/
```

## Build

```sh
npm run build        # static site in dist/
npm run preview      # serve dist/ locally
npm run check-links  # every internal link, anchor and image in dist/
npm run slots        # capture slots -> capture-slots.json, TODOs, word counts
npm run shots -- getting-started build inspect   # review screenshots in tmp/previews/ (uses the installed Chrome)
```

## Content

- Pages: `src/content/manual/<slug>.mdx`, one per section, ordered by `order` in the front
  matter. Pages with `step: 1..5` are the app's five steps and get numbered discs in the rail.
- Write one sentence per line; Markdown joins the lines of a paragraph.
- Links between pages are relative: `[Inspect](../inspect/#this-run)`.
- MDX: write `<name>` and `{...}` inside backticks, since bare `<` and `{` start JSX.
- `<Todo>...</Todo>` marks a question for the author (shown in gold, listed by `npm run slots`).
  `<Note title="...">...</Note>` is an aside.

## Screen captures

Each page lists its captures in its front matter, and places each one in the text:

```mdx
figures:
  - name: build-setups
    caption: The Build start screen ...
---
<Figure name="build-setups" />
```

The `name` is the capture's slot. `npm run slots` writes every slot to `capture-slots.json`,
the list the app's manual-capture script works from: for each slot, its page, section,
caption and the two files expected, `<name>-light.png` and `<name>-dark.png`.

Until a capture exists, its figure is a placeholder that names those files. To bring captures in:

```sh
python3 scripts/make-web-images.py --from <capture output folder>   # copies *.png and manifest.json
```

or put the PNGs in `public/captures/` yourself and run `python3 scripts/make-web-images.py`.
The script writes web-sized copies to `public/captures-web/` (WebP, at most 1600 px wide;
`--format jpg` for JPEG), their sizes to `src/data/image-ratios.json`, and the manifest's
captions to `src/data/captures.json`. It lists the slots still pending and any capture no page
uses. A caption in a page's front matter takes precedence over the manifest's. The light
image shows in the light theme and the dark one in the dark theme; a slot with one theme
only shows it in both. Clicking a figure opens its full-size PNG. Needs Pillow.

## Deploy: GitHub Pages

`astro.config.mjs` is set for a GitHub Pages project site of a repository named
`rnatwine-manual`: `SITE` is `https://codygeary.github.io` (change it to the account that
owns the repository) and `BASE` is `/rnatwine-manual` (the repository's name).

1. Create the repository on GitHub (e.g. `rnatwine-manual`) and push this folder to `main`.
2. In the repository's Settings > Pages, set Source to "GitHub Actions".
3. Each push to `main` runs `.github/workflows/deploy.yml` (withastro/action), which builds and publishes
   the site to `https://<user>.github.io/rnatwine-manual/`.

A custom domain or an organisation's site: set `SITE` and `BASE` in the workflow's `env:`
(see the comment there) or in `astro.config.mjs`.

## Deploy: a university web server

The build is plain static files with no server code. Build with the address the site will
have, and copy `dist/` to the server:

```sh
SITE=https://www.example-university.de BASE=/groups/geary/rnatwine-manual npm run build
npm run check-links
rsync -av dist/ user@webserver:/path/to/htdocs/groups/geary/rnatwine-manual/
```

`BASE` must match the path the server publishes the folder under, since every link includes
it. For a site at the server's root use `BASE=/`.

## Layout

- `src/layouts/Doc.astro`: the page shell: rail, theme switch, drawer for narrow windows.
- `src/pages/[...slug].astro`: one page per content entry, with previous/next and the list of
  the page's captures; `src/pages/index.astro`: the contents.
- `src/components/Figure.astro`: a capture slot; `Todo.astro`, `Note.astro`: asides.
- `src/styles/site.css`: styles, with the app's palette (from `rnatwine-app/src/theme.rs`).
- `src/scripts/site.js`: theme switch (remembered in the browser) and the drawer.
- `public/fonts/`: DejaVu Sans and Sans Mono subsets, from the CV funk manual.
- `public/img/`: the app's logo and icon.
