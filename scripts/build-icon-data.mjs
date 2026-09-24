#!/usr/bin/env node
/**
 * Generates public/demo/icon-data.json: every Font Awesome Free icon's name, display label,
 * search terms (Font Awesome's own + the categories it belongs to) and, for each style it
 * ships in, its viewBox and path data.
 *
 * Run this after bumping @fortawesome/fontawesome-free (`npm run build:icon-data`) and commit
 * the result. It is not run at build time: the website (see README, "Consumed by
 * superherotech.ai") only imports src/data/catalog.ts, src/components/demos/index.ts,
 * src/library/<id>/*.astro and public/demo/*, so a file this script only produces on request
 * has to already be checked in for the website's build to see it.
 *
 * Source of truth for "is this icon actually Free" is the file system, not icons.yml: only a
 * name that exists as svgs/<style>/<name>.svg in the installed @fortawesome/fontawesome-free
 * package is included, in whichever of solid/regular/brands it ships. icons.yml (in this same
 * Free package, so it already excludes Pro-only styles) supplies the label and search terms;
 * an svg with no icons.yml entry falls back to a title-cased name and no extra terms.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = join(root, 'node_modules/@fortawesome/fontawesome-free');
const STYLES = ['solid', 'regular', 'brands'];

const icons = parseYaml(readFileSync(join(pkg, 'metadata/icons.yml'), 'utf8'));
const categories = parseYaml(readFileSync(join(pkg, 'metadata/categories.yml'), 'utf8'));

// name -> Set of category labels it belongs to
const categoryLabelsByName = new Map();
for (const cat of Object.values(categories)) {
  for (const name of cat.icons ?? []) {
    if (!categoryLabelsByName.has(name)) categoryLabelsByName.set(name, new Set());
    categoryLabelsByName.get(name).add(cat.label);
  }
}

const titleCase = (name) =>
  name
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const byName = new Map(); // name -> { n, l, t: Set, s: { solid?, regular?, brands? } }

for (const style of STYLES) {
  const dir = join(pkg, 'svgs', style);
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.svg')) continue;
    const name = file.slice(0, -4);
    const svg = readFileSync(join(dir, file), 'utf8');
    const vb = (svg.match(/\sviewBox="([^"]+)"/) || [])[1];
    const d = (svg.match(/<path[^>]*\sd="([^"]+)"/) || [])[1];
    if (!vb || !d) {
      console.warn(`skipping ${style}/${name}: no viewBox or path data found`);
      continue;
    }
    if (!byName.has(name)) {
      const meta = icons[name];
      const terms = new Set(meta?.search?.terms ?? []);
      for (const c of categoryLabelsByName.get(name) ?? []) terms.add(c.toLowerCase());
      byName.set(name, { n: name, l: meta?.label ?? titleCase(name), t: [...terms], s: {} });
    }
    byName.get(name).s[style] = [vb, d];
  }
}

const entries = [...byName.values()].sort((a, b) => a.n.localeCompare(b.n));
const out = join(root, 'public/demo/icon-data.json');
writeFileSync(out, JSON.stringify(entries));

const bytes = Buffer.byteLength(readFileSync(out));
console.log(
  `wrote ${entries.length} icons (${STYLES.map((s) => `${s}: ${entries.filter((e) => e.s[s]).length}`).join(', ')}) ` +
    `to public/demo/icon-data.json, ${(bytes / 1024).toFixed(0)} KB`,
);
