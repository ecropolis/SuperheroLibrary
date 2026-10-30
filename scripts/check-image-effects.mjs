#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins image-effects.
 *
 * Source (src/library/image-effects/ImageEffects.astro)
 * 1. The `<image-effects-list>` block names exactly the effects the catalogue's `effect` prop
 *    lists, in the same order, so the docs never offer an effect the file refuses or hide one
 *    it has.
 * 2. The stylesheet: every transition, animation and will-change sits inside
 *    `@media (prefers-reduced-motion: no-preference)`; so do zoom's `scale` and shine's sweep.
 *    No `:hover` in it stands without a keyboard twin (`:focus-visible` or `:focus-within`) in
 *    the same selector, except tilt (the script does it) and caption's figure hover, which
 *    carries `:focus-within`.
 * 3. The runtime: each moving block (`<ie-pixelate>`, `<ie-tilt>`, `<ie-tiles>`,
 *    `<ie-gallery>`) reads `still.matches` (reduced motion, tracked live), and the tile
 *    animation uses Slider Revolution's numbers: 1000 ms, 45 ms apart, power3.out.
 *
 * Built pages (the demo page and the gallery index)
 * 4. The stylesheet and the runtime are on the page once; every scripted root (pixelate,
 *    tilt, tiles, gallery-open) is followed straight away by its mount line; a CSS-only root
 *    is not.
 * 5. Every <img> in an element has an alt attribute.
 * 6. tiles, as a visitor without JavaScript gets it: a named carousel, slides as groups named
 *    "n of total", the first one current, the controls `hidden` with three named buttons.
 *    On the index (`quiet`) it neither autoplays nor flies in on load.
 *
 * Mutation tests: the built-page checks run again on broken copies of the demo page; each must
 * be caught, or the check itself is broken.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'src/library/image-effects/ImageEffects.astro';
const failures = [];
const fail = (m) => failures.push(m);
const src = readFileSync(join(root, SRC), 'utf8');
const { catalog } = await import(pathToFileURL(join(root, 'src/data/catalog.ts')).href);
const entry = catalog.find((e) => e.id === 'image-effects');

