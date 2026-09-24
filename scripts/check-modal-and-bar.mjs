#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the modal and
 * announcement-bar elements, on the built demo pages (what a visitor without JavaScript gets).
 *
 * modal
 * 1. Every <dialog data-md> is closed (no `open` attribute), has an id, and is named by
 *    aria-labelledby pointing at an element on the page that holds text.
 * 2. Each has a close <button type="button"> with an aria-label.
 * 3. Automatic opens are absent from the no-JS render: the delay / scroll / exit settings live
 *    only in the data-md JSON the script reads, never as markup that could act without it (no
 *    `open`, no <noscript> popup, no meta refresh, no inline on* handler in the element).
 * 4. The runtime is emitted once per page even with four modals on it.
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
  console.error(`check-modal-and-bar failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const decode = (s) => s?.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const read = (rel) => {
  const path = join(root, rel);
  if (!existsSync(path)) {
    fail(`${rel} is missing; run astro build (check-catalog.mjs does).`);
    return '';
  }
  return readFileSync(path, 'utf8');
};

// ------------------------------------------------------------------ modal
for (const rel of ['dist/modal/index.html', 'dist/index.html']) {
  const html = read(rel);
  if (!html) continue;
  const dialogs = [...html.matchAll(/<dialog\b[^>]*\sdata-md=[^>]*>/g)];
  if (rel === 'dist/modal/index.html' && dialogs.length !== 4) fail(`${rel}: expected the demo's 4 modals, found ${dialogs.length}.`);
  dialogs.forEach((d, i) => {
    const tag = d[0];
    const id = attr(tag, 'id');
    const where = `${rel}, modal ${i + 1} (#${id})`;
    if (!id) fail(`${where}: the <dialog> has no id, so nothing can open it.`);
    if (attr(tag, 'open') !== undefined) fail(`${where}: the <dialog> is rendered open; it must be closed without JavaScript.`);
    if (/\son[a-z]+=/i.test(tag)) fail(`${where}: inline event handler on the <dialog>.`);
    const labelledby = attr(tag, 'aria-labelledby');
    if (!labelledby) fail(`${where}: no aria-labelledby; the title must name the dialog.`);
    else {
      const t = html.match(new RegExp(`<([a-z0-9]+)\\b[^>]*\\sid="${labelledby}"[^>]*>([\\s\\S]*?)</\\1>`));
      if (!t || !t[2].replace(/<[^>]+>/g, '').trim()) fail(`${where}: aria-labelledby="${labelledby}" points at no element with text.`);
    }
    let cfg = null;
    try {
      cfg = JSON.parse(decode(attr(tag, 'data-md')));
    } catch {
      fail(`${where}: data-md is not JSON.`);
    }
    if (cfg && !['session', 'visitor', 'never'].includes(cfg.once)) fail(`${where}: once "${cfg.once}" is not session, visitor or never.`);
    if (cfg && !(cfg.dwell >= 0)) fail(`${where}: no minDwell in the config.`);
    const end = html.indexOf('</dialog>', d.index);
    const body = html.slice(d.index, end);
    const close = body.match(/<button\b[^>]*\sdata-md-close[^>]*>/);
    if (!close) fail(`${where}: no close button.`);
    else {
      if (attr(close[0], 'type') !== 'button') fail(`${where}: the close button needs type="button".`);
      if (!attr(close[0], 'aria-label')) fail(`${where}: the close button has no aria-label.`);
    }
    if (/<noscript\b/i.test(body)) fail(`${where}: a <noscript> inside the dialog would show without JavaScript.`);
  });
  if (rel === 'dist/modal/index.html') {
    const autos = dialogs.map((d) => JSON.parse(decode(attr(d[0], 'data-md')))).filter((c) => c.delay !== null || c.scroll !== null || c.exit);
    if (autos.length !== 2) fail(`${rel}: expected 2 automatic modals in the demo (delay+scroll, exit), found ${autos.length}.`);
  }
  if (/<meta\b[^>]*http-equiv="refresh"/i.test(html)) fail(`${rel}: a meta refresh.`);
  const runtimes = (html.match(/window\.__superheroModal\s*=/g) || []).length;
  if (dialogs.length && runtimes !== 1) fail(`${rel}: the modal runtime is on the page ${runtimes} times; it must be emitted once.`);
}
finish('modal');

console.log('check-modal-and-bar: ok');
