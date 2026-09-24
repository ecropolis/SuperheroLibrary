#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the icon element.
 *
 * 1. resolveIcon (the `// <icon-parse>` … `// </icon-parse>` block in Icon.astro, types
 *    stripped by Node, imported as a module): a known name resolves to the real file's SVG
 *    data; an unknown name or style fails with the three nearest names.
 * 2. public/demo/icon-data.json carries no icon outside what the installed
 *    @fortawesome/fontawesome-free actually ships as Free: every entry's name/style/viewBox/
 *    path must match a real svgs/<style>/<name>.svg file, so nothing Pro (and nothing stale
 *    from a different package version) can slip in unnoticed.
 * 3. The built pages (dist/icon, dist/icons, dist/index — the element's own page, this repo's
 *    dedicated browser, and the gallery card, all rendering the same demo): a plain icon tile
 *    is aria-hidden with no aria-label; the `label` example is role="img" aria-label="Delete";
 *    the `title` example carries a <title> element; the Copy string template is pinned as
 *    `icon: ${style} ${name}`.
 * 4. No Pro reference anywhere in the tracked repo (grep for @fortawesome/pro- and fa-pro).
 *
 * Exits 1 with one line per failed case.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-icon failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

const pkgRoot = join(root, 'node_modules/@fortawesome/fontawesome-free');
if (!existsSync(pkgRoot)) {
  fail('@fortawesome/fontawesome-free is not installed; `npm i` first.');
  finish('setup');
}

// -------------------------------------------------------------------- 1. resolveIcon
const component = readFileSync(join(root, 'src/library/icon/Icon.astro'), 'utf8');
const m = component.match(/\/\/ <icon-parse>\n([\s\S]*?)\/\/ <\/icon-parse>/);
if (!m) {
  fail('Icon.astro has no `// <icon-parse>` … `// </icon-parse>` block.');
  finish('resolveIcon');
}
const js = stripTypeScriptTypes(m[1], { mode: 'strip' });
const { resolveIcon } = await import(
  `data:text/javascript;base64,${Buffer.from(`import { readdirSync, readFileSync } from 'node:fs';\nimport { join } from 'node:path';\nconst STYLES = ['solid', 'regular', 'brands'];\n${js}\nexport { resolveIcon };`).toString('base64')}`
);

const houseFile = readFileSync(join(pkgRoot, 'svgs/solid/house.svg'), 'utf8');
const houseViewBox = (houseFile.match(/\sviewBox="([^"]+)"/) || [])[1];
const housePath = (houseFile.match(/<path[^>]*\sd="([^"]+)"/) || [])[1];

const got = resolveIcon(pkgRoot, 'house', 'solid');
if (got.viewBox !== houseViewBox || got.path !== housePath) {
  fail(`resolveIcon(pkgRoot, "house", "solid") did not match the file's own viewBox/path.`);
}

try {
  resolveIcon(pkgRoot, 'housee', 'solid');
  fail('resolveIcon(pkgRoot, "housee", "solid") should have thrown: "housee" is not a Font Awesome Free icon.');
} catch (e) {
  const msg = String(e.message);
  if (!/Did you mean:/.test(msg)) fail(`Unknown-name error has no "Did you mean:" suggestions: ${msg}`);
  else {
    const suggested = msg.split('Did you mean:')[1].split('?')[0];
    if (!suggested.includes('house')) fail(`Unknown-name suggestions (${suggested.trim()}) do not include "house".`);
    if (suggested.split(',').length !== 3) fail(`Expected exactly 3 suggestions, got: ${suggested.trim()}`);
  }
}

try {
  resolveIcon(pkgRoot, 'house', 'thin');
  fail('resolveIcon(pkgRoot, "house", "thin") should have thrown: Free has no "thin" style.');
} catch (e) {
  if (!/solid, regular, brands/.test(e.message)) fail(`Unknown-style error does not list the three Free styles: ${e.message}`);
}
finish('resolveIcon');

