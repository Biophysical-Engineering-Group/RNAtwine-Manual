# RNAtwine user manual

This repository holds the source of the user manual for [RNAtwine](https://github.com/Biophysical-Engineering-Group/RNAtwine_rust), a desktop application and command-line tool for modelling RNA nanostructures.
RNAtwine represents each nucleotide by one site of an elastic network, relaxes a design to its lowest-energy shape, and writes the result as an all-atom model.

The manual is published at **https://biophysical-engineering-group.github.io/RNAtwine-Manual/**.

## Contents

The manual follows the app's five steps, then covers the rest of the program.

| Page | What it covers |
|---|---|
| Getting started | Installing and opening the app, the window, a first relax in five steps |
| Open | Designs and the library, pyFuRNAce files, experimental structures and saved runs |
| Build | What is built (one tile; a dimer, ring or chain; a tube or sheet), kissing-loop roles, the relax |
| Inspect | The relaxed model's measures, comparison with a structure or a cryo-EM map, relaxing into a map |
| Edit | Changing lengths, sliding loops and motifs, relaxing as you edit |
| Export | Run files, relaxed coordinates and full-atom structures, images and the twine model |
| View | Coarse, twine and full-atom views, view options, camera and themes |
| Command line | The `rnatwine` tool and the app's windowless render mode |
| Concepts | The model, kissing loops and clasps, loop roles, assemblies, run files |
| Troubleshooting and FAQ | Common problems and their answers |

## Building the site

The site is built with [Astro](https://astro.build) and needs Node.js 18.17 or newer.

```sh
npm ci               # install the exact dependencies in package-lock.json
npm run dev          # live preview at http://localhost:4321/RNAtwine-Manual/
npm run build        # static site in dist/
npm run preview      # serve dist/ locally
npm run check-links  # check every internal link, anchor and image in dist/
```

## Deployment

Every push to `main` builds the site and publishes it with GitHub Pages (`.github/workflows/deploy.yml`).
The workflow sets the site's address from the repository's owner and name, so a fork publishes under its own address without changes.
In the repository's settings, Pages must have its source set to "GitHub Actions".

The build is plain static HTML, CSS, JavaScript and images, and can be served from any web server.
Build with the address the site will have, then copy `dist/` to the server:

```sh
SITE=https://www.example.org BASE=/rnatwine-manual npm run build
```

`BASE` is the path the server publishes the folder under (`/` for a site at the server's root), since every link includes it.

## Writing and editing

- Each page is one file, `src/content/manual/<slug>.mdx`, ordered by `order` in its front matter. Pages with `step: 1` to `5` are the app's steps and are numbered in the navigation.
- Write one sentence per line; lines of one paragraph are joined when the page is built.
- Link between pages with relative paths, for example `[Inspect](../inspect/#this-run)`.
- In MDX, put `<name>` and `{...}` inside backticks, since a bare `<` or `{` starts a JSX element.
- `<Note title="...">...</Note>` is an aside; `<Todo>...</Todo>` marks an open editorial question (listed by `npm run slots`).

## Screenshots

Screenshots are made by the app itself, in its capture mode, from the script `rnatwine-app/capture/manual.toml` in the RNAtwine repository, so they can be remade whenever the app changes.
Each page lists its screenshots in its front matter and places each one in the text:

```mdx
figures:
  - name: build-setups
    caption: The Build start screen ...
---
<Figure name="build-setups" />
```

`npm run slots` writes every slot to `capture-slots.json`, with its page, caption and the two files expected, `<name>-light.png` and `<name>-dark.png`.
To bring a set of captures in:

```sh
python3 scripts/make-web-images.py --from <capture output folder>
```

The script copies the PNGs to `public/captures/`, writes web-sized copies to `public/captures-web/` (WebP, at most 1600 px wide), and records their sizes and captions in `src/data/`.
The light image is shown in the light theme and the dark one in the dark theme; clicking a figure opens the full-size PNG.
A slot without a capture shows a placeholder naming its files. The script needs Python with Pillow.

## Repository layout

- `src/content/manual/`: the pages.
- `src/layouts/Doc.astro`: the page shell: navigation rail, theme switch, drawer for narrow windows.
- `src/pages/`: one page per content entry (`[...slug].astro`) and the contents page (`index.astro`).
- `src/components/`: `Figure.astro` (a screenshot slot), `Note.astro` and `Todo.astro` (asides).
- `src/styles/site.css`: styles, in the app's color palette.
- `src/scripts/site.js`: the theme switch and the drawer.
- `public/`: screenshots, the landing images, the logo and icon, and the fonts (DejaVu Sans and DejaVu Sans Mono subsets).
- `scripts/`: image preparation, the slot list and the link check.

## License

The manual is released under the MIT License (see `LICENSE`).
The DejaVu fonts are distributed under their own free license.
