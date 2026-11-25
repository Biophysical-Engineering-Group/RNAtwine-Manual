// Screenshots of the built site, for review: each page given, light and dark.
//
//   npm run build && npm run shots -- getting-started build inspect
//
// Drives the installed Google Chrome (or CHROME=/path/to/chrome) through playwright-core, so
// no browser is downloaded, and answers its requests from dist/ directly (no server, no port).
// Writes tmp/previews/<page>-<theme>.png at 1440 x 1000, and <page>-mobile.png at 390 x 844.
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'tmp', 'previews');
const cfg = readFileSync(join(ROOT, 'astro.config.mjs'), 'utf8');
let BASE = process.env.BASE ?? (cfg.match(/BASE\s*=\s*process\.env\.BASE\s*\?\?\s*'([^']*)'/) || [])[1] ?? '/';
if (!BASE.endsWith('/')) BASE += '/';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['getting-started', 'build', 'inspect'];
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };

// Every request to this origin is answered from dist/.
const origin = 'http://rnatwine-manual.test';
const serve = async (route) => {
  const p = decodeURIComponent(new URL(route.request().url()).pathname);
  let f = p.startsWith(BASE) ? join(DIST, p.slice(BASE.length)) : '';
  if (f && existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: 'not found' });
  return route.fulfill({ status: 200, contentType: TYPES[extname(f)] ?? 'application/octet-stream', body: readFileSync(f) });
};
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const newContext = async (opts) => {
  const ctx = await browser.newContext(opts);
  await ctx.route(`${origin}/**`, serve);
  return ctx;
};
const written = [];
try {
  for (const slug of pages) {
    const url = `${origin}${BASE}${slug === 'index' ? '' : slug + '/'}`;
    for (const theme of ['light', 'dark']) {
      const ctx = await newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, colorScheme: theme });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      const f = join(OUT, `${slug}-${theme}.png`);
      await page.screenshot({ path: f });
      written.push(f);
      await ctx.close();
    }
    const ctx = await newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light', isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const f = join(OUT, `${slug}-mobile.png`);
    await page.screenshot({ path: f });
    written.push(f);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(written.join('\n'));
