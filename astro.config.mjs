import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

// Where the site is served from. Two settings decide every link:
//   SITE: the origin, e.g. https://<github-user>.github.io or https://www.example-university.de
//   BASE: the path under it, e.g. /rnatwine-manual (a GitHub Pages project site) or / (a site of its own)
// Both can be overridden at build time without editing this file:
//   SITE=https://www.zmbh.uni-heidelberg.de BASE=/geary/rnatwine-manual npm run build
// For university hosting, build with the BASE the server will use and copy dist/ there:
// the output is plain static HTML, CSS, JS and images, with no server code.
const SITE = process.env.SITE ?? 'https://codygeary.github.io'   // TODO: the GitHub user or organisation
const BASE = process.env.BASE ?? '/rnatwine-manual'               // the repository name

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
