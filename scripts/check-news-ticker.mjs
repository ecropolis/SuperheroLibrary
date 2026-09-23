#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the news-ticker element's
 * static render: what a visitor without JavaScript gets, and the accessibility contract that
 * must already be in the HTML.
 *
 * 1. The component's stylesheet: no rule hides an item unless it is scoped to the script's
 *    `[data-view='rotate']`, so the stylesheet alone can never hide a headline.
 * 2. The built demo page, dist/news-ticker/index.html, one ticker per `<section data-nt>`:
 *    - every `{ text, href }` pair in the demo is rendered as a link with that text;
 *    - no list or item is hidden, aria-hidden or inert, and there is only one list (the
 *      marquee's copy is made by the script, never shipped in the HTML);
 *    - a region named by its label (aria-labelledby resolves inside the ticker, non-empty),
 *      with aria-roledescription="ticker";
 *    - a pause button exactly when autoplay is on, shipped `hidden` (the script shows it when
 *      something moves) and named "Pause ticker"; none when autoplay is off;
 *    - arrows exactly for slide and fade; the only aria-live is the empty status line beside
 *      them, so automatic turns are never announced;
 *    - the demo shows slide, fade, marquee and an autoplay-off strip.
 *
 * Behaviour (hover, focus, reduced motion, 360px) needs a browser and is verified by hand;
 * see the PR that added the element.
 *
 * Exits 1 with one line per failed case.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-news-ticker failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

// ------------------------------------------------------------- 1. stylesheet
const component = readFileSync(join(root, 'src/library/news-ticker/NewsTicker.astro'), 'utf8');
const css = component.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
if (!css) fail('NewsTicker.astro has no <style> block.');
for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, '').split('}')) {
  const [selector, body = ''] = rule.split('{');
  if (!/\.nt__item/.test(selector ?? '')) continue;
  if (/opacity:\s*0\b|display:\s*none|visibility:\s*hidden/.test(body) && !/\[data-view='rotate'\]/.test(selector)) {
    fail(`The rule "${selector.trim()}" hides items without being scoped to [data-view='rotate']; without JavaScript every item must show.`);
  }
}
finish('stylesheet');

// ------------------------------------------------------------ 2. built page
const pagePath = join(root, 'dist/news-ticker/index.html');
if (!existsSync(pagePath)) {
  fail('dist/news-ticker/index.html is missing; run after check-catalog.mjs, which builds.');
  finish('built page');
}
const html = readFileSync(pagePath, 'utf8');
const demo = readFileSync(join(root, 'src/components/demos/NewsTickerDemo.astro'), 'utf8');
const pairs = [...demo.matchAll(/\{\s*text:\s*'((?:[^'\\]|\\.)*)',\s*href:\s*'([^']+)'/g)].map((m) => ({ text: m[1].replace(/\\'/g, "'"), href: m[2] }));
if (pairs.length < 8) fail(`Found ${pairs.length} { text, href } items in NewsTickerDemo.astro; expected the demo's items to be written as { text: '…', href: '…', … }.`);

const sections = [...html.matchAll(/<section\b([^>]*\bdata-nt\b[^>]*)>([\s\S]*?)<\/section>/g)].map((m) => ({ attrs: m[1], body: m[2] }));
if (sections.length !== 4) fail(`The demo page has ${sections.length} tickers; the demo shows 4.`);

const attr = (attrs, name) => attrs.match(new RegExp(`\\b${name}(?:="([^"]*)")?(?=[\\s>]|$)`));
const liCount = (body) => (body.match(/<li\b/g) ?? []).length;

let total = 0;
const modes = new Set();
let autoplayOff = 0;
for (const [i, s] of sections.entries()) {
  const labelId = attr(s.attrs, 'aria-labelledby')?.[1];
  const labelText = labelId && s.body.match(new RegExp(`id="${labelId}"[^>]*>([\\s\\S]*?)</div>`))?.[1].replace(/<[^>]+>/g, '').trim();
  const name = `ticker #${i + 1}${labelText ? ` ("${labelText}")` : ''}`;
  const mode = attr(s.attrs, 'data-mode')?.[1];
  const autoplay = !!attr(s.attrs, 'data-autoplay');
  const items = liCount(s.body);
  modes.add(mode);
  if (!autoplay) autoplayOff++;
  total += items;

  if (!labelText) fail(`${name}: aria-labelledby does not point at a non-empty label inside the ticker.`);
  if (attr(s.attrs, 'aria-roledescription')?.[1] !== 'ticker') fail(`${name}: no aria-roledescription="ticker".`);
  if ((s.body.match(/<ul\b/g) ?? []).length !== 1) fail(`${name}: the HTML has more than one list; the marquee copy belongs to the script.`);
  for (const m of s.body.matchAll(/<(ul|li)\b([^>]*)>/g)) {
    if (/\b(hidden|aria-hidden|inert)\b|style="/.test(m[2])) fail(`${name}: a <${m[1]}> ships hidden (${m[2].trim()}); without JavaScript every item must show.`);
  }

  const pauses = s.body.match(/<button\b[^>]*data-nt-pause[^>]*>/g) ?? [];
  if (autoplay && items > 1) {
    if (pauses.length !== 1) fail(`${name}: autoplay is on but the HTML has ${pauses.length} pause buttons; it needs exactly one.`);
    else {
      if (!/\shidden(?=[\s>])/.test(pauses[0])) fail(`${name}: the pause button must ship hidden; the script shows it when something moves.`);
      if (!/aria-label="Pause ticker"/.test(pauses[0])) fail(`${name}: the pause button is not named "Pause ticker".`);
    }
  } else if (pauses.length) fail(`${name}: autoplay is off but the HTML has a pause button.`);

  const nav = /data-nt-nav/.test(s.body);
  if (mode === 'marquee' && nav) fail(`${name}: a marquee has arrows.`);
  if (mode !== 'marquee' && items > 1 && !nav) fail(`${name}: ${mode} with several items has no arrows (the demo keeps the default).`);
  const live = [...s.body.matchAll(/<[^>]*\baria-live="[^"]*"[^>]*>([^<]*)/g)];
  for (const l of live) {
    if (!/data-nt-status/.test(l[0])) fail(`${name}: aria-live on something other than the status line (${l[0].slice(0, 80)}); automatic turns must not be announced.`);
    else if (l[1].trim()) fail(`${name}: the status line is not empty in the HTML.`);
  }
  if (nav && live.filter((l) => /data-nt-status/.test(l[0])).length !== 1) fail(`${name}: has arrows but no status line for them to announce into.`);
}

for (const p of pairs) {
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<a class="nt__link" href="${esc(p.href)}"[^>]*>(?:(?!</a>)[\\s\\S])*<span class="nt__text"[^>]*>${esc(p.text)}</span>`);
  if (!re.test(html)) fail(`"${p.text}" is not rendered as a link to ${p.href} on the demo page.`);
}
if (pairs.length && total !== pairs.length) fail(`The demo page lists ${total} items; the demo passes ${pairs.length}.`);
for (const m of ['slide', 'fade', 'marquee']) if (!modes.has(m)) fail(`The demo has no ${m} ticker.`);
if (!autoplayOff) fail('The demo has no autoplay-off ticker (the arrows-only case).');
finish('built page');

console.log(`check-news-ticker ok: ${sections.length} tickers, ${total} links without JavaScript, pause buttons and live regions as specified.`);
