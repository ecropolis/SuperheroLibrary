#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the controls added in round 4
 * (menu-button). Each is read from its built demo page and from
 * the gallery index (which renders every demo on one page), i.e. exactly what a visitor without
 * JavaScript gets, plus the runtime script as the page emits it.
 *
 * menu-button
 *   No-JS: each root holds a closed <details><summary> with the label and the <ul> of items
 *   (links, or type="button" buttons), and a `hidden` <button aria-haspopup="menu"
 *   aria-expanded="false" aria-controls=<the list>>. No role or tabindex is rendered: menu
 *   roles appear only once the script can honour their keys.
 *   Script: sets role menu / menuitem / menuitemradio / none, aria-checked, aria-disabled,
 *   dispatches a cancelable `data-selected`, closes on pointerdown outside and on focusout, and
 *   returns focus to the button. The `<mb-keys>` block is RUN from the built page against the
 *   keyboard contract: ↓ ↑ wrap, Home, End, Escape, Tab, Enter, Space, type-ahead by first letter,
 *   the opening keys, and the up/down placement rule.
 * All of them
 *   The runtime is emitted once per page. Every inlined <path> in the three element files is a
 *   Font Awesome Free glyph, byte for byte. Each CSS variable has one fallback throughout its
 *   file, and the text pairs among those fallbacks clear 4.5:1 (3:1 for the radio ring).
 *
 * Mutation test: each element's checks are run again on deliberately broken copies of its page
 * (a role rendered too early, a key remapped, a second checked radio, aria-current moved…).
 * Every mutant must be caught, or the check itself is reported as failing to pin that rule.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-controls failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

