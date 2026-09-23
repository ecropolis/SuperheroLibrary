#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the flip-box element's
 * static render, which is what a visitor without JavaScript gets and what the script starts from.
 *
 * For every card on the built demo page (dist/flip-box/index.html):
 * 1. The control is a <button type="button"> with aria-expanded="false", a non-empty name, and
 *    aria-controls naming the card's back face. It carries `hidden`, so without JavaScript it is
 *    never shown.
 * 2. No-JS render: both faces are there and neither is inert or aria-hidden (the script adds
 *    those); the front holds the demo's title and text, the back its back text and the CTA as a
 *    real <a href>, with the demo's href and text.
 * 3. The front holds no link: the whole front is the button.
 * 4. The script goes out once per page and each later card only calls it.
 *
 * The expected strings are read from src/components/demos/FlipBoxDemo.astro, so a changed demo
 * does not need this file changed too. Exits 1 with one line per failed case.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-flip-box failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

// ------------------------------------------------------- expected, from the demo
const demo = readFileSync(join(root, 'src/components/demos/FlipBoxDemo.astro'), 'utf8');
const attr = (block, name) => block.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const expected = [...demo.matchAll(/<FlipBox\b([\s\S]*?)\/>/g)].map((m) => {
  const b = m[1];
  const cta = b.match(/cta=\{\{\s*text:\s*'([^']*)',\s*href:\s*'([^']*)'\s*\}\}/);
  return { title: attr(b, 'title'), text: attr(b, 'text'), backText: attr(b, 'backText'), cta: cta && { text: cta[1], href: cta[2] } };
});
if (expected.length !== 4) fail(`FlipBoxDemo.astro should render four self-closing <FlipBox … /> cards; found ${expected.length}.`);
for (const [i, e] of expected.entries()) {
  if (!e.title || !e.text || !e.backText || !e.cta) fail(`demo card ${i + 1} needs title, text, backText and cta for this check to pin it.`);
}
finish('demo');

// ------------------------------------------------------------- the built page
const page = join(root, 'dist/flip-box/index.html');
if (!existsSync(page)) {
  fail(`${page} is missing; run astro build (check-catalog.mjs does) first.`);
  finish('render');
}
const html = readFileSync(page, 'utf8');
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/** The element that starts at `index` (a <div …>), up to its matching </div>. */
const divAt = (src, index) => {
  let depth = 0;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = index;
  for (let t; (t = re.exec(src)); ) {
    depth += t[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return src.slice(index, re.lastIndex);
  }
  return src.slice(index);
};

const roots = [...html.matchAll(/<div[^>]*\sdata-fb(?=[\s>])[^>]*>/g)];
if (roots.length !== expected.length) fail(`the demo page should render ${expected.length} cards; found ${roots.length}.`);

roots.forEach((r, i) => {
  const card = divAt(html, r.index);
  const e = expected[i] ?? {};
  const n = `card ${i + 1}${e.title ? ` ("${e.title}")` : ''}`;

  if (/\sdata-(ready|open|armed)\b/.test(r[0])) fail(`${n}: the static root carries a runtime state attribute: ${r[0]}`);

  // 1. The control.
  const buttons = [...card.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map((m) => m[0]);
  const control = buttons.find((b) => /\sdata-fb-control\b/.test(b));
  if (!control) {
    fail(`${n}: no <button data-fb-control>.`);
    return;
  }
  const open = control.match(/^<button\b[^>]*>/)[0];
  if (!/\stype="button"/.test(open)) fail(`${n}: the control needs type="button".`);
  if (!/\saria-expanded="false"/.test(open)) fail(`${n}: the control needs aria-expanded="false" in the static HTML.`);
  if (!/\shidden(?=[\s>=])/.test(open)) fail(`${n}: the control must render with \`hidden\`, so a visitor without JavaScript never sees a button that does nothing.`);
  const name = text(control);
  if (!name) fail(`${n}: the control has no accessible name.`);
  else if (e.title && name !== e.title) fail(`${n}: the control is named "${name}", expected the title "${e.title}".`);
  const controls = open.match(/\saria-controls="([^"]+)"/)?.[1];
  if (!controls) fail(`${n}: the control has no aria-controls.`);

  // 2. Both faces, neither hidden, with the demo's text and the CTA.
  const frontAt = card.search(/<div[^>]*\sdata-fb-front(?=[\s>])/);
  const backAt = card.search(/<div[^>]*\sdata-fb-back(?=[\s>])/);
  if (frontAt < 0 || backAt < 0) {
    fail(`${n}: missing a face (front ${frontAt >= 0}, back ${backAt >= 0}).`);
    return;
  }
  if (backAt < frontAt) fail(`${n}: the back comes before the front; without JavaScript they stack in source order.`);
  const front = divAt(card, frontAt);
  const back = divAt(card, backAt);
  if (controls && !back.match(/^<div[^>]*>/)[0].includes(` id="${controls}"`)) fail(`${n}: aria-controls="${controls}" does not name the back face.`);
  for (const [face, src] of [['front', front], ['back', back]]) {
    const tag = src.match(/^<div[^>]*>/)[0];
    if (/\sinert\b/.test(tag) || /\saria-hidden=/.test(tag)) fail(`${n}: the ${face} face is inert or aria-hidden in the static HTML; without JavaScript it must be readable.`);
  }
  const ft = text(front);
  const bt = text(back);
  if (e.title && !ft.includes(e.title)) fail(`${n}: the front does not contain its title "${e.title}".`);
  if (e.text && !ft.includes(e.text)) fail(`${n}: the front does not contain its text "${e.text}".`);
  if (e.backText && !bt.includes(e.backText)) fail(`${n}: the back does not contain its text "${e.backText}".`);
  if (e.cta) {
    const links = [...back.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    const link = links.find((l) => text(l[2]) === e.cta.text);
    if (!link) fail(`${n}: the back has no link "${e.cta.text}".`);
    else if (decode(link[1].match(/\shref="([^"]*)"/)?.[1] ?? '') !== e.cta.href) fail(`${n}: the back link "${e.cta.text}" should point at ${e.cta.href}.`);
  }

  // 3. No link on the front.
  if (/<a\b[^>]*\shref=/.test(front)) fail(`${n}: the front holds a link; the whole front is the button, so a link there cannot be clicked.`);
});
finish('render');

// 4. The script goes out once.
const full = (html.match(/window\.__flipBox \|\|=/g) || []).length;
const calls = (html.match(/window\.__flipBox && window\.__flipBox\(\);/g) || []).length;
if (full !== 1) fail(`expected the flip-box script once on the page, found ${full}.`);
if (calls !== Math.max(0, roots.length - 1)) fail(`expected ${roots.length - 1} one-line boot calls for the later cards, found ${calls}.`);
finish('script');

console.log(`check-flip-box ok: ${roots.length} cards, both faces and the CTA in the no-JS render, aria-expanded on each control.`);