// --------------------------------------------------------------- 2. icon-data.json vs package
const dataPath = join(root, 'public/demo/icon-data.json');
if (!existsSync(dataPath)) {
  fail('public/demo/icon-data.json is missing; run `npm run build:icon-data`.');
  finish('icon-data.json');
}
const iconData = JSON.parse(readFileSync(dataPath, 'utf8'));
const STYLES = ['solid', 'regular', 'brands'];
const svgCache = new Map();
const readSvg = (style, name) => {
  const key = `${style}/${name}`;
  if (!svgCache.has(key)) {
    const p = join(pkgRoot, 'svgs', style, `${name}.svg`);
    svgCache.set(key, existsSync(p) ? readFileSync(p, 'utf8') : null);
  }
  return svgCache.get(key);
};
let checked = 0;
for (const entry of iconData) {
  for (const style of Object.keys(entry.s ?? {})) {
    if (!STYLES.includes(style)) {
      fail(`icon-data.json: "${entry.n}" has a "${style}" style, which is not one of Free's (${STYLES.join(', ')}) — a Pro style would show up exactly like this.`);
      continue;
    }
    const svg = readSvg(style, entry.n);
    if (!svg) {
      fail(`icon-data.json: "${entry.n}" (${style}) has no matching svgs/${style}/${entry.n}.svg in the installed package — it does not look like a real Free icon.`);
      continue;
    }
    const [vb, d] = entry.s[style];
    if (!svg.includes(`viewBox="${vb}"`) || !svg.includes(`d="${d}"`)) {
      fail(`icon-data.json: "${entry.n}" (${style}) viewBox/path does not match the installed file; regenerate with npm run build:icon-data.`);
    }
    checked++;
  }
}
finish('icon-data.json');

// ------------------------------------------------------------ 3. built pages
const pages = ['dist/icon/index.html', 'dist/icons/index.html', 'dist/index.html'];
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

for (const rel of pages) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    fail(`${rel} is missing; run astro build (check-catalog.mjs does).`);
    continue;
  }
  const html = readFileSync(path, 'utf8');
  // The gallery index renders every element's demo on one page, so scope to markup this demo
  // itself produces (icon-tile buttons and the two icon-pattern examples), not the other
  // elements' own decorative SVGs sharing the same page.
  const scopes = [
    ...html.matchAll(/<button\b[^>]*\sclass="icon-tile"[\s\S]*?<\/button>/g),
    ...html.matchAll(/<(button|span)\b[^>]*\sclass="icon-pattern__btn"[\s\S]*?<\/\1>/g),
  ].map((mm) => mm[0]);
  const svgs = scopes.flatMap((scope) => [...scope.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)]).map((mm) => mm[0]);
  const tileSvgs = svgs.filter((s) => !attr(s, 'aria-label') && !/<title>/.test(s));
  if (!tileSvgs.length) {
    fail(`${rel}: no plain (decorative) icon <svg> found.`);
  } else if (tileSvgs.some((s) => attr(s, 'aria-hidden') !== 'true')) {
    fail(`${rel}: a decorative icon <svg> (no label) is missing aria-hidden="true".`);
  }

  const labelled = svgs.find((s) => decode(attr(s, 'aria-label')) === 'Delete');
  if (!labelled) fail(`${rel}: no icon <svg> with aria-label="Delete" (the icon-only-button example).`);
  else if (attr(labelled, 'role') !== 'img') fail(`${rel}: the "Delete" icon has aria-label but no role="img".`);

  const titled = svgs.find((s) => /<title>Shown on hover, in supporting browsers<\/title>/.test(s));
  if (!titled) fail(`${rel}: no icon <svg> with the tooltip example's <title>.`);
  else if (attr(titled, 'aria-hidden') !== 'true') fail(`${rel}: the titled example should still be aria-hidden (it carries no label).`);

  if (rel === 'dist/icon/index.html' && !html.includes('CC BY 4.0')) {
    fail(`${rel}: the element's own page should show its licensing note (expected "CC BY 4.0").`);
  }
}
finish('built pages');

// The Copy string format, pinned in the demo's own script source (not just the built pages,
// since the string is only ever assembled client-side).
const demoSrc = readFileSync(join(root, 'src/components/demos/IconDemo.astro'), 'utf8');
if (!demoSrc.includes('`icon: ${style} ${name}`')) {
  fail('IconDemo.astro: the Copy request string is not built as `icon: ${style} ${name}`.');
}

// ------------------------------------------------------------------- 4. no Pro anywhere
let tracked;
try {
  tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
} catch {
  tracked = null;
}
if (tracked) {
  for (const rel of tracked) {
    if (rel.startsWith('node_modules/') || rel === 'package-lock.json') continue;
    if (rel === 'scripts/check-icon.mjs') continue; // names the strings it hunts for
    const path = join(root, rel);
    if (!existsSync(path)) continue;
    let text;
    try {
      text = readFileSync(path, 'utf8');
    } catch {
      continue; // binary file
    }
    if (/@fortawesome\/pro-/.test(text) || /\bfa-pro\b/.test(text)) {
      fail(`${rel}: references a Font Awesome Pro package or class, which this public repo must never carry.`);
    }
  }
} else {
  console.warn('check-icon: not a git checkout, skipping the tracked-files Pro-reference scan.');
}
finish('no Pro references');

console.log(`check-icon ok: resolveIcon pinned, ${checked} icon-data.json style entries verified against the package, ${pages.length} pages checked, no Pro references.`);