// ------------------------------------------------------------------ 1. effect list
const listBlock = src.match(/\/\/ <image-effects-list>([\s\S]*?)\/\/ <\/image-effects-list>/)?.[1] ?? '';
const quoted = (s) => [...s.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
const fileEffects = quoted(listBlock);
const docEffects = quoted(entry?.props.find((p) => p.name === 'effect')?.type ?? '');
if (!fileEffects.length) fail(`${SRC}: no <image-effects-list> block.`);
if (fileEffects.join() !== docEffects.join()) {
  fail(`${SRC} offers [${fileEffects.join(', ')}] but the catalogue's \`effect\` prop lists [${docEffects.join(', ')}]; keep them the same, in order.`);
}

// ------------------------------------------------------------------ 2. stylesheet
const css = (src.match(/<style is:inline data-ie-style>([\s\S]*?)<\/style>/)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
if (!css) fail(`${SRC}: no <style is:inline data-ie-style> stylesheet.`);

/** Split a stylesheet into top-level rules and @media blocks: [{ media, selector, body }]. */
function flatten(sheet) {
  const out = [];
  let i = 0;
  const walk = (media) => {
    while (i < sheet.length) {
      const open = sheet.indexOf('{', i);
      const close = sheet.indexOf('}', i);
      if (close !== -1 && (open === -1 || close < open)) {
        i = close + 1;
        return;
      }
      if (open === -1) return;
      const head = sheet.slice(i, open).trim();
      i = open + 1;
      if (head.startsWith('@media')) walk(head);
      else {
        const end = sheet.indexOf('}', i);
        out.push({ media, selector: head, body: sheet.slice(i, end) });
        i = end + 1;
      }
    }
  };
  walk(null);
  return out;
}
function cssFailures(sheet) {
  const out = [];
  const NO_PREF = /prefers-reduced-motion:\s*no-preference/;
  for (const r of flatten(sheet)) {
    const motion = /(^|;|\s)(transition|animation|will-change)\s*:/.test(r.body) ||
      (/\bscale\s*:/.test(r.body) && /ie-zoom/.test(r.selector)) ||
      (/\btranslate\s*:/.test(r.body) && /ie-shine/.test(r.selector) && /:hover/.test(r.selector));
    if (motion && !NO_PREF.test(r.media ?? '')) out.push(`image-effects stylesheet: "${r.selector}" moves outside @media (prefers-reduced-motion: no-preference).`);
    for (const sel of r.selector.split(/,(?![^(]*\))/)) {
      if (/:hover/.test(sel) && !/:focus-visible|:focus-within/.test(sel)) out.push(`image-effects stylesheet: "${sel.trim()}" answers hover without keyboard focus.`);
    }
  }
  return out;
}
cssFailures(css).forEach(fail);

// ------------------------------------------------------------------ 3. runtime
for (const name of ['pixelate', 'tilt', 'tiles', 'gallery']) {
  const block = src.match(new RegExp(`// <ie-${name}>([\\s\\S]*?)// </ie-${name}>`))?.[1];
  if (!block) fail(`${SRC}: no <ie-${name}> block in the runtime.`);
  else if (!/still\.matches/.test(block)) fail(`${SRC}: <ie-${name}> never reads still.matches, so it ignores reduced motion.`);
}
const tilesBlock = src.match(/\/\/ <ie-tiles>([\s\S]*?)\/\/ <\/ie-tiles>/)?.[1] ?? '';
if (!/duration:\s*1000,\s*delay:\s*\(r \* n \+ c\) \* 45/.test(tilesBlock)) fail(`${SRC}: the tiles no longer fly in over 1000 ms, 45 ms apart.`);
if (!tilesBlock.includes("'cubic-bezier(0.215, 0.61, 0.355, 1)'")) fail(`${SRC}: the tiles no longer ease with power3.out, cubic-bezier(0.215, 0.61, 0.355, 1).`);

// ------------------------------------------------------------------ 4–6. built pages
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const block = (html, index, tag) => {
  const re = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g');
  re.lastIndex = index;
  let depth = 0;
  for (let t; (t = re.exec(html)); ) {
    depth += t[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(index, re.lastIndex);
  }
  return html.slice(index);
};
const SCRIPTED = new Set(['pixelate', 'tilt', 'tiles', 'gallery-open']);
const MOUNT = 'window.__imageEffects.mount(document.currentScript.previousElementSibling);';

function pageFailures(html, where, { quiet = false } = {}) {
  const out = [];
  const roots = [...html.matchAll(/<(figure|section|div)\b[^>]*\sdata-ie="([a-z-]+)"[^>]*>/g)].map((m) => ({
    tag: m[1], effect: m[2], open: m[0], index: m.index, html: block(html, m.index, m[1]),
  }));
  if (!roots.length) return [`${where}: no image-effects elements.`];
  const styles = (html.match(/<style\b[^>]*data-ie-style/g) ?? []).length;
  if (styles !== 1) out.push(`${where}: the image-effects stylesheet is on the page ${styles} times; once.`);
  const runtimes = html.split('window.__imageEffects = {').length - 1;
  const wantRuntime = roots.some((r) => SCRIPTED.has(r.effect)) ? 1 : 0;
  if (runtimes !== wantRuntime) out.push(`${where}: the image-effects runtime is on the page ${runtimes} times; ${wantRuntime ? 'once' : 'never, since every effect here is CSS only'}.`);
  for (const r of roots) {
    const w = `${where}, ${r.effect}`;
    const after = html.slice(r.index + r.html.length).match(/^\s*<script\b[^>]*>([\s\S]*?)<\/script>/)?.[1]?.trim();
    if (SCRIPTED.has(r.effect) && after !== MOUNT) out.push(`${w}: not followed straight away by its mount line, so it would wait for a later script or flash.`);
    if (!SCRIPTED.has(r.effect) && after === MOUNT) out.push(`${w}: CSS only, but followed by a mount line.`);
    for (const img of r.html.match(/<img\b[^>]*>/g) ?? []) {
      if (attr(img, 'alt') === undefined) out.push(`${w}: an <img> (${attr(img, 'src')}) has no alt attribute.`);
    }
    if (r.effect !== 'tiles') continue;
    if (attr(r.open, 'aria-roledescription') !== 'carousel' || !attr(r.open, 'aria-label')) out.push(`${w}: not a named carousel.`);
    const slides = [...r.html.matchAll(/<div\b[^>]*\sdata-ie-slide[^>]*>/g)].map((m) => m[0]);
    if (slides.length < 2) out.push(`${w}: ${slides.length} slides; two or more.`);
    slides.forEach((s, i) => {
      if (attr(s, 'role') !== 'group' || attr(s, 'aria-roledescription') !== 'slide') out.push(`${w}: slide ${i + 1} is not a group with the role description "slide".`);
      if (attr(s, 'aria-label') !== `${i + 1} of ${slides.length}`) out.push(`${w}: slide ${i + 1} is named "${attr(s, 'aria-label')}", not "${i + 1} of ${slides.length}".`);
      if (/\bis-current\b/.test(attr(s, 'class') ?? '') !== (i === 0)) out.push(`${w}: slide ${i + 1} ${i === 0 ? 'is not' : 'is'} current in the HTML; without JavaScript the first slide shows.`);
    });
    const controls = r.html.match(/<div\b[^>]*\sdata-ie-controls[^>]*>/)?.[0];
    if (!controls || attr(controls, 'hidden') === undefined) out.push(`${w}: the controls are not hidden in the HTML; without JavaScript they would do nothing.`);
    const buttons = [...r.html.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
    if (buttons.length !== 3 || buttons.some((b) => attr(b, 'type') !== 'button' || !attr(b, 'aria-label'))) out.push(`${w}: expected three named <button type="button">s (previous, pause, next).`);
    if (quiet && (attr(r.open, 'data-autoplay') !== '0' || attr(r.open, 'data-intro') !== '0')) out.push(`${w}: on a quiet page it must neither autoplay nor fly in on load.`);
  }
  return out;
}

const pages = [
  ['dist/image-effects/index.html', {}],
  ['dist/index.html', { quiet: true }],
];
let demoHtml = '';
for (const [file, opts] of pages) {
  const abs = join(root, file);
  if (!existsSync(abs)) {
    fail(`${file} is missing; run check-catalog.mjs (it builds) first.`);
    continue;
  }
  const html = readFileSync(abs, 'utf8');
  if (file.includes('image-effects')) demoHtml = html;
  pageFailures(html, file, opts).forEach(fail);
}

// ------------------------------------------------------------------ mutation tests
const mutants = demoHtml
  ? [
      ['an image without alt', () => pageFailures(demoHtml.replace(/(<img class="ie__img" src="[^"]*") alt="[^"]*"/, '$1'), 'm'), /has no alt/],
      ['the runtime twice', () => pageFailures(demoHtml.replace('</body>', '<script>window.__imageEffects = {}</script></body>'), 'm'), /runtime is on the page 2 times/],
      ['the stylesheet twice', () => pageFailures(demoHtml.replace('</body>', '<style data-ie-style></style></body>'), 'm'), /stylesheet is on the page 2 times/],
      ['a missing mount line', () => pageFailures(demoHtml.replace(MOUNT, ''), 'm'), /mount line/],
      ['controls shown without JavaScript', () => pageFailures(demoHtml.replace(/(data-ie-controls)/, '$1-x').replace(/<div class="ie-tiles__controls" hidden/, '<div class="ie-tiles__controls" data-ie-controls'), 'm'), /controls are not hidden/],
      ['the second slide current', () => pageFailures(demoHtml.replace('class="ie-tiles__slide" role="group"', 'class="ie-tiles__slide is-current" role="group"'), 'm'), /slide 2 is current/],
      ['an autoplaying quiet demo', () => pageFailures(demoHtml, 'm', { quiet: true }), /quiet page/],
      ['a transition outside no-preference', () => cssFailures(`${css}\n.ie-zoom .ie__img { transition: scale 1s; }`), /moves outside/],
      ['a hover without focus', () => cssFailures(`${css}\n.ie-zoom .ie__frame:hover .ie__img { filter: none; }`), /without keyboard focus/],
    ]
  : [];
for (const [name, run, expect] of mutants) {
  const got = run();
  if (!got.some((f) => expect.test(f))) fail(`mutant "${name}" was not caught${got.length ? ` (got: ${got[0]})` : ''}.`);
}

if (failures.length) {
  console.error('check-image-effects failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`check-image-effects ok: ${fileEffects.length} effects, ${pages.length} pages, ${mutants.length} mutants caught.`);
