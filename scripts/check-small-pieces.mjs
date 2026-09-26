#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the round-4 small pieces on
 * their built pages, which are exactly what a visitor without JavaScript gets, and on the
 * gallery index, where every demo shares one page.
 *
 * tags
 * - Each list is a <ul role="list"> with an id; no chip ships hidden (no-JS shows them all).
 * - removable: every chip has one <button type="button" hidden data-tg-remove> named
 *   "Remove <its visible text>", and an empty role="status" line. Other modes have none.
 *   links: every chip is an <a href>.
 * - max: "+N more" exactly when there are more than max, shipped hidden, aria-expanded="false",
 *   aria-controls naming the list, N right.
 * - A list that needs the script is followed straight away by its mount script (so it settles
 *   before the first paint); the runtime is defined once per page.
 * - Chip colours from the component's CSS clear 4.5:1.
 *
 * scrollbox
 * - The scroller is role="region" with a non-empty aria-label and tabindex="0"; buttons, when
 *   present, are type="button", hidden, named, and aria-controls the scroller; nothing ships
 *   with the script's state (no data-ready, no room variables), so there are no fades.
 * - The fade logic: `scrollboxEdges`, cut from the EMITTED script between its markers and run
 *   against cases (fits, sub-pixel, start, middle, end, overscroll, right-to-left).
 * - The CSS: the mask only under [data-ready]; the mask reads the room variables; the
 *   scrollbar is never hidden; the scroller is position: relative (it must contain positioned
 *   descendants, or they widen the page); a button press is instant under reduced motion.
 *
 * sticker
 * - Each sticker: not interactive, and named as the demo expects: the visible text, or (with a
 *   label, or a bare "-20%") the text aria-hidden and the name in a visually hidden span.
 * - The CSS: position: absolute, pointer-events: none, no animation or transition, and the
 *   three tones' fallback pairs clear 4.5:1.
 *
 * Mutation tests: each element's checks are run again on deliberately broken copies (see
 * `mutants`). Every mutant must be caught, or the check itself is broken.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-small-pieces failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};
const read = (rel) => {
  const path = join(root, rel);
  if (!existsSync(path)) {
    fail(`${rel} is missing; run astro build (check-catalog.mjs does) first.`);
    return '';
  }
  return readFileSync(path, 'utf8');
};
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const decode = (s) =>
  s
    ?.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const text = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
