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

// ================================================================== run
const pages = {
  tags: read('dist/tags/index.html'),
  index: read('dist/index.html'),
};
const src = { tags: read(TAGS_SRC) };
finish('files');

failures.push(...checkTags(pages.tags, 'dist/tags/index.html', { demo: true }), ...checkTags(pages.index, 'dist/index.html'));
const tagsCss = checkTagsCss(src.tags);
failures.push(...tagsCss.out);
finish('tags');

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
  `check-small-pieces ok: tags (chips, remove names, "+N more"; ${tagsCss.ratios.join(', ')}), ${mutants.length} mutants caught.`,
);