// ------------------------------------------------------------------ helpers
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const decode = (s = '') =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const text = (s) => decode(s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
/** The element starting at `index` (an opening tag of `tag`), through its matching close. */
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
const tags = (html, re) => [...html.matchAll(re)].map((m) => ({ open: m[0], index: m.index }));
const scripts = (html) => [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const between = (src, name) => src.match(new RegExp(`// <${name}>[^\\n]*\\n([\\s\\S]*?)// </${name}>`))?.[1];
/** Imports a block of the page's own script as a module, exposing `names`. */
const load = async (js, names) => import(`data:text/javascript;base64,${Buffer.from(`${js}\nexport { ${names} };`).toString('base64')}`);
const textOfId = (html, id) => {
  const m = html.match(new RegExp(`<([a-z0-9]+)\\b[^>]*\\sid="${id}"[^>]*>`));
  return m ? text(block(html, m.index, m[1])) : null;
};
const read = (rel) => {
  const path = join(root, rel);
  if (!existsSync(path)) {
    failures.push(`${rel} is missing; run astro build (check-catalog.mjs does) first.`);
    return '';
  }
  return readFileSync(path, 'utf8');
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Every path Font Awesome Free ships, to hold "FA Free only".
const faRoot = join(root, 'node_modules/@fortawesome/fontawesome-free/svgs');
const faPaths = new Set();
for (const set of ['solid', 'regular', 'brands']) {
  for (const f of readdirSync(join(faRoot, set))) {
    const d = readFileSync(join(faRoot, set, f), 'utf8').match(/<path[^>]*\sd="([^"]+)"/)?.[1];
    if (d) faPaths.add(d);
  }
}
const FA_NOTE = 'Font Awesome Free';
const faSvgs = (html, where, out) => {
  for (const s of html.match(/<svg\b[\s\S]*?<\/svg>/g) ?? []) {
    if (!s.includes(FA_NOTE)) out.push(`${where}: an inline <svg> without its Font Awesome Free attribution comment.`);
    if (attr(s.slice(0, s.indexOf('>') + 1), 'aria-hidden') !== 'true') out.push(`${where}: a decorative icon <svg> is not aria-hidden.`);
    for (const m of s.matchAll(/\sd="([^"]+)"/g)) if (!faPaths.has(m[1])) out.push(`${where}: an icon path that is not a Font Awesome Free glyph.`);
  }
};

// =================================================================== menu-button
const MB_ROLES = [
  [/setAttribute\('role', 'menu'\)/, 'sets role="menu" on the list'],
  [/'menuitemradio'/, 'uses role="menuitemradio" in a radio menu'],
  [/'menuitem'/, 'uses role="menuitem"'],
  [/setAttribute\('role', 'none'\)/, 'sets role="none" on the <li>s'],
  [/'aria-checked'/, 'sets aria-checked'],
  [/'aria-disabled', 'true'/, 'turns disabled into aria-disabled'],
  [/setAttribute\('aria-expanded', 'true'\)/, 'sets aria-expanded="true" on open'],
  [/setAttribute\('aria-expanded', 'false'\)/, 'sets aria-expanded="false" on close'],
  [/new CustomEvent\('data-selected', \{ bubbles: true, cancelable: true/, 'dispatches a bubbling, cancelable data-selected'],
  [/addEventListener\('pointerdown'/, 'closes on a pointerdown outside'],
  [/addEventListener\('focusout'/, 'closes when focus leaves'],
  [/if \(returnFocus\) button\.focus\(\)/, 'returns focus to the button'],
  [/tabIndex = -1/, 'makes items tabindex="-1"'],
];
async function checkMenuButton(html, where, demo) {
  const out = [];
  const found = roots(html, 'div', 'data-mb');
  if (demo && found.length !== 3) out.push(`${where}: expected the demo's 3 menu buttons, found ${found.length}.`);
  const modes = new Set();
  let icon = 0;
  let links = 0;
  let buttons = 0;
  let disabled = 0;
  for (const r of found) {
    const id = attr(r.open, 'id');
    const at = `${where}, menu button #${id}`;
    const mode = attr(r.open, 'data-mode');
    modes.add(mode);
    if (!id) out.push(`${at}: the root has no id.`);
    if (!['actions', 'radio'].includes(mode)) out.push(`${at}: data-mode "${mode}" is not actions or radio.`);
    const btn = r.html.match(/<button\b[^>]*class="mb__button[^"]*"[^>]*>/)?.[0];
    if (!btn) {
      out.push(`${at}: no <button class="mb__button">.`);
      continue;
    }
    if (attr(btn, 'hidden') === undefined) out.push(`${at}: the menu button must be hidden until the script runs; the <details> is the no-JS control.`);
    if (attr(btn, 'type') !== 'button') out.push(`${at}: the menu button needs type="button".`);
    if (attr(btn, 'aria-haspopup') !== 'menu') out.push(`${at}: the menu button needs aria-haspopup="menu".`);
    if (attr(btn, 'aria-expanded') !== 'false') out.push(`${at}: the menu button must start aria-expanded="false".`);
    const menuId = attr(btn, 'aria-controls');
    const btnHtml = block(r.html, r.html.indexOf(btn), 'button');
    const name = attr(btn, 'aria-label') || text(btnHtml);
    if (!name) out.push(`${at}: the menu button has no accessible name.`);
    if (/\bmb--icon\b/.test(r.open)) {
      icon++;
      if (!attr(btn, 'aria-label')) out.push(`${at}: an icon-only button needs aria-label.`);
    }
    const det = r.html.match(/<details\b[^>]*>/);
    if (!det) {
      out.push(`${at}: no <details> fallback; without JavaScript the menu would be unreachable.`);
      continue;
    }
    if (attr(det[0], 'open') !== undefined) out.push(`${at}: the <details> is rendered open.`);
    const details = block(r.html, det.index, 'details');
    const summary = details.match(/<summary\b([^>]*)>([\s\S]*?)<\/summary>/);
    const sumName = summary ? attr(summary[0], 'aria-label') || text(summary[2]) : '';
    if (!summary || !sumName) out.push(`${at}: the <details> has no <summary> with the label.`);
    else if (sumName !== name) out.push(`${at}: the summary reads "${sumName}" but the button "${name}"; they are the same control.`);
    const ul = details.match(/<ul\b[^>]*>/);
    if (!ul) out.push(`${at}: the list of items is not inside the <details>.`);
    else if (attr(ul[0], 'id') !== menuId || !menuId) out.push(`${at}: aria-controls="${menuId}" does not name the list (id "${ul && attr(ul[0], 'id')}").`);
    if (/\srole="/.test(r.html)) out.push(`${at}: a role is rendered in the static HTML; menu roles promise keys only the script provides.`);
    if (/\stabindex="/.test(r.html)) out.push(`${at}: a tabindex is rendered in the static HTML.`);
    const items = tags(details, /<(a|button)\b[^>]*class="mb__item[^"]*"[^>]*>/g);
    if (!items.length) out.push(`${at}: the menu has no items.`);
    const lis = (details.match(/<li\b/g) ?? []).length;
    if (lis !== items.length) out.push(`${at}: ${lis} <li>s for ${items.length} items; one item per <li>.`);
    let checked = 0;
    for (const it of items) {
      const isLink = it.open.startsWith('<a');
      const label = text(block(details, it.index, isLink ? 'a' : 'button'));
      if (!label) out.push(`${at}: an item has no text.`);
      if (isLink) {
        links++;
        if (!attr(it.open, 'href')) out.push(`${at}: link item "${label}" has no href.`);
      } else {
        buttons++;
        if (attr(it.open, 'type') !== 'button') out.push(`${at}: button item "${label}" needs type="button" (it must never submit a form).`);
        if (attr(it.open, 'disabled') !== undefined) disabled++;
      }
      if (attr(it.open, 'data-value') === undefined) out.push(`${at}: item "${label}" has no data-value for the event.`);
      if (/mb__item--checked/.test(it.open)) checked++;
    }
    if (mode === 'radio' && checked > 1) out.push(`${at}: ${checked} items checked in a radio menu.`);
    if (mode === 'actions' && checked) out.push(`${at}: an actions menu has a checked item.`);
    faSvgs(r.html, at, out);
  }
  if (demo) {
    if (!modes.has('radio') || !modes.has('actions')) out.push(`${where}: the demo needs an actions menu and a radio menu.`);
    if (!icon) out.push(`${where}: the demo needs an icon-only menu button.`);
    if (!links || !buttons || !disabled) out.push(`${where}: the demo needs link items, button items and a disabled item.`);
  }

  const rts = scripts(html).filter((s) => /window\.__superheroMenuButton = \{/.test(s));
  if (found.length && rts.length !== 1) out.push(`${where}: the menu-button runtime is on the page ${rts.length} times; it must be emitted once.`);
  const rt = rts[0] ?? '';
  if (found.length && rt) {
    for (const [re, what] of MB_ROLES) if (!re.test(rt)) out.push(`${where}: the emitted script no longer ${what}.`);
    const keys = between(rt, 'mb-keys');
    if (!keys) out.push(`${where}: the emitted script has no // <mb-keys> … // </mb-keys> block.`);
    else {
      let k;
      try {
        ({ mbKeys: k } = await load(keys, 'mbKeys'));
      } catch (e) {
        out.push(`${where}: the <mb-keys> block does not run: ${e.message}`);
      }
      if (k) {
        const L = ['Copy link', 'Print this page', 'Email this page', 'Export', 'Delete'];
        const cases = [
          ['↓ moves down', ['ArrowDown', 0], { to: 1 }],
          ['↓ wraps from the last', ['ArrowDown', 4], { to: 0 }],
          ['↑ wraps from the first', ['ArrowUp', 0], { to: 4 }],
          ['↑ moves up', ['ArrowUp', 2], { to: 1 }],
          ['Home jumps to the first', ['Home', 3], { to: 0 }],
          ['End jumps to the last', ['End', 1], { to: 4 }],
          ['Escape closes', ['Escape', 2], { act: 'close' }],
          ['Tab closes and lets focus move', ['Tab', 2], { act: 'tab' }],
          ['Enter activates', ['Enter', 2], { act: 'activate' }],
          ['Space activates', [' ', 2], { act: 'activate' }],
          ['a letter finds the next item starting with it', ['e', 0], { to: 2 }],
          ['the same letter again moves on', ['e', 2], { to: 3 }],
          ['type-ahead wraps past the end', ['c', 3], { to: 0 }],
          ['type-ahead ignores case', ['E', 0], { to: 2 }],
          ['type-ahead matches the first letter only', ['p', 3], { to: 1 }],
          ['a letter with no match does nothing', ['z', 1], null],
          ['a modifier alone does nothing', ['Shift', 1], null],
          ['← is not a menu key', ['ArrowLeft', 1], null],
        ];
        for (const [what, [key, i], want] of cases) {
          const got = k.key(key, i, L);
          if (!eq(got, want)) out.push(`${where}: keyboard contract: ${what}: key("${key}", ${i}) gave ${JSON.stringify(got)}, expected ${JSON.stringify(want)}.`);
        }
        if (k.key('ArrowDown', 0, []) !== null) out.push(`${where}: keyboard contract: an empty menu must ignore keys.`);
        const opens = [['ArrowDown', 0], ['Enter', 0], [' ', 0], ['ArrowUp', -1], ['a', null], ['Escape', null]];
        for (const [key, want] of opens) if (k.open(key) !== want) out.push(`${where}: keyboard contract: open("${key}") gave ${k.open(key)}, expected ${want}.`);
        const places = [
          ['room below', [300, 100, 200], 'down'],
          ['short below, more above', [100, 400, 200], 'up'],
          ['short both ways, less above', [100, 50, 200], 'down'],
          ['exactly fits below', [200, 400, 200], 'down'],
        ];
        for (const [what, args, want] of places) if (k.place(...args) !== want) out.push(`${where}: placement: ${what}: place(${args}) gave "${k.place(...args)}", expected "${want}".`);
      }
    }
  }
  return out;
}

// =================================================================== run on the pages
const checks = {
  'menu-button': checkMenuButton,
};
// A check runs when its element is in the catalogue (ids read as text, as check-four does).
const inCatalog = new Set([...readFileSync(join(root, 'src/data/catalog.ts'), 'utf8').matchAll(/^\s{4}id: '([a-z0-9-]+)'/gm)].map((m) => m[1]));
for (const id of Object.keys(checks)) if (!inCatalog.has(id)) delete checks[id];
const pages = {};
for (const id of Object.keys(checks)) {
  pages[id] = read(`dist/${id}/index.html`);
  if (pages[id]) failures.push(...(await checks[id](pages[id], `dist/${id}/index.html`, true)));
}
const home = read('dist/index.html');
if (home) for (const id of Object.keys(checks)) failures.push(...(await checks[id](home, 'dist/index.html', false)));
finish('built pages');

// =================================================================== source: FA Free, fallbacks, contrast
const files = {
  'menu-button': 'src/library/menu-button/MenuButton.astro',
};
const fallbacks = {};
for (const [id, rel] of Object.entries(files)) {
  if (!checks[id]) continue;
  const src = readFileSync(join(root, rel), 'utf8');
  // Any quoted SVG path string in the file, whether in a d="…" or passed to a helper.
  for (const m of src.matchAll(/['"](M-?[\d.]+[ ,-]?[\d.][^'"]{30,})['"]/g)) {
    if (!faPaths.has(m[1])) failures.push(`${rel}: an inlined icon path is not a Font Awesome Free glyph (FA Free only).`);
  }
  if (/<svg\b/.test(src) && !src.includes(FA_NOTE)) failures.push(`${rel}: inlined icons without the Font Awesome Free attribution comment.`);
  const seen = {};
  for (const m of src.matchAll(/var\((--[a-z]{2}-[a-z-]+), (#[0-9a-f]{3,6}|[0-9.]+rem|[0-9]+px)\)/gi)) {
    const [, v, f] = m;
    if (seen[v] && seen[v] !== f.toLowerCase()) failures.push(`${rel}: ${v} falls back to ${seen[v]} in one place and ${f} in another.`);
    seen[v] = f.toLowerCase();
  }
  fallbacks[id] = seen;
}
const lum = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const pairs = [
  // [element, foreground var, background var or literal, minimum]
  ['menu-button', '--mb-fg', '--mb-bg', 4.5],
  ['menu-button', '--mb-menu-fg', '--mb-menu-bg', 4.5],
  ['menu-button', '--mb-menu-fg', '--mb-hover', 4.5],
];
const measured = [];
for (const [id, fg, bg, min] of pairs) {
  if (!checks[id]) continue;
  const f = fallbacks[id][fg];
  const b = bg.startsWith('#') ? bg : fallbacks[id][bg];
  if (!f || !b) {
    failures.push(`${files[id]}: no hex fallback found for ${!f ? fg : bg} to measure.`);
    continue;
  }
  const r = ratio(f, b);
  measured.push(`${fg} ${r.toFixed(2)}`);
  if (r < min) failures.push(`${files[id]}: ${fg} (${f}) on ${bg} (${b}) is ${r.toFixed(2)}:1, under ${min}:1.`);
}
finish('sources');

// =================================================================== mutation test
// Each mutant breaks one promise; the element's check must report it.
const swap = (from, to) => (html) => {
  if (!html.includes(from)) throw new Error(`the mutation target ${JSON.stringify(from.slice(0, 60))} is not on the page`);
  return html.replace(from, to);
};
const swapRe = (re, to) => (html) => {
  if (!re.test(html)) throw new Error(`the mutation target ${re} is not on the page`);
  return html.replace(re, to);
};
const mutants = {
  'menu-button': [
    ['a menu role rendered before the script', swapRe(/<ul class="mb__list"/, '<ul role="menu" class="mb__list"')],
    ['the menu button shown without JavaScript', swapRe(/(<button class="mb__button"[^>]*?) hidden/, '$1')],
    ['↓ remapped to →', swap("if (key === 'ArrowDown') return { to: (i + 1) % n };", "if (key === 'ArrowRight') return { to: (i + 1) % n };")],
    ['↑ no longer wrapping', swap('return { to: (i - 1 + n) % n }', 'return { to: Math.max(0, i - 1) }')],
    ['type-ahead matching anywhere in the label', swap('.startsWith(c)', '.includes(c)')],
    ['Escape no longer closing', swap("if (key === 'Escape') return { act: 'close' };", '')],
    ['menuitemradio dropped', swap("radio ? 'menuitemradio' : 'menuitem'", "'menuitem'")],
    ['focus not returned on close', swap('if (returnFocus) button.focus();', '')],
    ['placement flipping up with room below', swap('return below < height && above > below', 'return above > below')],
    ['the runtime emitted twice', swapRe(/(<script>\s*\(\(\) => \{\s*if \(window\.__superheroMenuButton\)[\s\S]*?<\/script>)/, '$1$1')],
  ],
};
let caught = 0;
for (const [id, list] of Object.entries(mutants)) {
  if (!checks[id]) continue;
  for (const [what, mutate] of list) {
    let broken;
    try {
      broken = mutate(pages[id]);
    } catch (e) {
      failures.push(`mutation test, ${id}: "${what}": ${e.message}; update the mutant with the element.`);
      continue;
    }
    const found = await checks[id](broken, `mutant (${what})`, true);
    if (!found.length) failures.push(`mutation test, ${id}: "${what}" was not caught; check-controls no longer pins that rule.`);
    else caught++;
  }
}
finish('mutation test');

const total = Object.entries(mutants).reduce((a, [id, l]) => a + (checks[id] ? l.length : 0), 0);
console.log(`check-controls ok: ${Object.keys(checks).join(', ')} on 2 pages; FA Free paths, fallbacks and contrast (${measured.join(', ')}); ${caught}/${total} mutants caught.`);