/** The element that starts at `index` (an opening `tag`), through its matching close. */
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
const roots = (html, tag, marker) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*\\s${marker}(?=[\\s>=])[^>]*>`, 'g'))].map((m) => ({ open: m[0], index: m.index, html: block(html, m.index, tag) }));
/** The script straight after the element (only whitespace between), or null. */
const scriptAfter = (html, r) => {
  const rest = html.slice(r.index + r.html.length);
  const m = rest.match(/^\s*<script\b[^>]*>([\s\S]*?)<\/script>/);
  return m ? m[1] : null;
};
const lum = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const styleOf = (src) => (src.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
/** [selector, body] for every rule in a flat stylesheet (media blocks flattened). */
const rules = (css) =>
  [...css.replace(/@media[^{]*\{/g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);

// =================================================================== tags
const TAGS_SRC = 'src/library/tags/Tags.astro';
function checkTags(html, where, { demo = false } = {}) {
  const out = [];
  const lists = roots(html, 'div', 'data-tg');
  if (demo && lists.length !== 3) out.push(`${where}: expected the demo's 3 tag lists, found ${lists.length}.`);
  const modes = new Set();
  let withMax = 0;
  let needScript = 0;
  lists.forEach((l, i) => {
    const mode = l.open.match(/\btg--(static|links|removable)\b/)?.[1];
    const w = `${where}, tags ${i + 1} (${mode ?? '?'})`;
    modes.add(mode);
    let cfg = {};
    try {
      cfg = JSON.parse(decode(attr(l.open, 'data-tg')));
    } catch {
      out.push(`${w}: data-tg is not JSON.`);
    }
    if (attr(l.open, 'data-ready') !== undefined) out.push(`${w}: ships with data-ready; that is the script's state.`);
    const ul = l.html.match(/<ul\b[^>]*>/)?.[0];
    if (!ul) return out.push(`${w}: no <ul>.`);
    if (attr(ul, 'role') !== 'list') out.push(`${w}: the <ul> needs role="list" (VoiceOver drops list semantics on list-style: none).`);
    const listId = attr(ul, 'id');
    if (!listId) out.push(`${w}: the <ul> has no id for "+N more" to control.`);
    const items = [...l.html.matchAll(/<li\b[^>]*>/g)].map((m) => ({ open: m[0], html: block(l.html, m.index, 'li') }));
    if (!items.length) out.push(`${w}: no chips.`);
    for (const it of items) {
      const t = text(it.html.match(/<[a-z]+\b[^>]*\sdata-tg-text[^>]*>([\s\S]*?)<\/[a-z]+>/)?.[1] ?? '');
      if (attr(it.open, 'hidden') !== undefined || /aria-hidden|inert/.test(it.open)) out.push(`${w}: the chip "${t}" ships hidden; without JavaScript every chip shows.`);
      const removes = [...it.html.matchAll(/<button\b[^>]*\sdata-tg-remove[^>]*>/g)].map((m) => m[0]);
      if (mode === 'removable') {
        if (removes.length !== 1) out.push(`${w}: the chip "${t}" has ${removes.length} removal buttons; it needs one.`);
        const b = removes[0];
        if (b) {
          if (attr(b, 'type') !== 'button') out.push(`${w}: "${t}"'s removal button needs type="button".`);
          if (attr(b, 'hidden') === undefined) out.push(`${w}: "${t}"'s removal button must ship hidden; without JavaScript it would do nothing.`);
          const name = decode(attr(b, 'aria-label') ?? '');
          if (name !== `Remove ${t}`) out.push(`${w}: "${t}"'s removal button is named "${name}", expected "Remove ${t}".`);
        }
      } else if (removes.length) out.push(`${w}: a ${mode} chip has a removal button.`);
      if (mode === 'links' && !/<a\b[^>]*\shref="[^"]+"/.test(it.html)) out.push(`${w}: the chip "${t}" is not a link.`);
    }
    const status = l.html.match(/<[a-z]+\b[^>]*\sdata-tg-status[^>]*>([\s\S]*?)<\/[a-z]+>/);
    if (mode === 'removable') {
      if (!status || attr(status[0], 'role') !== 'status') out.push(`${w}: no role="status" line for "Removed <tag>".`);
      else if (text(status[1])) out.push(`${w}: the status line is not empty in the HTML.`);
    } else if (status) out.push(`${w}: a ${mode} list has a status line.`);
    const more = l.html.match(/<button\b[^>]*\sdata-tg-more[^>]*>([\s\S]*?)<\/button>/);
    const max = cfg.max || 0;
    const expectMore = max > 0 && items.length > max;
    if (max > 0) withMax++;
    if (expectMore) {
      if (!more) out.push(`${w}: ${items.length} chips and max ${max}, but no "+N more" button.`);
      else {
        const open = more[0].match(/^<button\b[^>]*>/)[0];
        if (attr(open, 'hidden') === undefined) out.push(`${w}: "+N more" must ship hidden; without JavaScript every chip already shows.`);
        if (attr(open, 'aria-expanded') !== 'false') out.push(`${w}: "+N more" needs aria-expanded="false".`);
        if (attr(open, 'aria-controls') !== listId) out.push(`${w}: "+N more" must aria-controls the list (#${listId}).`);
        if (text(more[1]) !== `+${items.length - max} more`) out.push(`${w}: "+N more" reads "${text(more[1])}", expected "+${items.length - max} more".`);
      }
    } else if (more) out.push(`${w}: a "+N more" button with nothing to hide.`);
    if (mode === 'removable' || expectMore) {
      needScript++;
      const s = scriptAfter(html, l);
      if (!s || !s.includes('window.__superheroTags.mount(document.currentScript.previousElementSibling)')) {
        out.push(`${w}: its mount script must come straight after it, or the list settles after the first paint and jumps.`);
      }
    }
  });
  if (demo) {
    for (const m of ['static', 'links', 'removable']) if (!modes.has(m)) out.push(`${where}: the demo has no ${m} list.`);
    if (!withMax) out.push(`${where}: the demo has no list with max.`);
  }
  const defs = (html.match(/window\.__superheroTags=window\.__superheroTags\|\|/g) || []).length;
  if (needScript && defs !== 1) out.push(`${where}: the tags runtime is defined ${defs} times; it must be once per page.`);
  return out;
}
function checkTagsCss(src) {
  const out = [];
  const ratios = [];
  const tag = src.match(/\.tg__tag \{[^}]*?background: var\(--tg-bg, (#[0-9a-f]{3,6})\);\s*color: var\(--tg-fg, (#[0-9a-f]{3,6})\);/i);
  const hover = src.match(/a\.tg__tag:hover \{\s*background: var\(--tg-hover-bg, (#[0-9a-f]{3,6})\);/i);
  const moreFg = src.match(/\.tg__more \{[^}]*?color: var\(--tg-more-fg, (#[0-9a-f]{3,6})\);/i);
  if (!tag) out.push(`${TAGS_SRC}: no \`.tg__tag { … background: var(--tg-bg, #…); color: var(--tg-fg, #…); }\` to measure.`);
  else {
    for (const [what, bg] of [['chip', tag[1]], ['hovered link chip', hover?.[1]], ['"+N more" on white', null]]) {
      const [a, b] = bg === null ? [moreFg?.[1], '#ffffff'] : [tag[2], bg];
      if (!a || !b) {
        out.push(`${TAGS_SRC}: cannot find the ${what} colours to measure.`);
        continue;
      }
      const r = contrast(a, b);
      ratios.push(`${what} ${r.toFixed(2)}`);
      if (r < 4.5) out.push(`tags: the ${what} is ${a} on ${b}, ${r.toFixed(2)}:1, under 4.5:1.`);
    }
  }
  return { out, ratios };
}

// ============================================================== scrollbox
const SB_SRC = 'src/library/scrollbox/Scrollbox.astro';
function checkScrollbox(html, where, { demo = false } = {}) {
  const out = [];
  const boxes = roots(html, 'div', 'data-sb');
  if (demo && boxes.length !== 3) out.push(`${where}: expected the demo's 3 scrollboxes, found ${boxes.length}.`);
  let withArrows = 0;
  boxes.forEach((b, i) => {
    const w = `${where}, scrollbox ${i + 1}`;
    if (attr(b.open, 'data-ready') !== undefined || attr(b.open, 'data-overflow') !== undefined) out.push(`${w}: ships with the script's state (data-ready / data-overflow); without JavaScript there are no fades.`);
    const vp = b.html.match(/<div\b[^>]*\sdata-sb-viewport[^>]*>/)?.[0];
    if (!vp) return out.push(`${w}: no scroller.`);
    if (attr(vp, 'role') !== 'region') out.push(`${w}: the scroller is not role="region".`);
    if (!decode(attr(vp, 'aria-label') ?? '').trim()) out.push(`${w}: the scroller's region has no name (aria-label).`);
    if (attr(vp, 'tabindex') !== '0') out.push(`${w}: the scroller needs tabindex="0" so a keyboard can scroll it.`);
    if (/--sb-room/.test(attr(vp, 'style') ?? '')) out.push(`${w}: the scroller ships with room variables; the fades are the script's.`);
    const id = attr(vp, 'id');
    const btns = [...b.html.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
    if (btns.length) {
      withArrows++;
      if (btns.length !== 2) out.push(`${w}: ${btns.length} buttons; arrows are two.`);
      for (const btn of btns) {
        const name = decode(attr(btn, 'aria-label') ?? '');
        if (attr(btn, 'type') !== 'button') out.push(`${w}: the "${name}" button needs type="button".`);
        if (attr(btn, 'hidden') === undefined) out.push(`${w}: the "${name}" button must ship hidden; the script shows it when there is somewhere to go.`);
        if (!name.trim()) out.push(`${w}: a button has no name.`);
        if (!id || attr(btn, 'aria-controls') !== id) out.push(`${w}: the "${name}" button must aria-controls the scroller.`);
      }
      if (demo && !btns.some((x) => attr(x, 'aria-label') === 'Scroll left')) out.push(`${w}: no "Scroll left" button.`);
      if (demo && !btns.some((x) => attr(x, 'aria-label') === 'Scroll right')) out.push(`${w}: no "Scroll right" button.`);
    }
    const s = scriptAfter(html, b);
    if (!s || !s.includes('window.__superheroScrollbox.mount(document.currentScript.previousElementSibling)')) out.push(`${w}: its mount script must come straight after it.`);
  });
  if (demo && !withArrows) out.push(`${where}: the demo has no scrollbox with arrows.`);
  if (demo && withArrows === boxes.length) out.push(`${where}: the demo has no scrollbox without arrows.`);
  const defs = (html.match(/window\.__superheroScrollbox=window\.__superheroScrollbox\|\|/g) || []).length;
  if (boxes.length && defs !== 1) out.push(`${where}: the scrollbox runtime is defined ${defs} times; it must be once per page.`);
  if (boxes.length && !/behavior:\s*still\.matches\s*\?\s*["']auto["']\s*:\s*["']smooth["']/.test(html)) out.push(`${where}: the emitted script does not jump at once under prefers-reduced-motion.`);
  if (boxes.length && !/matchMedia\(\s*["']\(prefers-reduced-motion: reduce\)["']\s*\)/.test(html)) out.push(`${where}: the emitted script does not read prefers-reduced-motion.`);
  return out;
}
const EDGE_CASES = [
  // [label, scrollLeft, scrollWidth, clientWidth, rtl, expected { left, right }]
  ['everything fits', 0, 300, 300, false, { left: 0, right: 0 }],
  ['half a pixel of overflow is none', 0, 300.5, 300, false, { left: 0, right: 0 }],
  ['at the start: fade on the right only', 0, 1000, 300, false, { left: 0, right: 700 }],
  ['in the middle: both', 250, 1000, 300, false, { left: 250, right: 450 }],
  ['sub-pixel scroll rounds', 250.4, 1000, 300, false, { left: 250, right: 450 }],
  ['half a pixel from the end: no right fade', 699.5, 1000, 300, false, { left: 700, right: 0 }],
  ['at the end: fade on the left only', 700, 1000, 300, false, { left: 700, right: 0 }],
  ['elastic overscroll before the start', -20, 1000, 300, false, { left: 0, right: 700 }],
  ['right-to-left, at the start (the right edge)', 0, 1000, 300, true, { left: 700, right: 0 }],
  ['right-to-left, in the middle', -250, 1000, 300, true, { left: 450, right: 250 }],
  ['right-to-left, at the end (the left edge)', -700, 1000, 300, true, { left: 0, right: 700 }],
];
function checkEdges(html, where) {
  const out = [];
  const m = html.match(/\/\*<sb-edges>\*\/([\s\S]*?)\/\*<\/sb-edges>\*\//);
  if (!m) return [`${where}: the emitted script has no /*<sb-edges>*/ … /*</sb-edges>*/ block.`];
  let edges;
  try {
    edges = new Function(`return (${m[1]});`)();
  } catch (e) {
    return [`${where}: the emitted scrollboxEdges does not parse: ${e.message}`];
  }
  for (const [label, sl, sw, cw, rtl, want] of EDGE_CASES) {
    const got = edges(sl, sw, cw, rtl);
    if (got?.left !== want.left || got?.right !== want.right) out.push(`scrollboxEdges: ${label}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}.`);
  }
  return out;
}
function checkScrollboxCss(src) {
  const out = [];
  const css = styleOf(src);
  for (const [sel, body] of rules(css)) {
    if (/mask-image/.test(body) && !/\[data-ready\]/.test(sel)) out.push(`${SB_SRC}: "${sel}" sets a mask without [data-ready]; without JavaScript there must be no fades.`);
    if (/scrollbar-width:\s*none/.test(body) || (/::-webkit-scrollbar/.test(sel) && /display:\s*none/.test(body))) out.push(`${SB_SRC}: "${sel}" hides the scrollbar; the buttons must never be the only way to scroll.`);
    if (/scroll-behavior:\s*smooth/.test(body)) out.push(`${SB_SRC}: "${sel}" sets scroll-behavior: smooth, which would make the reduced-motion jump glide.`);
  }
  const masked = rules(css).find(([sel, body]) => /\[data-ready\]/.test(sel) && /mask-image/.test(body));
  if (!masked || !/--sb-room-left/.test(masked[1]) || !/--sb-room-right/.test(masked[1]) || !/min\(var\(--sb-fade-size/.test(masked[1])) {
    out.push(`${SB_SRC}: the mask must be sized by min(--sb-fade-size, the measured room) on each side.`);
  }
  const vp = rules(css).find(([sel]) => sel === '.sb__viewport');
  if (!vp || !/position:\s*relative/.test(vp[1])) out.push(`${SB_SRC}: .sb__viewport must be position: relative, or a positioned box in a far-off item escapes the scroller and widens the page.`);
  return out;
}

// ================================================================ sticker
const SK_SRC = 'src/library/sticker/Sticker.astro';
/** The check's own reading of the "-20%" rule, written independently of the component's. */
const offName = (t) => {
  const m = t.trim().match(/^[-−–]\s*([$£€]?\s?\d+(?:[.,]\d+)?\s*%?)$/);
  return m ? `${m[1].replace(/\s+/g, '')} off` : undefined;
};
function expectedStickers() {
  const demo = readFileSync(join(root, 'src/components/demos/StickerDemo.astro'), 'utf8');
  return [...demo.matchAll(/<Sticker\b([^>]*?)\/>/g)].map((m) => {
    const a = (n) => m[1].match(new RegExp(`\\s${n}="([^"]*)"`))?.[1];
    const t = a('text');
    const label = a('label');
    return { text: t, shape: a('shape') ?? 'label', labelled: label !== undefined, name: label === '' ? null : (label ?? offName(t) ?? t) };
  });
}
function checkSticker(html, where, { demo = false } = {}) {
  const out = [];
  const stickers = roots(html, 'span', 'data-sk');
  const want = demo ? expectedStickers() : [];
  if (demo && stickers.length !== want.length) out.push(`${where}: expected the demo's ${want.length} stickers, found ${stickers.length}.`);
  const shapes = new Set();
  stickers.forEach((s, i) => {
    const shape = s.open.match(/\bsk--(label|circle|ribbon)\b/)?.[1];
    shapes.add(shape);
    const w = `${where}, sticker ${i + 1} (${shape})`;
    if (/<(a|button|input|select|textarea)\b|\stabindex=/.test(s.html)) out.push(`${w}: holds something interactive; a sticker is decoration with a name.`);
    const sr = s.html.match(/<span class="sk__sr"[^>]*>([\s\S]*?)<\/span>/);
    const shown = s.html.match(/<span aria-hidden="true"[^>]*>([\s\S]*?)<\/span>/);
    const decorative = attr(s.open, 'aria-hidden') === 'true';
    const name = decorative ? null : sr ? text(sr[1]) : text(s.html);
    if (sr && !shown) out.push(`${w}: has a spoken label but its visible text is not aria-hidden, so both are read.`);
    if (sr && !text(sr[1])) out.push(`${w}: the spoken label is empty.`);
    const e = want[i];
    if (e) {
      if (name !== e.name) out.push(`${w}: "${e.text}" is named ${JSON.stringify(name)}, expected ${JSON.stringify(e.name)}.`);
      if (e.shape !== shape) out.push(`${w}: expected shape ${e.shape}.`);
    }
  });
  if (demo) for (const sh of ['label', 'circle', 'ribbon']) if (!shapes.has(sh)) out.push(`${where}: the demo has no ${sh} sticker.`);
  if (demo && !want.some((e) => offName(e.text) && !e.labelled)) out.push(`${where}: the demo shows no bare "-N%" sticker, so the automatic name is not pinned.`);
  return out;
}
function checkStickerCss(src) {
  const out = [];
  const ratios = [];
  const css = styleOf(src);
  for (const [sel, body] of rules(css)) {
    if (/(^|[;\s])(animation|transition)(-[a-z-]+)?\s*:/.test(body)) out.push(`${SK_SRC}: "${sel}" animates or transitions; a sticker has no motion.`);
  }
  const base = rules(css).find(([sel]) => sel === '.sk');
  if (!base || !/position:\s*absolute/.test(base[1])) out.push(`${SK_SRC}: .sk must be position: absolute (the host's parent is the positioned box).`);
  if (!base || !/pointer-events:\s*none/.test(base[1])) out.push(`${SK_SRC}: .sk must be pointer-events: none, so a tap reaches the card's link.`);
  for (const tone of ['accent', 'sale', 'dark']) {
    const m = css.match(new RegExp(`\\.sk--${tone} \\{\\s*--sk-bg: var\\(--sk-${tone}-bg, (#[0-9a-f]{3,6})\\);\\s*--sk-fg: var\\(--sk-${tone}-fg, (#[0-9a-f]{3,6})\\);`, 'i'));
    if (!m) {
      out.push(`${SK_SRC}: no \`.sk--${tone} { --sk-bg: var(--sk-${tone}-bg, #…); --sk-fg: var(--sk-${tone}-fg, #…); }\` to measure.`);
      continue;
    }
    const r = contrast(m[1], m[2]);
    ratios.push(`${tone} ${r.toFixed(2)}`);
    if (r < 4.5) out.push(`sticker tone "${tone}": ${m[2]} on ${m[1]} is ${r.toFixed(2)}:1, under 4.5:1.`);
  }
  if (!/\.sk__face \{[^}]*background: var\(--sk-bg\);\s*color: var\(--sk-fg\);/.test(css)) out.push(`${SK_SRC}: .sk__face must paint --sk-bg / --sk-fg, the measured pair.`);
  return { out, ratios };
}

// ================================================================== run
const pages = {
  tags: read('dist/tags/index.html'),
  scrollbox: read('dist/scrollbox/index.html'),
  sticker: read('dist/sticker/index.html'),
  index: read('dist/index.html'),
};
const src = { tags: read(TAGS_SRC), scrollbox: read(SB_SRC), sticker: read(SK_SRC) };
finish('files');

failures.push(...checkTags(pages.tags, 'dist/tags/index.html', { demo: true }), ...checkTags(pages.index, 'dist/index.html'));
const tagsCss = checkTagsCss(src.tags);
failures.push(...tagsCss.out);
finish('tags');

failures.push(
  ...checkScrollbox(pages.scrollbox, 'dist/scrollbox/index.html', { demo: true }),
  ...checkScrollbox(pages.index, 'dist/index.html'),
  ...checkEdges(pages.scrollbox, 'dist/scrollbox/index.html'),
  ...checkEdges(pages.index, 'dist/index.html'),
  ...checkScrollboxCss(src.scrollbox),
);
finish('scrollbox');

failures.push(...checkSticker(pages.sticker, 'dist/sticker/index.html', { demo: true }), ...checkSticker(pages.index, 'dist/index.html'));
const stickerCss = checkStickerCss(src.sticker);
failures.push(...stickerCss.out);
finish('sticker');

// ---------------------------------------------------------- mutation tests
const swap = (s, from, to) => {
  if (!s.includes(from)) throw new Error(`mutation anchor not found: ${from}`);
  return s.replace(from, to);
};
const mutants = [
  ['tags: a removal button renamed', () => checkTags(swap(pages.tags, 'aria-label="Remove ', 'aria-label="Delete '), 't', { demo: true })],
  ['tags: a removal button shipped visible', () => checkTags(pages.tags.replace(/(<button class="tg__remove"[^>]*?) hidden/, '$1'), 't', { demo: true })],
  ['tags: role="list" dropped', () => checkTags(swap(pages.tags, 'role="list"', ''), 't', { demo: true })],
  ['tags: "+N more" miscounted', () => checkTags(pages.tags.replace(/(data-tg-more[^>]*>)\s*\+(\d+) more/, (_, a, n) => `${a}+${Number(n) + 1} more`), 't', { demo: true })],
  ['tags: mount script moved away', () => checkTags(pages.tags.replace(/(<div class="tg tg--removable[\s\S]*?<\/div>)(<script>)/, '$1<p></p>$2'), 't', { demo: true })],
  ['tags: chip text on a pale background', () => checkTagsCss(swap(src.tags, 'var(--tg-bg, #eef0f4)', 'var(--tg-bg, #6b7280)')).out],
  ['scrollbox: region with no name', () => checkScrollbox(pages.scrollbox.replace(/(data-sb-viewport|role="region") aria-label="[^"]*"/, '$1'), 's', { demo: true })],
  ['scrollbox: region not focusable', () => checkScrollbox(swap(pages.scrollbox, 'tabindex="0"', 'tabindex="-1"'), 's', { demo: true })],
  ['scrollbox: a button shipped visible', () => checkScrollbox(pages.scrollbox.replace(/(<button class="sb__btn[^>]*?) hidden/, '$1'), 's', { demo: true })],
  ['scrollbox: edges ignore right-to-left', () => checkEdges(swap(pages.scrollbox, 'rtl ? max + scrollLeft : scrollLeft', 'scrollLeft'), 's')],
  ['scrollbox: edges fade for half a pixel', () => checkEdges(swap(pages.scrollbox, 'toRight < 1 ? 0', 'toRight <= 0 ? 0'), 's')],
  ['scrollbox: edges swap the sides', () => checkEdges(swap(pages.scrollbox, 'left: fromLeft < 1 ? 0 : Math.round(fromLeft)', 'left: toRight < 1 ? 0 : Math.round(toRight)'), 's')],
  ['scrollbox: smooth even under reduced motion', () => checkScrollbox(pages.scrollbox.replace(/still\.matches \? "auto" : "smooth"/, '"smooth"'), 's', { demo: true })],
  ['scrollbox: fades without JavaScript', () => checkScrollboxCss(swap(src.scrollbox, '.sb[data-ready] .sb__viewport {\n    --sb-l', '.sb .sb__viewport {\n    --sb-l'))],
  ['scrollbox: scrollbar hidden', () => checkScrollboxCss(swap(src.scrollbox, 'scrollbar-width: thin', 'scrollbar-width: none'))],
  ['scrollbox: scroller no longer contains positioned items', () => checkScrollboxCss(swap(src.scrollbox, '    position: relative;\n    display: flex;', '    display: flex;'))],
  ['sticker: the "-20%" label lost', () => checkSticker(pages.sticker.replace(/<span aria-hidden="true"[^>]*>-20%<\/span><span class="sk__sr"[^>]*>20% off<\/span>/, '-20%'), 'k', { demo: true })],
  ['sticker: a link inside', () => checkSticker(swap(pages.sticker, '>New<', '><a href="#">New</a><'), 'k', { demo: true })],
  ['sticker: a pale sale tone', () => checkStickerCss(swap(src.sticker, 'var(--sk-sale-bg, #b42318)', 'var(--sk-sale-bg, #f28b82)')).out],
  ['sticker: a transition', () => checkStickerCss(swap(src.sticker, '    pointer-events: none;', '    pointer-events: none;\n    transition: rotate 0.2s;')).out],
  ['sticker: catches clicks', () => checkStickerCss(swap(src.sticker, '    pointer-events: none;', '')).out],
];
const survived = [];
for (const [name, run] of mutants) {
  let caught;
  try {
    caught = run().length > 0;
  } catch (e) {
    fail(`mutation "${name}" could not be applied (${e.message}); update the mutant with the markup it targets.`);
    continue;
  }
  if (!caught) survived.push(name);
}
for (const s of survived) fail(`mutation "${s}" survived: the check no longer notices that breakage.`);
finish('mutation tests');

console.log(
  `check-small-pieces ok: tags (chips, remove names, "+N more"; ${tagsCss.ratios.join(', ')}), scrollbox (regions, buttons, ${EDGE_CASES.length} fade cases on the emitted script), sticker (names; ${stickerCss.ratios.join(', ')}), ${mutants.length} mutants caught.`,
);
