// Check every internal link, anchor and image of the built site.
//
//   npm run build && npm run check-links
//
// Reads dist/**/*.html. A link is internal when it is relative or starts with the site's
// base path; it must name a file in dist/ (a folder means its index.html) and, with a #,
// an id on that page. External links are counted, not fetched. Exits 1 on a broken link.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const cfg = readFileSync(join(ROOT, 'astro.config.mjs'), 'utf8');
let BASE = process.env.BASE ?? (cfg.match(/BASE\s*=\s*process\.env\.BASE\s*\?\?\s*'([^']*)'/) || [])[1] ?? '/';
if (!BASE.endsWith('/')) BASE += '/';

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const html = walk(DIST).filter((f) => f.endsWith('.html'));
const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) {
    const t = readFileSync(file, 'utf8');
    ids.set(file, new Set([...t.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(file);
};

const broken = [];
let internal = 0;
const external = new Set();
for (const file of html) {
  const t = readFileSync(file, 'utf8').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  const pageUrl = '/' + posix.join(...relative(DIST, file).split(/[\\/]/)).replace(/index\.html$/, '');
  for (const m of t.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const url = m[2].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|data:)/.test(url)) { external.add(url); continue; }
    if (url === '') { broken.push(`${relative(DIST, file)}: empty ${m[1]}`); continue; }
    internal++;
    let [path, hash] = url.split('#');
    let target;
    if (path === '') target = file;
    else {
      // Resolve against the page's URL under the base, then strip the base.
      const abs = path.startsWith('/') ? path : posix.normalize(posix.join(BASE + pageUrl.slice(1), path));
      if (!abs.startsWith(BASE)) { broken.push(`${relative(DIST, file)}: ${url} is outside the base ${BASE}`); continue; }
      const rel = decodeURIComponent(abs.slice(BASE.length));
      target = join(DIST, rel);
      if (rel === '' || rel.endsWith('/')) target = join(target, 'index.html');
      else if (existsSync(target) && statSync(target).isDirectory()) {
        broken.push(`${relative(DIST, file)}: ${url} lacks its trailing slash`);
        target = join(target, 'index.html');
      }
    }
    if (!existsSync(target)) { broken.push(`${relative(DIST, file)}: ${url} -> no file ${relative(DIST, target)}`); continue; }
    if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) {
      broken.push(`${relative(DIST, file)}: ${url} -> no id "${hash}"`);
    }
  }
}
console.log(`${html.length} pages, ${internal} internal links and images checked, ${external.size} external links not fetched (base ${BASE})`);
if (external.size) console.log('external:', [...external].sort().join(' '));
if (broken.length) {
  console.error(`${broken.length} broken:\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log('no broken internal links');
