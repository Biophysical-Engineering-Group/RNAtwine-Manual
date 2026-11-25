// The manual's screen-capture slots, its TODOs and its word counts.
//
//   npm run slots            writes capture-slots.json and prints the table
//
// capture-slots.json is the list the capture script works from: each slot's name, the page
// and section it belongs to, its caption, and the two files expected in public/captures/
// (<name>-light.png, <name>-dark.png). The run fails when a page uses a slot it does not list
// in its front matter, lists one it never places, or two pages share a name.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'src/content/manual');

const pages = readdirSync(DIR)
  .filter((f) => /\.mdx?$/.test(f))
  .map((f) => {
    const text = readFileSync(join(DIR, f), 'utf8');
    const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) throw new Error(`${f}: no front matter`);
    return { file: f, slug: f.replace(/\.mdx?$/, ''), data: yaml.load(m[1]), body: m[2] };
  })
  .sort((a, b) => a.data.order - b.data.order);

// Prose words: no fenced code, no JSX tags or MDX comments, no Markdown syntax.
const words = (body) =>
  body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/[#*_`|>[\]-]+/g, ' ')
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w)).length;

const errors = [];
const slots = [];
const todos = [];
const seen = new Map();
for (const p of pages) {
  const declared = (p.data.figures ?? []).map((f) => f.name);
  const used = [...p.body.matchAll(/<Figure\s+name="([^"]+)"/g)].map((m) => m[1]);
  for (const n of used) if (!declared.includes(n)) errors.push(`${p.file}: <Figure name="${n}"> is not listed in its figures`);
  for (const n of declared) {
    const k = used.filter((u) => u === n).length;
    if (k !== 1) errors.push(`${p.file}: figure "${n}" is placed ${k} times (once expected)`);
    if (seen.has(n)) errors.push(`${p.file}: figure "${n}" is also listed by ${seen.get(n)}`);
    seen.set(n, p.file);
  }
  for (const f of p.data.figures ?? []) {
    // The heading the figure sits under, for the capture script's grouping.
    const at = p.body.indexOf(`<Figure name="${f.name}"`);
    const before = p.body.slice(0, at);
    const h = [...before.matchAll(/^##\s+(.+)$/gm)].pop();
    slots.push({
      name: f.name,
      page: p.slug,
      section: h ? h[1].trim() : p.data.title,
      caption: f.caption,
      files: [`${f.name}-light.png`, `${f.name}-dark.png`],
    });
  }
  for (const m of p.body.matchAll(/<Todo>([\s\S]*?)<\/Todo>/g)) todos.push({ page: p.slug, text: m[1].replace(/\s+/g, ' ').trim() });
  p.words = words(p.body) + words(p.data.summary ?? '');
}

writeFileSync(
  join(ROOT, 'capture-slots.json'),
  JSON.stringify({ note: 'Written by `npm run slots` from the pages\' front matter. Each slot expects <name>-light.png and <name>-dark.png in public/captures/.', slots }, null, 1) + '\n',
);

const pad = (s, n) => String(s).padEnd(n);
console.log('pages');
let total = 0;
for (const p of pages) {
  total += p.words;
  console.log(`  ${pad(p.slug, 18)} ${pad(p.data.title, 26)} ${String(p.words).padStart(5)} words  ${(p.data.figures ?? []).length} figures`);
}
console.log(`  ${pad('', 18)} ${pad('total', 26)} ${String(total).padStart(5)} words  ${slots.length} figures`);
console.log(`\nslots (capture-slots.json): ${slots.map((s) => s.name).join(', ')}`);
console.log(`\nTODOs: ${todos.length}`);
for (const t of todos) console.log(`  [${t.page}] ${t.text}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
