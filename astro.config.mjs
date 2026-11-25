import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

// Where the site is served from. Two settings decide every link:
//   SITE: the origin, e.g. https://<owner>.github.io or https://www.example.org
//   BASE: the path under it, e.g. /rnatwine-manual (a GitHub Pages project site) or / (a site of its own)
// Both can be overridden at build time without editing this file:
//   SITE=https://www.example.org BASE=/rnatwine-manual npm run build
// For another web server, build with the BASE the server will use and copy dist/ there:
// the output is plain static HTML, CSS, JS and images, with no server code.
const SITE = process.env.SITE ?? 'https://biophysical-engineering-group.github.io'   // the Pages host
const BASE = process.env.BASE ?? '/RNAtwine-Manual'                                // the repository name

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: {
    // Code in the theme on screen: light by default, dark through CSS variables (site.css).
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark-dimmed' }, wrap: true },
  },
})
