#!/usr/bin/env node
/**
 * npm run check — holds the rules that make an element "finished" and the layout that
 * superherotech.ai depends on (README, "Consumed by superherotech.ai").
 *
 * 1. Catalogue rules, read from src/data/catalog.ts (Node strips the types).
 * 2. The demos index, read as text: Node cannot import .astro files, so the
 *    `'<id>': Component` lines and the `import Component from './File.astro'` lines are
 *    parsed. Keep one entry per line there.
 * 3. Demo imports and assets: a demo imports only from src/library/ (and JSON fixtures
 *    from public/demo/); every
 *    `asset('<file>')` in it exists in public/demo/, and no demo hard-codes /demo/ (the
 *    website may serve those files from another folder and passes `assetBase`).
 * 4. `astro build`, then one page per entry in dist/.
 *
 * `npm run build` does not run this, and the website's fetch of the tarball does not
 * either. CI runs it before calling the website's deploy hook.
 *
 * Exits 1 with one sentence per broken rule, naming the entry.
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => relative(root, p);
const failures = [];
const fail = (msg) => failures.push(msg);

function finish(stage) {
  if (failures.length === 0) return;
  console.error(`check failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

// ---------------------------------------------------------------- 1. catalogue
const { catalog } = await import(pathToFileURL(join(root, 'src/data/catalog.ts')).href);

if (!Array.isArray(catalog) || catalog.length === 0) {
  fail('src/data/catalog.ts exports no entries in `catalog`.');
  finish('catalogue');
}

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const norm = (q) => String(q).trim().toLowerCase().replace(/\s+/g, ' ');
const seenIds = new Map();
const queries = new Map(); // normalised query -> id

for (const [i, e] of catalog.entries()) {
  const name = e?.id ? `"${e.id}"` : `entry #${i + 1}`;

  if (typeof e.id !== 'string' || !KEBAB.test(e.id)) {
    fail(`Entry ${name} has an id that is not kebab-case (lowercase words joined by single hyphens).`);
  } else if (seenIds.has(e.id)) {
    fail(`Entry ${name} uses an id that entry #${seenIds.get(e.id) + 1} already uses; ids must be unique.`);
  } else {
    seenIds.set(e.id, i);
  }

  if (typeof e.file !== 'string' || !e.file) {
    fail(`Entry ${name} has no \`file\`.`);
  } else {
    if (!existsSync(join(root, e.file))) fail(`Entry ${name} names file ${e.file}, which does not exist.`);
    const expected = new RegExp(`^src/library/${e.id}/[A-Z][A-Za-z0-9]*\\.astro$`);
    if (!expected.test(e.file)) {
      fail(`Entry ${name} has file ${e.file}; the website expects src/library/${e.id}/<PascalName>.astro.`);
    }
  }

  if (typeof e.pitch !== 'string' || !e.pitch.trim()) {
    fail(`Entry ${name} has no \`pitch\`, the one-sentence lead for its page on superherotech.ai.`);
  }

  if (!e.search || typeof e.search.query !== 'string' || !e.search.query.trim()) {
    fail(`Entry ${name} has no \`search.query\`, the one search its page on superherotech.ai targets.`);
  } else {
    const q = norm(e.search.query);
    if (e.search.query !== e.search.query.toLowerCase().trim()) {
      fail(`Entry ${name} has search.query "${e.search.query}"; write it lowercase, as searched. The website capitalises it for titles.`);
    }
    if (queries.has(q)) {
      fail(`Entry ${name} targets "${e.search.query}", which "${queries.get(q)}" already targets; two pages in one auction both lose.`);
    } else {
      queries.set(q, e.id);
    }
    if (e.search.alsoRanks !== undefined && !Array.isArray(e.search.alsoRanks)) {
      fail(`Entry ${name} has a \`search.alsoRanks\` that is not a list of strings.`);
    }
  }

  const d = typeof e.added === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.added) ? new Date(`${e.added}T00:00:00Z`) : null;
  if (!d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== e.added) {
    fail(`Entry ${name} has \`added\` "${e.added}", which is not a date in YYYY-MM-DD form.`);
  }

  if (!Array.isArray(e.usedOn) || e.usedOn.length === 0) {
    fail(`Entry ${name} has an empty \`usedOn\`; an element nobody uses is not finished.`);
  }
}

// A query may not be claimed as another entry's alsoRanks either.
for (const e of catalog) {
  for (const a of e.search?.alsoRanks ?? []) {
    const owner = queries.get(norm(a));
    if (owner && owner !== e.id) {
      fail(`Entry "${e.id}" lists "${a}" in alsoRanks, but that is the query "${owner}" targets.`);
    }
  }
}
finish('catalogue');

// ------------------------------------------------------------- 2. demos index
const demosDir = join(root, 'src/components/demos');
const indexPath = join(demosDir, 'index.ts');
if (!existsSync(indexPath)) {
  fail(`${rel(indexPath)} is missing; the gallery and the website import every demo from it.`);
  finish('demos index');
}
const indexSrc = readFileSync(indexPath, 'utf8');
const imports = new Map(); // Component -> file
for (const m of indexSrc.matchAll(/^import\s+(\w+)\s+from\s+['"]\.\/([^'"]+\.astro)['"];?/gm)) imports.set(m[1], m[2]);
const entries = new Map(); // id -> Component
const block = indexSrc.match(/export const demos[^=]*=\s*\{([\s\S]*?)\};/);
if (!block) {
  fail(`${rel(indexPath)} does not export a \`demos\` object literal.`);
  finish('demos index');
}
for (const m of block[1].matchAll(/^\s*['"]?([\w-]+)['"]?\s*:\s*(\w+)\s*,?\s*$/gm)) entries.set(m[1], m[2]);

const ids = new Set(catalog.map((e) => e.id));
const demoFiles = new Map(); // id -> absolute path
for (const e of catalog) {
  const comp = entries.get(e.id);
  if (!comp) {
    fail(`Entry "${e.id}" has no demo in ${rel(indexPath)}; every element needs one.`);
    continue;
  }
  const file = imports.get(comp);
  if (!file) {
    fail(`Entry "${e.id}" maps to ${comp} in ${rel(indexPath)}, which is not imported from a ./<Name>.astro file there.`);
    continue;
  }
  const abs = join(demosDir, file);
  if (!existsSync(abs)) fail(`Entry "${e.id}" has demo ${rel(abs)}, which does not exist.`);
  else demoFiles.set(e.id, abs);
}
for (const id of entries.keys()) {
  if (!ids.has(id)) fail(`${rel(indexPath)} has a demo for "${id}", which is not in the catalogue.`);
}
finish('demos index');

// ------------------------------------------------- 3. demo imports and assets
// The website copies src/ without src/pages/ and must not pull in the gallery's layout
// or global stylesheet, so a demo may import only from src/library/. The one exception is a
// JSON fixture in public/demo/ (social-grid's feed): the website vendors public/demo/ beside
// src/, so the relative path resolves there as well.
const library = join(root, 'src/library') + '/';
const demoAssets = join(root, 'public/demo') + '/';
for (const [id, abs] of demoFiles) {
  const src = readFileSync(abs, 'utf8');
  for (const m of src.matchAll(/^\s*import\s*(?:[^'";]*?\bfrom\s*)?['"]([^'"]+)['"]/gm)) {
    const target = m[1].startsWith('.') ? join(dirname(abs), m[1]) : null;
    if (target && target.startsWith(demoAssets) && target.endsWith('.json')) {
      if (!existsSync(target)) fail(`Entry "${id}": its demo imports "${m[1]}", which is not in public/demo/.`);
      continue;
    }
    if (!target || !target.startsWith(library)) {
      fail(`Entry "${id}": its demo imports "${m[1]}"; demos may import only from src/library/ (and JSON fixtures from public/demo/), so the website never pulls in the gallery's pages, layout or styles.`);
    }
  }
  for (const m of src.matchAll(/asset\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (!existsSync(join(root, 'public/demo', m[1]))) {
      fail(`Entry "${id}": its demo uses asset '${m[1]}', which is not in public/demo/.`);
    }
  }
  for (const m of src.matchAll(/['"`]\/demo\/([^'"`]*)['"`]/g)) {
    const before = src.slice(Math.max(0, m.index - 40), m.index);
    if (/assetBase\s*=\s*$/.test(before)) continue; // the prop's default value
    fail(`Entry "${id}": its demo hard-codes "/demo/${m[1]}"; use asset('${m[1]}') so the website can serve it from /elements-demo/.`);
  }
}
finish('demo imports and assets');

// ------------------------------------------------------------------- 4. build
console.log('catalogue, demos index, demo imports and assets: ok. Building…');
const astro = join(root, 'node_modules/.bin/astro');
const build = spawnSync(astro, ['build'], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) {
  fail(`astro build exited with status ${build.status}.`);
  finish('build');
}
const dist = join(root, 'dist');
const home = existsSync(join(dist, 'index.html')) ? readFileSync(join(dist, 'index.html'), 'utf8') : '';
if (!home) fail('astro build produced no dist/index.html for the gallery.');
for (const e of catalog) {
  const page = join(dist, e.id, 'index.html');
  if (!existsSync(page)) {
    fail(`Entry "${e.id}" has no page in the build; expected ${rel(page)}.`);
    continue;
  }
  if (!readFileSync(page, 'utf8').includes(`<code class="id"`)) {
    fail(`Entry "${e.id}": ${rel(page)} does not look like an element page.`);
  }
  if (home && !home.includes(`href="/${e.id}/"`)) fail(`Entry "${e.id}" is not linked from the gallery index.`);
}
finish('build output');

console.log(`check ok: ${catalog.length} elements, ${catalog.length} pages built.`);
