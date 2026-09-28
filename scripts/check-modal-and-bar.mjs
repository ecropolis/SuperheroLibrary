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
 * 4b. The demo's `quiet` prop. The gallery index renders every demo with `quiet`; the element's
 *    own page renders it without. With `quiet`, no data-md config carries a delay, a scroll or
 *    exit, the offer and exit modals each have an opener button ("Open it", "Show the exit
 *    modal") and keep their memory under a key of their own. Without it, the two automatic
 *    configs are exactly as before and the "Forget it" buttons are there. Two planted faults
 *    (the loud page passed off as quiet, a quiet page missing an opener) must be caught.
 *
 * announcement-bar
 * 5. The date logic: the source between the `<anb-time>` markers, types stripped by Node, run
 *    against golden cases (from/until as whole days in the business zone, `until` inclusive,
 *    DST edges, explicit offsets, the countdown's wording).
 * 6. On the built demo page: each bar is role="region" with a name, the dismiss button exists
 *    (type="button", "Dismiss announcement", hidden until the script runs), the countdown is a
 *    <time> whose `datetime` parses and which is not inside a live region, and the script that
 *    settles the bar comes straight after it (that is what keeps it from shifting the layout).
 * 7. The three themes' fallback colours, read from the component's CSS, pass 4.5:1.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
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

// ------------------------------------------------------------- 4b. modal, quiet
const QUIET_OPENERS = [
  ['demo-modal-offer', 'Open it'],
  ['demo-modal-exit', 'Show the exit modal'],
];
const LOUD = {
  'demo-modal-offer': { delay: 20000, scroll: 50, exit: false, once: 'session', key: 'modal:demo-modal-offer', version: 'demo-1' },
  'demo-modal-exit': { delay: null, scroll: null, exit: true, once: 'session', key: 'modal:demo-modal-exit', version: 'demo-1' },
};
const modalConfigs = (html) =>
  [...html.matchAll(/<dialog\b[^>]*\sdata-md=[^>]*>/g)].map((d) => ({ id: attr(d[0], 'id'), cfg: JSON.parse(decode(attr(d[0], 'data-md'))) }));
const openers = (html, id) =>
  [...html.matchAll(new RegExp(`<button\\b[^>]*\\sdata-modal-open="${id}"[^>]*>([\\s\\S]*?)</button>`, 'g'))].map((m) => ({
    tag: m[0].slice(0, m[0].indexOf('>') + 1),
    text: m[1].replace(/<[^>]+>/g, '').trim(),
  }));
/** Every way `html` fails to be the modal demo rendered with (quiet) or without (!quiet) `quiet`. */
const quietProblems = (html, quiet) => {
  const out = [];
  const cfgs = modalConfigs(html);
  if (cfgs.length !== 4) out.push(`expected the demo's 4 modals, found ${cfgs.length}`);
  if (quiet) {
    for (const { id, cfg } of cfgs) {
      if (cfg.delay !== null || cfg.scroll !== null || cfg.exit) out.push(`#${id} opens by itself (delay ${cfg.delay}, scroll ${cfg.scroll}, exit ${cfg.exit})`);
    }
    for (const [id, text] of QUIET_OPENERS) {
      const b = openers(html, id);
      if (b.length !== 1) out.push(`#${id}: expected one opener button, found ${b.length}`);
      else {
        if (b[0].text !== text) out.push(`#${id}: the opener reads "${b[0].text}", expected "${text}"`);
        if (attr(b[0].tag, 'type') !== 'button') out.push(`#${id}: the opener needs type="button"`);
      }
      const c = cfgs.find((x) => x.id === id);
      if (c && c.cfg.key === LOUD[id].key) out.push(`#${id}: shares its memory key with the element page, so a press here would stop it opening there`);
    }
    if (/data-demo-md-forget=/.test(html)) out.push('a "Forget it, arm it again" button, with nothing armed to forget');
  } else {
    for (const [id, want] of Object.entries(LOUD)) {
      const c = cfgs.find((x) => x.id === id);
      if (!c) {
        out.push(`#${id} is missing`);
        continue;
      }
      for (const [k, v] of Object.entries(want)) if (c.cfg[k] !== v) out.push(`#${id}: ${k} is ${JSON.stringify(c.cfg[k])}, expected ${JSON.stringify(v)}`);
      if (!html.includes(`data-demo-md-forget="${id}"`)) out.push(`#${id}: no "Forget it" button`);
      if (openers(html, id).length) out.push(`#${id}: has an opener button; without quiet it opens by itself`);
    }
  }
  return out;
};
const quietPage = read('dist/index.html');
const loudPage = read('dist/modal/index.html');
if (quietPage && loudPage) {
  for (const p of quietProblems(quietPage, true)) fail(`dist/index.html (ModalDemo with quiet): ${p}.`);
  for (const p of quietProblems(loudPage, false)) fail(`dist/modal/index.html (ModalDemo without quiet): ${p}.`);
  const planted = [
    ['the element page passed off as quiet', loudPage, true],
    ['a quiet page without the exit opener', quietPage.replace(/<button\b[^>]*data-modal-open="demo-modal-exit"[^>]*>[\s\S]*?<\/button>/, ''), true],
  ];
  for (const [label, html, quiet] of planted) if (!quietProblems(html, quiet).length) fail(`the quiet pin missed a planted fault: ${label}.`);
}
finish('modal quiet');

// ------------------------------------------------------------- 5. bar date logic
const barFile = 'src/library/announcement-bar/AnnouncementBar.astro';
const barSrc = readFileSync(join(root, barFile), 'utf8');
const block = barSrc.match(/\/\/ <anb-time>\n([\s\S]*?)\/\/ <\/anb-time>/);
if (!block) {
  fail(`${barFile} has no \`// <anb-time>\` … \`// </anb-time>\` block.`);
  finish('announcement-bar time');
}
const js = stripTypeScriptTypes(block[1], { mode: 'strip' });
const { announcementTime } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const t = announcementTime();
const at = (iso) => Date.parse(iso);
const CHI = 'America/Chicago';
const inWin = [
  // [label, instant, window, expected]
  ['until a date includes its last evening (Chicago 23:59)', at('2026-12-25T05:59:00Z'), { tz: CHI, until: '2026-12-24' }, true],
  ['until a date ends at the next midnight there', at('2026-12-25T06:00:00Z'), { tz: CHI, until: '2026-12-24' }, false],
  ['from a date starts at its midnight there, not UTC', at('2026-12-20T05:59:00Z'), { tz: CHI, from: '2026-12-20' }, false],
  ['from a date: one minute later it shows', at('2026-12-20T06:00:00Z'), { tz: CHI, from: '2026-12-20' }, true],
  ['from/until with times', at('2026-07-04T14:30:00Z'), { tz: CHI, from: '2026-07-04T09:00', until: '2026-07-04T17:00' }, true],
  ['until a time is exclusive', at('2026-07-04T22:00:00Z'), { tz: CHI, until: '2026-07-04T17:00' }, false],
  ['explicit offset is absolute', at('2026-07-04T12:00:00Z'), { tz: CHI, until: '2026-07-04T12:00Z' }, false],
  ['countdown passed hides it', at('2026-11-30T23:59:00Z'), { tz: 'UTC', countdown: '2026-11-30T23:59' }, false],
  ['countdown ahead shows it', at('2026-11-30T23:58:00Z'), { tz: 'UTC', countdown: '2026-11-30T23:59' }, true],
  ['no window: always', at('2030-01-01T00:00:00Z'), { tz: 'UTC' }, true],
];
for (const [label, ms, w, want] of inWin) if (t.inWindow(ms, w) !== want) fail(`inWindow: ${label}: got ${!want}.`);
const instants = [
  ['New York wall 17:00 in October (EDT)', t.instant('2026-10-01T17:00', 'America/New_York'), at('2026-10-01T21:00:00Z')],
  ['New York wall 17:00 in December (EST)', t.instant('2026-12-01T17:00', 'America/New_York'), at('2026-12-01T22:00:00Z')],
  ['spring-forward gap resolves to the jump (02:30 does not exist)', t.instant('2026-03-08T02:30', 'America/New_York'), at('2026-03-08T07:30:00Z')],
  ['Kolkata half-hour offset', t.instant('2026-01-15T09:00', 'Asia/Kolkata'), at('2026-01-15T03:30:00Z')],
  ['date is its local midnight', t.instant('2026-06-01', 'Europe/London'), at('2026-05-31T23:00:00Z')],
];
for (const [label, got, want] of instants) if (got !== want) fail(`instant: ${label}: ${new Date(got).toISOString()}, expected ${new Date(want).toISOString()}.`);
const H = 3600e3;
const D = 24 * H;
const lefts = [
  [2 * D + 4 * H + 30 * 60e3, '2 days 4 hours'],
  [1 * D, '1 day'],
  [1 * D + 1 * H, '1 day 1 hour'],
  [3 * H + 12 * 60e3, '3 hours 12 minutes'],
  [1 * H, '1 hour'],
  [40 * 60e3 + 59e3, '40 minutes'],
  [60e3, '1 minute'],
  [59e3, 'less than a minute'],
];
for (const [ms, want] of lefts) if (t.left(0, ms) !== want) fail(`left(${ms} ms) = "${t.left(0, ms)}", expected "${want}".`);
for (const bad of ['2026-1-1', 'tomorrow', '2026-01-01 17:00', '']) if (t.valid(bad)) fail(`valid("${bad}") should be false.`);
finish('announcement-bar time');

// --------------------------------------------------------- 6. bar, built page
for (const rel of ['dist/announcement-bar/index.html', 'dist/index.html']) {
  const html = read(rel);
  if (!html) continue;
  const bars = [...html.matchAll(/<div\b[^>]*\sdata-anb=[^>]*>/g)];
  if (rel === 'dist/announcement-bar/index.html' && bars.length !== 3) fail(`${rel}: expected the demo's 3 bars, found ${bars.length}.`);
  let countdowns = 0;
  bars.forEach((b, i) => {
    const tag = b[0];
    const where = `${rel}, bar ${i + 1}`;
    if (attr(tag, 'role') !== 'region') fail(`${where}: not role="region".`);
    const by = attr(tag, 'aria-labelledby');
    if (!attr(tag, 'aria-label') && !(by && html.includes(`id="${by}"`))) fail(`${where}: the region has no accessible name.`);
    // The bar's own markup ends where the script that settles it begins.
    const scriptAt = html.indexOf('<script', b.index);
    const body = html.slice(b.index, scriptAt);
    const after = html.slice(scriptAt, html.indexOf('</script>', scriptAt));
    if (!/<\/div>\s*$/.test(body) || !after.includes('.mount(document.currentScript.previousElementSibling)')) {
      fail(`${where}: the mounting script must come straight after the bar, or the bar is settled after the first paint and shifts the page.`);
    }
    let cfg = {};
    try {
      cfg = JSON.parse(decode(attr(tag, 'data-anb')));
    } catch {
      fail(`${where}: data-anb is not JSON.`);
    }
    if (!cfg.key || !cfg.version) fail(`${where}: no dismissal key/version in the config.`);
    const btn = body.match(/<button\b[^>]*\sdata-anb-dismiss[^>]*>/);
    if (!btn) fail(`${where}: no dismiss button.`);
    else {
      if (attr(btn[0], 'type') !== 'button') fail(`${where}: the dismiss button needs type="button".`);
      if (attr(btn[0], 'aria-label') !== 'Dismiss announcement') fail(`${where}: the dismiss button is named "${attr(btn[0], 'aria-label')}", expected "Dismiss announcement".`);
      if (attr(btn[0], 'hidden') === undefined) fail(`${where}: the dismiss button must be hidden until the script can make it work.`);
    }
    if (/aria-live=/.test(body)) fail(`${where}: a live region inside the bar; the countdown ticks every minute and must not be announced.`);
    const time = body.match(/<span\b[^>]*data-anb-countdown[^>]*>[\s\S]*?(<time\b[^>]*>)/);
    if (cfg.countdown) {
      countdowns++;
      if (!time) fail(`${where}: a countdown without a <time> element.`);
      else if (Number.isNaN(Date.parse(attr(time[1], 'datetime') || ''))) fail(`${where}: the countdown <time> has no parseable datetime.`);
    }
  });
  if (rel === 'dist/announcement-bar/index.html' && countdowns !== 1) fail(`${rel}: expected 1 countdown bar in the demo, found ${countdowns}.`);
  const defs = (html.match(/window\.__superheroAnnouncementBar=window\.__superheroAnnouncementBar\|\|/g) || []).length;
  if (bars.length && defs !== 1) fail(`${rel}: the bar runtime is defined ${defs} times; it must be once per page.`);
}
finish('announcement-bar page');

// ------------------------------------------------------- 7. theme contrast
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
const ratios = [];
for (const theme of ['accent', 'dark', 'light']) {
  const rule = barSrc.match(new RegExp(`\\.anb--${theme} \\{\\s*background: var\\(--anb-${theme}-bg, (#[0-9a-f]{3,6})\\);\\s*color: var\\(--anb-${theme}-fg, (#[0-9a-f]{3,6})\\);`, 'i'));
  if (!rule) {
    fail(`${barFile}: no \`.anb--${theme} { background: var(--anb-${theme}-bg, #…); color: var(--anb-${theme}-fg, #…); }\` rule to measure.`);
    continue;
  }
  const r = ratio(rule[1], rule[2]);
  ratios.push(`${theme} ${r.toFixed(2)}:1`);
  if (r < 4.5) fail(`theme "${theme}": ${rule[2]} on ${rule[1]} is ${r.toFixed(2)}:1, under 4.5:1.`);
}
if (!/\.anb__text :global\(a\) \{\s*color: var\(--anb-link, currentColor\);/.test(barSrc)) fail(`${barFile}: the link fallback must be currentColor (the theme's own text colour), or its contrast needs measuring here too.`);
finish('announcement-bar contrast');

console.log(`check-modal-and-bar ok: modal no-JS render on 2 pages; quiet demo on the gallery, automatic on its own page, 2 planted faults caught; ${inWin.length + instants.length + lefts.length} bar time cases; bar markup on 2 pages; contrast ${ratios.join(', ')}.`);
