#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the three controls added in
 * round 4: menu-button, radio-group and stepper. Each is read from its built demo page and from
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
 * radio-group
 *   Real radios in a <fieldset> with a <legend>, one name per group, unique ids and values, at
 *   most one checked (and not a disabled one), every radio named by a label and every
 *   aria-labelledby / aria-describedby pointing at text. No role and no tabindex (the keyboard is
 *   native). The demo form's successful controls are computed as a browser would post them.
 *   Chunky icons are Font Awesome Free. The script dispatches a bubbling `data-changed`.
 * stepper
 *   An <ol>, named (by the <nav> when a step links, by the list otherwise); each step's state
 *   equals the emitted script's `<st-states>` rule for `data-current`; aria-current="step" on
 *   exactly the current step (none when all are done); done steps say "Completed:" and show the
 *   check, and link exactly when they have an href; current and upcoming steps never link.
 * All three
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

// =================================================================== radio-group
async function checkRadioGroup(html, where, demo) {
  const out = [];
  const found = roots(html, 'fieldset', 'data-rg');
  const styles = new Set();
  const ids = new Set();
  for (const r of found) {
    const name = attr(r.open, 'data-name');
    const at = `${where}, radio group "${name}"`;
    const style = r.open.match(/\brg--(default|chunky|segmented)\b/)?.[1];
    styles.add(style);
    if (!style) out.push(`${at}: no rg--default / rg--chunky / rg--segmented class.`);
    if (!name) out.push(`${at}: the fieldset has no data-name.`);
    const legend = r.html.match(/^<fieldset\b[^>]*>\s*<legend\b[^>]*>([\s\S]*?)<\/legend>/);
    if (!legend || !text(legend[1])) out.push(`${at}: the fieldset's first child must be a <legend> with the question.`);
    const described = attr(r.open, 'aria-describedby');
    if (described && !textOfId(html, described)) out.push(`${at}: aria-describedby="${described}" points at no text.`);
    if (/\srole="/.test(r.html)) out.push(`${at}: a role is rendered; real radios in a fieldset need none.`);
    const inputs = tags(r.html, /<input\b[^>]*>/g).map((t) => t.open);
    if (inputs.length < 2) out.push(`${at}: fewer than two inputs.`);
    const values = new Set();
    const checked = [];
    for (const i of inputs) {
      const id = attr(i, 'id');
      const v = attr(i, 'value');
      if (attr(i, 'type') !== 'radio') out.push(`${at}: an input is type="${attr(i, 'type')}", not a radio.`);
      if (attr(i, 'name') !== name) out.push(`${at}: input #${id} has name "${attr(i, 'name')}"; every radio in the group posts as "${name}".`);
      if (!v) out.push(`${at}: input #${id} has no value.`);
      if (values.has(v)) out.push(`${at}: value "${v}" appears twice.`);
      values.add(v);
      if (!id) out.push(`${at}: an input has no id.`);
      else if (ids.has(id)) out.push(`${at}: id "${id}" is used twice on the page.`);
      ids.add(id);
      if (attr(i, 'tabindex') !== undefined) out.push(`${at}: input #${id} has a tabindex; the browser's own radio keyboard needs none.`);
      if (attr(i, 'hidden') !== undefined || /display:\s*none/.test(attr(i, 'style') ?? '')) out.push(`${at}: input #${id} is hidden; it must stay the focusable control.`);
      if (attr(i, 'checked') !== undefined) {
        checked.push(v);
        if (attr(i, 'disabled') !== undefined) out.push(`${at}: the checked radio "${v}" is disabled.`);
      }
      const label = r.html.match(new RegExp(`<label\\b[^>]*\\sfor="${id}"[^>]*>`));
      if (!label) out.push(`${at}: input #${id} has no <label for>.`);
      const by = attr(i, 'aria-labelledby');
      const name1 = by ? textOfId(html, by) : label && text(block(r.html, label.index, 'label'));
      if (!name1) out.push(`${at}: input #${id} has no accessible name.`);
      const desc = attr(i, 'aria-describedby');
      if (desc && !textOfId(html, desc)) out.push(`${at}: input #${id} aria-describedby="${desc}" points at no text.`);
    }
    if (checked.length > 1) out.push(`${at}: ${checked.length} radios checked.`);
    const dv = attr(r.open, 'data-value');
    if ((dv ?? null) !== (checked[0] ?? null)) out.push(`${at}: data-value "${dv}" is not the checked value "${checked[0]}".`);
    if (style === 'chunky') {
      const icons = r.html.match(/<span class="rg__icon[^"]*"[^>]*>[\s\S]*?<\/span>/g) ?? [];
      if (demo && !icons.length) out.push(`${at}: the chunky demo shows no icons.`);
      faSvgs(icons.join(''), at, out);
    }
  }
  if (demo) {
    for (const s of ['default', 'chunky', 'segmented']) if (!styles.has(s)) out.push(`${where}: the demo has no ${s} radio group.`);
    // A plain form post: what the browser would send from the demo form as rendered.
    const form = html.match(/<form\b[^>]*data-demo-rg[^>]*>/);
    if (!form) out.push(`${where}: the demo's radio groups are not in a <form>.`);
    else {
      const f = block(html, form.index, 'form');
      if (!/<button\b[^>]*type="submit"/.test(f)) out.push(`${where}: the demo form has no submit button.`);
      if (/<fieldset\b[^>]*\sdisabled[\s>=]/.test(f)) out.push(`${where}: a disabled fieldset posts nothing.`);
      const sent = tags(f, /<input\b[^>]*>/g)
        .map((t) => t.open)
        .filter((i) => attr(i, 'checked') !== undefined && attr(i, 'disabled') === undefined && attr(i, 'name') && attr(i, 'form') === undefined)
        .map((i) => `${attr(i, 'name')}=${attr(i, 'value')}`);
      const want = ['delivery=pickup', 'billing=monthly'];
      if (!eq(sent, want)) out.push(`${where}: the demo form would post ${JSON.stringify(sent)}, expected ${JSON.stringify(want)}.`);
      const contact = tags(f, /<input\b[^>]*\sname="contact"[^>]*>/g).map((t) => t.open);
      if (!contact.length || contact.some((i) => attr(i, 'required') === undefined)) out.push(`${where}: every "contact" radio must carry required, so the browser holds the form until one is chosen.`);
    }
  }
  const rts = scripts(html).filter((s) => /window\.__superheroRadioGroup = true/.test(s));
  if (found.length && rts.length !== 1) out.push(`${where}: the radio-group runtime is on the page ${rts.length} times; it must be emitted once.`);
  if (rts[0] && !/new CustomEvent\('data-changed', \{ bubbles: true, detail: \{ name: input\.name, value: input\.value, label \} \}\)/.test(rts[0]))
    out.push(`${where}: the emitted script no longer dispatches a bubbling data-changed with { name, value, label }.`);
  return out;
}

// =================================================================== stepper
async function checkStepper(html, where, demo) {
  const out = [];
  const rts = scripts(html).filter((s) => /window\.__superheroStepper = \{ go \}/.test(s));
  const found = [...roots(html, 'nav', 'data-st'), ...roots(html, 'div', 'data-st')].sort((a, b) => a.index - b.index);
  if (found.length && rts.length !== 1) out.push(`${where}: the stepper runtime is on the page ${rts.length} times; it must be emitted once.`);
  let states = null;
  const rule = rts[0] && between(rts[0], 'st-states');
  if (found.length && !rule) out.push(`${where}: the emitted script has no // <st-states> block.`);
  else if (rule) {
    try {
      ({ stStates: states } = await load(rule, 'stStates'));
    } catch (e) {
      out.push(`${where}: the <st-states> block does not run: ${e.message}`);
    }
  }
  if (states) {
    const golden = [
      [1, 4, ['current', 'upcoming', 'upcoming', 'upcoming']],
      [2, 4, ['done', 'current', 'upcoming', 'upcoming']],
      [4, 4, ['done', 'done', 'done', 'current']],
      [5, 4, ['done', 'done', 'done', 'done']],
    ];
    for (const [n, c, want] of golden) if (!eq(states(n, c), want)) out.push(`${where}: stStates(${n}, ${c}) gave ${JSON.stringify(states(n, c))}, expected ${JSON.stringify(want)}.`);
  }
  const rt = rts[0] ?? '';
  for (const [re, what] of [
    [/Math\.min\(Math\.max\(1, Math\.round\(n\)\), steps\.length \+ 1\)/, 'clamps go(id, n) to 1 … steps + 1'],
    [/setAttribute\('aria-current', 'step'\)/, 'sets aria-current="step" on the new current step'],
    [/removeAttribute\('aria-current'\)/, 'removes aria-current from the others'],
    [/'Completed: '/, 'writes "Completed: " for done steps'],
  ])
    if (found.length && rt && !re.test(rt)) out.push(`${where}: the emitted script no longer ${what}.`);

  const orient = new Set();
  for (const r of found) {
    const id = attr(r.open, 'id');
    const at = `${where}, stepper #${id}`;
    orient.add(r.open.match(/\bst--(auto|vertical)\b/)?.[1]);
    const isNav = r.open.startsWith('<nav');
    const ol = r.html.match(/<ol\b[^>]*>/);
    if (!ol) {
      out.push(`${at}: the steps are not an <ol>.`);
      continue;
    }
    const name = isNav ? attr(r.open, 'aria-label') : attr(ol[0], 'aria-label');
    if (!name) out.push(`${at}: no accessible name (aria-label on the ${isNav ? '<nav>' : '<ol>'}).`);
    const lis = tags(r.html, /<li\b[^>]*>/g).map((t) => ({ ...t, html: block(r.html, t.index, 'li') }));
    const current = Number(attr(r.open, 'data-current'));
    const got = lis.map((l) => l.open.match(/\bst__step--(done|current|upcoming)\b/)?.[1]);
    if (states) {
      const want = states(current, lis.length);
      if (!eq(got, want)) out.push(`${at}: rendered states ${JSON.stringify(got)} for data-current=${current}, but the script's rule gives ${JSON.stringify(want)}.`);
    }
    const marked = lis.filter((l) => attr(l.open, 'aria-current') !== undefined);
    const wantMarked = current <= lis.length ? 1 : 0;
    if (marked.length !== wantMarked) out.push(`${at}: ${marked.length} steps carry aria-current; expected ${wantMarked}.`);
    for (const l of marked) {
      if (attr(l.open, 'aria-current') !== 'step') out.push(`${at}: aria-current="${attr(l.open, 'aria-current')}"; a step is aria-current="step".`);
      if (!/st__step--current/.test(l.open)) out.push(`${at}: aria-current is on a step that is not the current one.`);
    }
    const anyHref = lis.some((l) => attr(l.open, 'data-href'));
    if (anyHref !== isNav) out.push(`${at}: ${isNav ? 'a <nav> with no step that links' : 'steps link but the root is not a <nav>'}.`);
    lis.forEach((l, i) => {
      const s = got[i];
      const sr = text(l.html.match(/<span class="st__sr[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '');
      const link = l.html.match(/<a\b[^>]*>/);
      const href = attr(l.open, 'data-href');
      const label = text(l.html.match(/<span class="st__label[^"]*"[^>]*>([\s\S]*?)<\/span>\s*(?:<span class="st__text|<\/span>)/)?.[1] ?? '');
      if (!label) out.push(`${at}: step ${i + 1} has no label.`);
      if (!/<span class="st__marker[^"]*" aria-hidden="true"/.test(l.html)) out.push(`${at}: step ${i + 1}'s marker is not aria-hidden (the list already numbers it).`);
      if (s === 'done') {
        if (sr !== 'Completed:') out.push(`${at}: done step ${i + 1} does not say "Completed:" to screen readers.`);
        if (!/class="st__check"/.test(l.html)) out.push(`${at}: done step ${i + 1} has no check.`);
        if (href && (!link || attr(link[0], 'href') !== href)) out.push(`${at}: done step ${i + 1} has an href but is not a link to it.`);
        if (!href && link) out.push(`${at}: done step ${i + 1} links without an href.`);
      } else {
        if (link) out.push(`${at}: ${s} step ${i + 1} is a link; only done steps link.`);
        if (sr) out.push(`${at}: ${s} step ${i + 1} says "${sr}".`);
      }
    });
    faSvgs(r.html, at, out);
  }
  if (demo) {
    if (found.length !== 2) out.push(`${where}: expected the demo's 2 steppers, found ${found.length}.`);
    if (!orient.has('auto') || !orient.has('vertical')) out.push(`${where}: the demo needs an auto and a vertical stepper.`);
    if (!found.some((r) => /\sid="demo-st-checkout"/.test(r.open))) out.push(`${where}: the demo's go() target #demo-st-checkout is missing.`);
  }
  return out;
}

// =================================================================== run on the pages
const checks = {
  'menu-button': checkMenuButton,
  'radio-group': checkRadioGroup,
  stepper: checkStepper,
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
  'radio-group': 'src/library/radio-group/RadioGroup.astro',
  stepper: 'src/library/stepper/Stepper.astro',
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
  ['radio-group', '--rg-accent-fg', '--rg-accent', 4.5],
  ['radio-group', '--rg-muted', '--rg-bg', 4.5],
  ['radio-group', '--rg-muted', '--rg-bg-checked', 4.5],
  ['radio-group', '--rg-border', '--rg-bg', 3],
  ['radio-group', '--rg-accent', '--rg-bg', 3],
  ['stepper', '--st-accent-fg', '--st-accent', 4.5],
  ['stepper', '--st-upcoming', '--st-bg', 4.5],
  ['stepper', '--st-muted', '#fff', 4.5],
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
  'radio-group': [
    ['a radio posting under another name', swapRe(/(<input class="rg__input" type="radio" id="[^"]+" name=")billing"/, '$1billing2"')],
    ['a second checked radio', swapRe(/(value="delivery")/, '$1 checked')],
    ['a checkbox in the group', swapRe(/type="radio"/, 'type="checkbox"')],
    ['a radio without its label', swapRe(/<label class="rg__option" for="[^"]+"/, '<label class="rg__option"')],
    ['a tabindex on a radio', swapRe(/type="radio"/, 'type="radio" tabindex="0"')],
    ['required dropped from the contact group', swapRe(/(name="contact" value="email") required/, '$1')],
    ['the legend missing', swapRe(/<legend class="rg__legend"[^>]*>[\s\S]*?<\/legend>/, '')],
    ['data-changed no longer dispatched', swap("new CustomEvent('data-changed'", "new CustomEvent('changed'")],
  ],
  stepper: [
    ['aria-current removed', swapRe(/ aria-current="step"/, '')],
    ['aria-current="page" for a step', swapRe(/aria-current="step"/, 'aria-current="page"')],
    ['aria-current on an upcoming step too', swapRe(/(<li class="st__step st__step--upcoming"[^>]*?)>/, '$1 aria-current="step">')],
    ['the state rule shifted by one', swap("(i + 1 < n ? 'done'", "(i + 1 <= n ? 'done'")],
    ['a link on the current step', swapRe(/(<li class="st__step st__step--current"[^>]*>\s*)<span class="st__link"([^>]*)>/, '$1<a class="st__link" href="#x"$2>')],
    ['"Completed:" dropped from a done step', swapRe(/Completed: /, '')],
    ['go() clamp removed', swap('Math.min(Math.max(1, Math.round(n)), steps.length + 1)', 'n')],
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
