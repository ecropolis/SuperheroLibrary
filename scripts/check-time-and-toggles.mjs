#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins countdown, content-toggle
 * and off-canvas: their time logic, their no-JavaScript render on the built demo pages, their
 * ARIA contract, and their reduced-motion and storage rules in the source.
 *
 * Every rule below is a function that returns the failures it finds. Each element also has a
 * MUTATION TEST: known-bad variants of its source or of its built page (a live region added, a
 * DST walk removed, a switch without aria-checked…) are fed to the same functions, and each must
 * be caught. A check that passes a broken element is itself reported as a failure.
 *
 * countdown
 *   time    the source between the `<cd-time>` markers, types stripped by Node, run against
 *           golden cases: wall-clock instants (DST gap, half-hour zones), `repeat` next
 *           occurrence (daily across the fall-back, weekly, exactly at the end), unit splitting,
 *           the evergreen start (kept, fresh, future or garbage), the end text.
 *   page    role="timer" named "Ends …" (or the ended text) and no aria-live attribute anywhere
 *           in it (timer's implicit aria-live is "off", so nothing is announced as it ticks);
 *           the digits readable, not aria-hidden: each unit a padded number hidden from screen
 *           readers, the same number unpadded for them, and its unit word; the digits hidden
 *           until the script runs; a "Ends <date>" line with a
 *           parseable <time datetime>, the mounting script straight after the element, the
 *           runtime defined once per page.
 *   source  motion only under prefers-reduced-motion: no-preference; evergreen in localStorage,
 *           never a cookie; the square fallback pair at 4.5:1 or more.
 *
 * content-toggle
 *   page    no-JS: the control bar hidden, panels a and b both rendered and visible, each under
 *           its label as a heading. style="switch": one <button type="button" role="switch">
 *           whose aria-checked matches `default`, named by label b, described by what exists.
 *           style="buttons": a named role="group" with two type="button" buttons, exactly one
 *           aria-pressed="true". aria-controls names real panels; no tab roles; the mounting
 *           script straight after; the runtime once per page.
 *   source  motion gated; the remembered choice in sessionStorage only; the pressed-button and
 *           badge fallbacks at 4.5:1, the switch track at 3:1 against white.
 *
 * off-canvas
 *   page    each <dialog data-ofc>: an id, not rendered `open`, named by a heading with text
 *           inside it, a type="button" close button with an aria-label and `hidden` until the
 *           script runs, side and mode valid, the mounting script straight after, the runtime
 *           once per page; on the demo, every panel has a trigger and every link trigger goes
 *           to #<id> (the no-JS path), with both modes and three or more sides shown.
 *   source  the no-JS rule puts the panel back in the flow, visible; showModal() + scroll lock
 *           for modal, show() + --ofc-push for push; the lock keeps the scrollbar width; the
 *           backdrop close checks where the press began; focus returns; motion gated; --ofc-z
 *           under the consent bar (120); a 44px close button; the panel pair at 4.5:1.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const counts = [];
const report = (list, prefix) => list.forEach((f) => failures.push(prefix ? `${prefix}: ${f}` : f));
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-time-and-toggles failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

// ------------------------------------------------------------------------------ helpers
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const decode = (s) => s?.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
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
/** Every element of `tag` carrying attribute `marker`, with its full markup. */
const roots = (html, tag, marker) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*\\s${marker}(?=[\\s>=])[^>]*>`, 'g'))].map((m) => ({ open: m[0], index: m.index, html: block(html, m.index, tag) }));
const read = (rel) => {
  const path = join(root, rel);
  if (!existsSync(path)) {
    failures.push(`${rel} is missing; run astro build (check-catalog.mjs does).`);
    return '';
  }
  return readFileSync(path, 'utf8');
};
const loadBlock = async (src, name, fn) => {
  const m = src.match(new RegExp(`// <${name}>\\n([\\s\\S]*?)// </${name}>`));
  if (!m) return null;
  const js = stripTypeScriptTypes(m[1], { mode: 'strip' });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  return mod[fn];
};
/** Mutation test: each mutant must make `run` report at least one failure. */
const mutants = async (element, list, run) => {
  let caught = 0;
  for (const [label, mutate] of list) {
    let found;
    try {
      found = await run(mutate);
    } catch {
      found = ['threw'];
    }
    if (found === 'unchanged') failures.push(`${element} mutation "${label}": the mutation did not apply; update it to the current source.`);
    else if (!found.length) failures.push(`${element} mutation "${label}" went undetected: the check passes a broken ${element}.`);
    else caught++;
  }
  return caught;
};
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
/** Motion must live only inside `@media (prefers-reduced-motion: no-preference)`. */
const motionOutsideGate = (css) => {
  const out = [];
  let gated = css;
  for (const m of css.matchAll(/@media \(prefers-reduced-motion: no-preference\) \{/g)) gated = gated.replace(block2(css, m.index), '');
  for (const m of gated.matchAll(/(?:^|[;{\s])(animation|transition)(?:-[a-z-]+)?\s*:\s*([^;}]+)/g)) {
    if (/^\s*none\s*$/.test(m[2])) continue;
    out.push(`${m[1]}: ${m[2].trim()}`);
  }
  return out;
};
/** A CSS block starting at `index`, through its matching brace. */
const block2 = (css, index) => {
  let depth = 0;
  for (let i = css.indexOf('{', index); i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && !--depth) return css.slice(index, i + 1);
  }
  return css.slice(index);
};
const styleOf = (src) => (src.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];

// ============================================================================ countdown
const cdFile = 'src/library/countdown/Countdown.astro';
const cdSrc = readFileSync(join(root, cdFile), 'utf8');
const at = (iso) => Date.parse(iso);
const H = 36e5;
const D = 24 * H;
const sameText = (a, b) => a.replace(/[  ]/g, ' ') === b;

/** Golden time cases against a countdownTime() implementation. */
function countdownTimeFailures(countdownTime) {
  const out = [];
  if (typeof countdownTime !== 'function') return ['no countdownTime() between the `// <cd-time>` markers.'];
  const t = countdownTime();
  const iso = (ms) => (Number.isFinite(ms) ? new Date(ms).toISOString() : String(ms));
  const eq = (label, got, want) => got !== want && out.push(`${label}: ${iso(got)}, expected ${iso(want)}.`);
  // Instants: the business's wall clock, whatever zone runs the code.
  eq('instant, Chicago 17:00 in October (CDT)', t.instant('2026-10-03T17:00', 'America/Chicago'), at('2026-10-03T22:00:00Z'));
  eq('instant, Chicago 17:00 in December (CST)', t.instant('2026-12-03T17:00', 'America/Chicago'), at('2026-12-03T23:00:00Z'));
  eq('instant, DST gap: New York 02:30 on spring-forward day does not exist and resolves to the jump', t.instant('2026-03-08T02:30', 'America/New_York'), at('2026-03-08T07:30:00Z'));
  eq('instant, the morning after spring-forward takes the walk’s second step (05:00 EDT)', t.instant('2026-03-08T05:00', 'America/New_York'), at('2026-03-08T09:00:00Z'));
  eq('instant, the night after fall-back takes the walk’s second step (03:00 EST)', t.instant('2026-11-01T03:00', 'America/New_York'), at('2026-11-01T08:00:00Z'));
  eq('instant, half-hour zone: Kolkata 09:00 (UTC+5:30)', t.instant('2026-01-15T09:00', 'Asia/Kolkata'), at('2026-01-15T03:30:00Z'));
  eq('instant, half-hour zone with DST: St John’s 12:00 in July (UTC−2:30)', t.instant('2026-07-01T12:00', 'America/St_Johns'), at('2026-07-01T14:30:00Z'));
  eq('instant, half-hour zone with DST: Adelaide 09:00 in January (UTC+10:30)', t.instant('2026-01-15T09:00', 'Australia/Adelaide'), at('2026-01-14T22:30:00Z'));
  eq('instant, a date is its local midnight', t.instant('2026-06-01', 'Europe/London'), at('2026-05-31T23:00:00Z'));
  // `repeat`: the next occurrence of the same wall-clock time.
  const chi = '2026-10-31T17:00';
  eq('next, before the first end: the first end', t.next(at('2026-10-30T12:00:00Z'), chi, 'America/Chicago', 'day'), at('2026-10-31T22:00:00Z'));
  eq('next, daily 17:00 Chicago across the fall-back: Nov 1 17:00 is CST', t.next(at('2026-10-31T23:00:00Z'), chi, 'America/Chicago', 'day'), at('2026-11-01T23:00:00Z'));
  eq('next, exactly at the end instant it rolls over to the next day', t.next(at('2026-10-31T22:00:00Z'), chi, 'America/Chicago', 'day'), at('2026-11-01T23:00:00Z'));
  eq('next, daily 02:30 New York into the spring-forward gap: the jump', t.next(at('2026-03-07T08:00:00Z'), '2026-03-01T02:30', 'America/New_York', 'day'), at('2026-03-08T07:30:00Z'));
  eq('next, daily 02:30 New York the day after the gap: 02:30 EDT again', t.next(at('2026-03-08T08:00:00Z'), '2026-03-01T02:30', 'America/New_York', 'day'), at('2026-03-09T06:30:00Z'));
  eq('next, weekly Friday 17:00 New York, from Saturday', t.next(at('2026-09-26T12:00:00Z'), '2026-09-25T17:00', 'America/New_York', 'week'), at('2026-10-02T21:00:00Z'));
  eq('next, weekly, a year and a half on, lands on the same weekday and wall time', t.next(at('2028-03-15T12:00:00Z'), '2026-09-25T17:00', 'America/New_York', 'week'), at('2028-03-17T21:00:00Z'));
  eq('next, half-hour zone daily: Kolkata 09:00', t.next(at('2026-01-20T04:00:00Z'), '2026-01-15T09:00', 'Asia/Kolkata', 'day'), at('2026-01-21T03:30:00Z'));
  eq('next, without `every` a passed end stays passed', t.next(at('2026-11-05T00:00:00Z'), chi, 'America/Chicago', null), at('2026-10-31T22:00:00Z'));
  // Units: the largest shown takes the rest, the smallest rounds up.
  const all = ['days', 'hours', 'minutes', 'seconds'];
  const splits = [
    ['all four', 2 * D + 4 * H + 30 * 6e4 + 15500, all, { days: 2, hours: 4, minutes: 30, seconds: 16 }],
    ['no days: hours take them', 2 * D + 3 * H + 5 * 6e4, ['hours', 'minutes', 'seconds'], { hours: 51, minutes: 5, seconds: 0 }],
    ['no seconds: 90 s left reads 2 minutes, not 1', 90e3, ['days', 'hours', 'minutes'], { days: 0, hours: 0, minutes: 2 }],
    ['one millisecond left reads 1 second, not 0', 1, all, { days: 0, hours: 0, minutes: 0, seconds: 1 }],
    ['zero is zero', 0, all, { days: 0, hours: 0, minutes: 0, seconds: 0 }],
    ['units out of order are taken largest first', 3 * H + 1000, ['seconds', 'hours'], { hours: 3, seconds: 1 }],
  ];
  for (const [label, ms, units, want] of splits) {
    const got = t.split(ms, units);
    if (JSON.stringify(got) !== JSON.stringify(want)) out.push(`split, ${label}: ${JSON.stringify(got)}, expected ${JSON.stringify(want)}.`);
  }
  // Evergreen: a stored past start is kept; anything else starts now and is written.
  const now = at('2026-09-26T15:00:00Z');
  const ev = [
    ['first visit', null, { start: now, end: now + 30 * 6e4, store: true }],
    ['return visit keeps the start', String(now - 10 * 6e4), { start: now - 10 * 6e4, end: now + 20 * 6e4, store: false }],
    ['return after it ended keeps the start (it stays ended)', String(now - 2 * H), { start: now - 2 * H, end: now - 2 * H + 30 * 6e4, store: false }],
    ['a start in the future (clock changed) starts again now', String(now + H), { start: now, end: now + 30 * 6e4, store: true }],
    ['garbage starts again now', 'abc', { start: now, end: now + 30 * 6e4, store: true }],
    ['empty starts again now', '', { start: now, end: now + 30 * 6e4, store: true }],
  ];
  for (const [label, stored, want] of ev) {
    const got = t.evergreen(stored, now, 30);
    if (JSON.stringify(got) !== JSON.stringify(want)) out.push(`evergreen, ${label}: ${JSON.stringify(got)}, expected ${JSON.stringify(want)}.`);
  }
  const L = { days: ['day', 'days'], hours: ['hour', 'hours'], minutes: ['minute', 'minutes'] };
  for (const [ms, want] of [[30 * 6e4, '30 minutes'], [90 * 6e4, '1 hour 30 minutes'], [2 * D, '2 days'], [D + H, '1 day 1 hour'], [6e4, '1 minute']]) {
    const got = t.duration(ms, L);
    if (got !== want) out.push(`duration(${ms}) = "${got}", expected "${want}".`);
  }
  const end = t.endText(at('2026-10-03T22:00:00Z'), 'America/Chicago', 'en-US');
  if (!sameText(end, 'Oct 3, 5:00 PM CDT')) out.push(`endText, Chicago: "${end}", expected "Oct 3, 5:00 PM CDT".`);
  for (const bad of ['2026-02-30', '2026-13-01', '2026-01-01T24:00', '2026-01-01T17:00Z', '2026-1-1', 'tomorrow', '']) if (t.valid(bad)) out.push(`valid("${bad}") should be false.`);
  for (const good of ['2026-02-28', '2028-02-29', '2026-01-01T23:59']) if (!t.valid(good)) out.push(`valid("${good}") should be true.`);
  return out;
}

/** The built page: every countdown's no-JS render and ARIA contract. */
function countdownPageFailures(html, { demo = false } = {}) {
  const out = [];
  const els = roots(html, 'div', 'data-cd');
  if (demo && els.length !== 3) out.push(`expected the demo's 3 countdowns, found ${els.length}.`);
  els.forEach((el, i) => {
    const where = `countdown ${i + 1}`;
    let cfg = {};
    try {
      cfg = JSON.parse(decode(attr(el.open, 'data-cd')));
    } catch {
      out.push(`${where}: data-cd is not JSON.`);
    }
    if (attr(el.open, 'role') !== 'timer') out.push(`${where}: the wrapper must be role="timer" (implicit aria-live "off"), not "${attr(el.open, 'role')}".`);
    const name = decode(attr(el.open, 'aria-label') || '');
    if (!name) out.push(`${where}: the wrapper has no aria-label giving the end.`);
    else if (!name.startsWith(cfg.ends || 'Ends') && name !== cfg.ended && !name.startsWith('Ends in')) out.push(`${where}: aria-label "${name}" does not give the end ("${cfg.ends} …") or the ended text.`);
    if (/aria-live=/.test(el.html)) out.push(`${where}: an aria-live attribute; the timer's implicit "off" is the contract, and nothing may be announced as it ticks.`);
    if (/role="(?:img|status|alert|log|marquee)"/.test(el.html)) out.push(`${where}: a role inside or on the countdown that hides the digits or announces them.`);
    const units = el.html.match(/<div\b[^>]*\sdata-cd-units[^>]*>/);
    if (!units) out.push(`${where}: no digits container.`);
    else {
      if (attr(units[0], 'aria-hidden') !== undefined) out.push(`${where}: the digits are aria-hidden; someone who navigates into the timer must be able to read them.`);
      const unitEls = roots(el.html, 'div', 'data-cd-unit');
      if (!unitEls.length) out.push(`${where}: no units.`);
      for (const u of unitEls) {
        const name = attr(u.open, 'data-cd-unit');
        const num = u.html.match(/<span\b[^>]*\sdata-cd-num[^>]*>([^<]*)<\/span>/);
        const sr = u.html.match(/<span\b[^>]*\sdata-cd-sr[^>]*>([^<]*)<\/span>/);
        const word = u.html.match(/<span\b[^>]*\sdata-cd-label="([^"]*)"[^>]*>([^<]*)<\/span>/);
        if (!num || attr(num[0], 'aria-hidden') !== 'true') out.push(`${where}, ${name}: the zero-padded number must be aria-hidden ("03" is read "zero three").`);
        if (!sr || !/^\d+$/.test(sr[1]) || (num && Number(sr[1]) !== Number(num[1])) || /^0\d/.test(sr[1])) out.push(`${where}, ${name}: no unpadded number for screen readers matching the digits.`);
        if (!word || !word[2].trim() || !decode(word[1]).split('|').includes(word[2].trim())) out.push(`${where}, ${name}: the number has no unit word beside it, so it would read "3 4" rather than "3 days 4 hours".`);
      }
      if (attr(units[0], 'hidden') === undefined) out.push(`${where}: the digits are visible without JavaScript; built-time digits are stale and never tick.`);
    }
    const ends = el.html.match(/<p\b[^>]*\sdata-cd-ends[^>]*>([\s\S]*?)<\/p>/);
    if (!ends) out.push(`${where}: no "Ends <date>" line for the no-JavaScript render.`);
    else {
      const time = ends[1].match(/<time\b[^>]*>/);
      if (!time) out.push(`${where}: the end line has no <time>.`);
      else if (cfg.to && Number.isNaN(Date.parse(attr(time[0], 'datetime') || ''))) out.push(`${where}: the end <time> has no parseable datetime.`);
      if (cfg.to && attr(ends[0], 'hidden') === undefined && !text(ends[1]).startsWith(cfg.ends)) out.push(`${where}: the end line reads "${text(ends[1])}", not "${cfg.ends} <date>".`);
    }
    if (!/<p\b[^>]*\sdata-cd-ended[^>]*>/.test(el.html)) out.push(`${where}: no ended message element.`);
    const after = html.slice(el.index + el.html.length).match(/^\s*<script\b[^>]*>([\s\S]*?)<\/script>/);
    if (!after || !after[1].includes('.mount(document.currentScript.previousElementSibling)')) out.push(`${where}: the mounting script must come straight after the element, or the digits appear after the first paint and shift the page.`);
    if (!['message', 'hide', 'repeat'].includes(cfg.onEnd)) out.push(`${where}: onEnd "${cfg.onEnd}".`);
    if (cfg.onEnd === 'repeat' && cfg.to && !['day', 'week'].includes(cfg.every)) out.push(`${where}: a repeat without every.`);
  });
  const defs = (html.match(/window\.__superheroCountdown=window\.__superheroCountdown\|\|/g) || []).length;
  if (els.length && defs !== 1) out.push(`the countdown runtime is defined ${defs} times; it must be once per page.`);
  return out;
}

/** The source: motion gate, storage, contrast. */
function countdownSourceFailures(src) {
  const out = [];
  for (const m of motionOutsideGate(styleOf(src))) out.push(`motion outside prefers-reduced-motion: no-preference (${m}).`);
  if (!/@media \(prefers-reduced-motion: no-preference\)[\s\S]*cd__num--tick[\s\S]*animation/.test(styleOf(src))) out.push('the tick animation is not declared under prefers-reduced-motion: no-preference.');
  if (/document\.cookie/.test(src)) out.push('touches document.cookie; the evergreen start lives in localStorage, never a cookie.');
  if (!/localStorage\.setItem\(/.test(src)) out.push('the evergreen start is not written to localStorage.');
  const sq = styleOf(src).match(/\.cd--square \.cd__unit \{[^}]*background: var\(--cd-bg, (#[0-9a-f]{3,6})\);\s*color: var\(--cd-fg, (#[0-9a-f]{3,6})\);/i);
  if (!sq) out.push('no `.cd--square .cd__unit { … background: var(--cd-bg, #…); color: var(--cd-fg, #…); }` rule to measure.');
  else if (ratio(sq[1], sq[2]) < 4.5) out.push(`square: ${sq[2]} on ${sq[1]} is ${ratio(sq[1], sq[2]).toFixed(2)}:1, under 4.5:1.`);
  return out;
}

const countdownTime = await loadBlock(cdSrc, 'cd-time', 'countdownTime');
report(countdownTimeFailures(countdownTime), 'countdown time');
report(countdownSourceFailures(cdSrc), `${cdFile}`);
const cdDemo = read('dist/countdown/index.html');
if (cdDemo) report(countdownPageFailures(cdDemo, { demo: true }), 'dist/countdown/index.html');
const home = read('dist/index.html');
if (home) report(countdownPageFailures(home), 'dist/index.html (countdown)');
finish('countdown');

const cdMutants = await mutants(
  'countdown',
  [
    // The time logic, mutated in the source and re-run against the goldens.
    ['the DST walk runs once instead of up to three times', 'for (let i = 0; i < 3; i++)', 'for (let i = 0; i < 1; i++)'],
    ['the zone walk is skipped (UTC wall clock)', 'const off = parts(ms, tz) - target;', 'const off = 0;'],
    ['repeat keeps an end reached exactly now', 'if (at > ms) return at;', 'if (at >= ms) return at;'],
    ['a week repeats daily', "every === 'week' ? 7 : 1", '1'],
    ['the smallest unit rounds down', 'Math.ceil(left / unit)', 'Math.floor(left / unit)'],
    ['a stored evergreen start in the future is trusted', 'n > 0 && n <= now', 'n > 0'],
  ].map(([label, from, to]) => [
    label,
    async () => {
      if (!cdSrc.includes(from)) return 'unchanged';
      return countdownTimeFailures(await loadBlock(cdSrc.replace(from, to), 'cd-time', 'countdownTime'));
    },
  ]),
  (f) => f(),
).then(async (n) =>
  n +
  (await mutants(
    'countdown',
    [
      ['a live region on the wrapper', (h) => h.replace('role="timer"', 'role="timer" aria-live="polite"')],
      ['an explicit aria-live="off" (the contract is no attribute at all)', (h) => h.replace('role="timer"', 'role="timer" aria-live="off"')],
      ['role="img" instead of timer', (h) => h.replace('role="timer"', 'role="img"')],
      ['the digits hidden from screen readers', (h) => h.replace('<div class="cd__units" data-cd-units', '<div class="cd__units" aria-hidden="true" data-cd-units')],
      ['the padded number read out', (h) => h.replace('class="cd__num" aria-hidden="true" data-cd-num', 'class="cd__num" data-cd-num')],
      ['no unpadded number for screen readers', (h) => h.replace(/<span class="cd__sr" data-cd-sr[^>]*>\d+<\/span>/, '')],
      ['a unit word dropped', (h) => h.replace(/(data-cd-label="[^"]*"[^>]*>)[^<]+(<\/span>)/, '$1$2')],
      ['the digits visible without JavaScript', (h) => h.replace(/(<div class="cd__units"[^>]*?) hidden/, '$1')],
      ['no aria-label', (h) => h.replace(/(<div\b[^>]*?)\saria-label="[^"]*"([^>]*data-cd=)/, '$1$2')],
      ['the mount script moved away from the element', (h) => h.replace(/<script>window\.__superheroCountdown\.mount/, '<p></p><script>window.__superheroCountdown.mount')],
      ['the runtime defined twice', (h) => h.replace('window.__superheroCountdown=window.__superheroCountdown||', 'window.__superheroCountdown=window.__superheroCountdown||0;window.__superheroCountdown=window.__superheroCountdown||')],
    ].map(([label, mutate]) => [label, () => {
      const m = mutate(cdDemo);
      return m === cdDemo ? 'unchanged' : countdownPageFailures(m, { demo: true });
    }]),
    (f) => f(),
  )) +
  (await mutants(
    'countdown',
    [
      ['the tick animation outside the reduced-motion gate', (s) => s.replace('.cd__label {', '.cd__num { animation: cd-tick 0.3s; }\n  .cd__label {')],
      ['the evergreen start in a cookie', (s) => s.replace('localStorage.setItem(k, v);', 'localStorage.setItem(k, v); document.cookie = k + "=" + v;')],
      ['a square fallback under 4.5:1', (s) => s.replace('background: var(--cd-bg, #1e283c);', 'background: var(--cd-bg, #8a8f99);')],
    ].map(([label, mutate]) => [label, () => {
      const m = mutate(cdSrc);
      return m === cdSrc ? 'unchanged' : countdownSourceFailures(m);
    }]),
    (f) => f(),
  )),
);
finish('countdown mutation tests');
counts.push(`countdown: time goldens, ${roots(cdDemo, 'div', 'data-cd').length} demo countdowns, ${cdMutants} mutants caught`);

// ======================================================================= content-toggle
const ctFile = 'src/library/content-toggle/ContentToggle.astro';
const ctSrc = readFileSync(join(root, ctFile), 'utf8');

/** The built page: every toggle's no-JS render and ARIA contract. */
function contentTogglePageFailures(html, { demo = false } = {}) {
  const out = [];
  const els = roots(html, 'div', 'data-ct');
  if (demo && els.length !== 2) out.push(`expected the demo's 2 toggles, found ${els.length}.`);
  if (demo && !els.some((e) => /ct--switch/.test(e.open))) out.push('the demo has no switch toggle.');
  if (demo && !els.some((e) => /ct--buttons/.test(e.open))) out.push('the demo has no buttons toggle.');
  els.forEach((el, i) => {
    const where = `toggle ${i + 1}`;
    let cfg = {};
    try {
      cfg = JSON.parse(decode(attr(el.open, 'data-ct')));
    } catch {
      out.push(`${where}: data-ct is not JSON.`);
    }
    const labels = cfg.labels || [];
    if (labels.length !== 2) out.push(`${where}: the config does not carry two labels.`);
    const bar = el.html.match(/<div\b[^>]*\sdata-ct-bar[^>]*>/);
    if (!bar) out.push(`${where}: no control bar.`);
    else if (attr(bar[0], 'hidden') === undefined) out.push(`${where}: the switch is shown without JavaScript, where it cannot work.`);
    // Both panels, visible, each under its label as a heading.
    const panels = roots(el.html, 'div', 'data-ct-panel');
    const ids = new Set(panels.map((p) => attr(p.open, 'id')));
    if (panels.map((p) => attr(p.open, 'data-ct-panel')).join() !== 'a,b') out.push(`${where}: expected panels a then b, found ${panels.map((p) => attr(p.open, 'data-ct-panel')).join() || 'none'}.`);
    panels.forEach((p, k) => {
      if (attr(p.open, 'hidden') !== undefined) out.push(`${where}, panel ${'ab'[k]}: hidden without JavaScript; both panels must render.`);
      const h = p.html.match(/<(h[2-6])\b[^>]*>([\s\S]*?)<\/\1>/);
      if (!h) out.push(`${where}, panel ${'ab'[k]}: no heading.`);
      else if (text(h[2]) !== labels[k]) out.push(`${where}, panel ${'ab'[k]}: heading "${text(h[2])}", expected its label "${labels[k]}".`);
    });
    const controls = [...el.html.matchAll(/\saria-controls="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
    for (const c of controls) if (!ids.has(c)) out.push(`${where}: aria-controls names "${c}", which is not a panel.`);
    const bodyOf = (id) => {
      const m = el.html.match(new RegExp(`<([a-z0-9]+)\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</\\1>`));
      return m ? text(m[2]) : '';
    };
    if (/ct--switch/.test(el.open)) {
      const sws = [...el.html.matchAll(/<button\b[^>]*\srole="switch"[^>]*>/g)].map((m) => m[0]);
      if (sws.length !== 1) out.push(`${where}: expected one role="switch" button, found ${sws.length}.`);
      for (const sw of sws) {
        if (attr(sw, 'type') !== 'button') out.push(`${where}: the switch needs type="button".`);
        const checked = attr(sw, 'aria-checked');
        if (!['true', 'false'].includes(checked)) out.push(`${where}: the switch has aria-checked="${checked}".`);
        else if ((checked === 'true') !== (cfg.initial === 'b')) out.push(`${where}: aria-checked="${checked}" does not match default "${cfg.initial}".`);
        const by = attr(sw, 'aria-labelledby');
        if (!by || !bodyOf(by)) out.push(`${where}: the switch is not named by a label with text.`);
        else if (bodyOf(by) !== labels[1]) out.push(`${where}: the switch is named "${bodyOf(by)}", expected label b "${labels[1]}" (checked = b shown).`);
        const desc = attr(sw, 'aria-describedby');
        for (const d of desc ? desc.split(/\s+/) : []) if (!bodyOf(d)) out.push(`${where}: aria-describedby "${d}" points at nothing with text.`);
      }
      if (/aria-pressed=/.test(el.html)) out.push(`${where}: a switch toggle with aria-pressed buttons as well.`);
    } else if (/ct--buttons/.test(el.open)) {
      const group = el.html.match(/<div\b[^>]*\srole="group"[^>]*>/);
      if (!group || !attr(group[0], 'aria-label')) out.push(`${where}: the buttons are not in a named role="group".`);
      const btns = [...el.html.matchAll(/<button\b[^>]*\sdata-ct-pick[^>]*>/g)].map((m) => m[0]);
      if (btns.length !== 2) out.push(`${where}: expected two buttons, found ${btns.length}.`);
      if (btns.some((b) => attr(b, 'type') !== 'button')) out.push(`${where}: each button needs type="button".`);
      const pressed = btns.map((b) => attr(b, 'aria-pressed'));
      if (pressed.filter((p) => p === 'true').length !== 1 || pressed.some((p) => !['true', 'false'].includes(p))) out.push(`${where}: exactly one button must be aria-pressed="true", found ${JSON.stringify(pressed)}.`);
      if (/role="switch"/.test(el.html)) out.push(`${where}: a buttons toggle with a switch as well.`);
    } else out.push(`${where}: neither ct--switch nor ct--buttons.`);
    if (/role="tab(?:list|panel)?"/.test(el.html)) out.push(`${where}: tab roles; a toggle is not tabs.`);
    const after = html.slice(el.index + el.html.length).match(/^\s*<script\b[^>]*>([\s\S]*?)<\/script>/);
    if (!after || !after[1].includes('__superheroContentToggle.mount(document.currentScript.previousElementSibling)')) out.push(`${where}: the mounting script must come straight after the element, or the other panel disappears after the first paint.`);
  });
  const defs = (html.match(/window\.__superheroContentToggle=window\.__superheroContentToggle\|\|/g) || []).length;
  if (els.length && defs !== 1) out.push(`the toggle runtime is defined ${defs} times; it must be once per page.`);
  return out;
}

/** The source: motion gate, storage, contrast. */
function contentToggleSourceFailures(src) {
  const out = [];
  const css = styleOf(src);
  for (const m of motionOutsideGate(css)) out.push(`motion outside prefers-reduced-motion: no-preference (${m}).`);
  if (/document\.cookie|localStorage/.test(src)) out.push('`remember` is for this session: sessionStorage only, no localStorage or cookie.');
  if (!/sessionStorage\.setItem\(/.test(src)) out.push('the choice is not written to sessionStorage.');
  const pairs = [
    ['pressed button', /\.ct__btn\[aria-pressed='true'\] \{\s*background: var\(--ct-pressed-bg, (#[0-9a-f]{3,6})\);\s*color: var\(--ct-pressed-fg, (#[0-9a-f]{3,6})\);/i, 4.5],
    ['badge', /background: var\(--ct-badge-bg, (#[0-9a-f]{3,6})\);\s*color: var\(--ct-badge-fg, (#[0-9a-f]{3,6})\);/i, 4.5],
  ];
  for (const [name, re, min] of pairs) {
    const m = css.match(re);
    if (!m) out.push(`no fallback pair to measure for the ${name}.`);
    else if (ratio(m[1], m[2]) < min) out.push(`${name}: ${m[2]} on ${m[1]} is ${ratio(m[1], m[2]).toFixed(2)}:1, under ${min}:1.`);
  }
  const track = css.match(/background: var\(--ct-track, (#[0-9a-f]{3,6})\);/i);
  if (!track) out.push('no switch track fallback to measure.');
  else if (ratio(track[1], '#ffffff') < 3) out.push(`switch track ${track[1]} is under 3:1 against white (a control needs 3:1).`);
  return out;
}

report(contentToggleSourceFailures(ctSrc), ctFile);
const ctDemo = read('dist/content-toggle/index.html');
if (ctDemo) report(contentTogglePageFailures(ctDemo, { demo: true }), 'dist/content-toggle/index.html');
if (home) report(contentTogglePageFailures(home), 'dist/index.html (content-toggle)');
finish('content-toggle');

const pageMutant = (html, fn, opts) => (mutate) => {
  const m = mutate(html);
  return m === html ? 'unchanged' : fn(m, opts);
};
const ctMutants =
  (await mutants(
    'content-toggle',
    [
      ['the switch loses role="switch"', (h) => h.replace(' role="switch"', '')],
      ['the switch loses aria-checked', (h) => h.replace(/ aria-checked="(?:true|false)"/, '')],
      ['the switch named by label a', (h) => h.replace('aria-labelledby="ct-1-b-name"', 'aria-labelledby="ct-1-a"')],
      ['the bar shown without JavaScript', (h) => h.replace('data-ct-bar hidden', 'data-ct-bar')],
      ['panel b hidden without JavaScript', (h) => h.replace('data-ct-panel="b"', 'data-ct-panel="b" hidden')],
      ['a panel without its heading', (h) => h.replace(/<h3 class="ct__heading"[^>]*>Annual<\/h3>/, '')],
      ['both buttons pressed', (h) => h.replace('aria-pressed="false"', 'aria-pressed="true"')],
      ['the buttons group unnamed', (h) => h.replace(/(role="group") aria-label="[^"]*"/, '$1')],
      ['tabs roles instead', (h) => h.replace('role="group"', 'role="tablist"')],
      ['aria-controls to nowhere', (h) => h.replace('aria-controls="ct-1-pa ct-1-pb"', 'aria-controls="ct-1-pa ct-9-pb"')],
      ['the mount script moved away', (h) => h.replace(/(<\/div>)(<script>window\.__superheroContentToggle\.mount)/, '$1<p></p>$2')],
    ],
    pageMutant(ctDemo, contentTogglePageFailures, { demo: true }),
  )) +
  (await mutants(
    'content-toggle',
    [
      ['the knob slides outside the reduced-motion gate', (s) => s.replace('.ct__switch[aria-checked', '.ct__knob { transition: translate 0.2s; }\n  .ct__switch[aria-checked')],
      ['remembered in localStorage', (s) => s.replace('sessionStorage.setItem(k, v);', 'localStorage.setItem(k, v);')],
      ['a pressed button under 4.5:1', (s) => s.replace('var(--ct-pressed-bg, #5933d8)', 'var(--ct-pressed-bg, #b9a8f0)')],
    ],
    (mutate) => {
      const m = mutate(ctSrc);
      return m === ctSrc ? 'unchanged' : contentToggleSourceFailures(m);
    },
  ));
finish('content-toggle mutation tests');
counts.push(`content-toggle: ${roots(ctDemo, 'div', 'data-ct').length} demo toggles, ${ctMutants} mutants caught`);

// =========================================================================== off-canvas
const ofcFile = 'src/library/off-canvas/OffCanvas.astro';
const ofcSrc = readFileSync(join(root, ofcFile), 'utf8');

/** The built page: every panel's no-JS render, its name, its close button and its triggers. */
function offCanvasPageFailures(html, { demo = false } = {}) {
  const out = [];
  const els = roots(html, 'dialog', 'data-ofc');
  if (demo && els.length !== 4) out.push(`expected the demo's 4 panels, found ${els.length}.`);
  const sides = new Set();
  const modes = new Set();
  els.forEach((el, i) => {
    const id = attr(el.open, 'id');
    const where = `panel ${i + 1} (#${id})`;
    if (!id) out.push(`${where}: the <dialog> has no id, so nothing can open it.`);
    if (attr(el.open, 'open') !== undefined) out.push(`${where}: rendered with \`open\`; the no-JS render is the inline panel, and a scripted page must start closed.`);
    if (/\son[a-z]+=/i.test(el.open)) out.push(`${where}: inline event handler on the <dialog>.`);
    let cfg = {};
    try {
      cfg = JSON.parse(decode(attr(el.open, 'data-ofc')));
    } catch {
      out.push(`${where}: data-ofc is not JSON.`);
    }
    if (!['left', 'right', 'top', 'bottom'].includes(cfg.side)) out.push(`${where}: side "${cfg.side}".`);
    if (!['modal', 'push'].includes(cfg.mode)) out.push(`${where}: mode "${cfg.mode}".`);
    sides.add(cfg.side);
    modes.add(cfg.mode);
    if (!new RegExp(`\\bofc--${cfg.side}\\b`).test(attr(el.open, 'class') || '')) out.push(`${where}: the class does not carry its side.`);
    const by = attr(el.open, 'aria-labelledby');
    if (!by) out.push(`${where}: no aria-labelledby; the title must name the panel.`);
    else {
      const t = el.html.match(new RegExp(`<(h[2-6])\\b[^>]*\\sid="${by}"[^>]*>([\\s\\S]*?)</\\1>`));
      if (!t || !text(t[2])) out.push(`${where}: aria-labelledby="${by}" is not a heading with text inside the panel (without JavaScript the title heads the inline panel).`);
    }
    const close = el.html.match(/<button\b[^>]*\sdata-ofc-close[^>]*>/);
    if (!close) out.push(`${where}: no close button.`);
    else {
      if (attr(close[0], 'type') !== 'button') out.push(`${where}: the close button needs type="button".`);
      if (!attr(close[0], 'aria-label')) out.push(`${where}: the close button has no aria-label.`);
      if (attr(close[0], 'hidden') === undefined) out.push(`${where}: the close button shows without JavaScript, where it cannot close anything.`);
    }
    if (/<noscript\b/i.test(el.html)) out.push(`${where}: a <noscript> inside the panel.`);
    const after = html.slice(el.index + el.html.length).match(/^\s*<script\b[^>]*>([\s\S]*?)<\/script>/);
    if (!after || !after[1].includes('__superheroOffCanvas.mount(document.currentScript.previousElementSibling)')) out.push(`${where}: the mounting script must come straight after the panel, or it shows inline until the page has loaded.`);
    if (demo && id) {
      const trig = [...html.matchAll(new RegExp(`<[a-z]+\\b[^>]*\\sdata-offcanvas-open="${id}"[^>]*>`, 'g'))].map((m) => m[0]);
      if (!trig.length) out.push(`${where}: no trigger on the page.`);
      for (const t of trig) if (t.startsWith('<a') && attr(t, 'href') !== `#${id}`) out.push(`${where}: a link trigger goes to "${attr(t, 'href')}", not #${id}; without JavaScript it must reach the inline panel.`);
    }
  });
  if (demo && sides.size < 3) out.push(`the demo shows ${sides.size} sides; show at least three.`);
  if (demo && modes.size !== 2) out.push('the demo must show both modal and push.');
  const defs = (html.match(/window\.__superheroOffCanvas=window\.__superheroOffCanvas\|\|/g) || []).length;
  if (els.length && defs !== 1) out.push(`the off-canvas runtime is defined ${defs} times; it must be once per page.`);
  return out;
}

/** The source: the no-JS rule, the modal and push contracts, motion, stacking, contrast. */
function offCanvasSourceFailures(src) {
  const out = [];
  const css = styleOf(src);
  const nojs = css.match(/\.ofc:not\(\[data-ofc-ready\]\) \{([^}]*)\}/);
  if (!nojs) out.push('no `.ofc:not([data-ofc-ready])` rule: without JavaScript the <dialog> would stay display: none.');
  else {
    if (!/position:\s*static/.test(nojs[1])) out.push('the no-JS rule does not put the panel back in the flow (position: static).');
    if (!/display:\s*block/.test(nojs[1])) out.push('the no-JS rule does not show the panel (display: block).');
  }
  for (const m of motionOutsideGate(css)) out.push(`motion outside prefers-reduced-motion: no-preference (${m}).`);
  const z = css.match(/z-index:\s*var\(--ofc-z,\s*(\d+)\)/);
  if (!z) out.push('no `z-index: var(--ofc-z, <n>)` on the panel.');
  else if (+z[1] >= 120) out.push(`--ofc-z falls back to ${z[1]}; it must stay below the cookie-consent bar (120).`);
  if (!/\.ofc__close \{[^}]*width: 2\.75rem;[^}]*height: 2\.75rem;/.test(css)) out.push('the close button is not 44px (2.75rem) square.');
  const surf = css.match(/background: var\(--ofc-bg, (#[0-9a-f]{3,6})\);\s*color: var\(--ofc-fg, (#[0-9a-f]{3,6})\);/i);
  if (!surf) out.push('no panel fallback pair to measure.');
  else if (ratio(surf[1], surf[2]) < 4.5) out.push(`panel: ${surf[2]} on ${surf[1]} is ${ratio(surf[1], surf[2]).toFixed(2)}:1, under 4.5:1.`);
  if (!/cfg\.mode === 'modal'\) \{\s*s\.d\.showModal\(\);\s*lock\(true\);/.test(src)) out.push('modal mode must open with showModal() and lock the scroll.');
  if (!/s\.d\.show\(\);\s*publish\(s\);/.test(src)) out.push('push mode must open with show() (non-modal) and publish --ofc-push.');
  if (!/html\.style\.paddingRight = bar \+ 'px'/.test(src)) out.push('the scroll lock does not keep the scrollbar width.');
  if (!/downOutside = e\.target === d && outside\(e\)/.test(src)) out.push('the backdrop close does not check where the press began (a dragged selection would close it).');
  if (!/back\.focus\(\)/.test(src)) out.push('focus is not returned to the opener on close.');
  return out;
}

report(offCanvasSourceFailures(ofcSrc), ofcFile);
const ofcDemo = read('dist/off-canvas/index.html');
if (ofcDemo) report(offCanvasPageFailures(ofcDemo, { demo: true }), 'dist/off-canvas/index.html');
if (home) report(offCanvasPageFailures(home), 'dist/index.html (off-canvas)');
finish('off-canvas');

const ofcMutants =
  (await mutants(
    'off-canvas',
    [
      ['a panel rendered open', (h) => h.replace('<dialog id="demo-ofc-menu"', '<dialog open id="demo-ofc-menu"')],
      ['the close button shown without JavaScript', (h) => h.replace('data-ofc-close hidden', 'data-ofc-close')],
      ['the close button unnamed', (h) => h.replace('aria-label="Close" data-ofc-close', 'data-ofc-close')],
      ['the panel unnamed', (h) => h.replace(' aria-labelledby="demo-ofc-menu-title"', '')],
      ['a link trigger to the wrong anchor', (h) => h.replace('href="#demo-ofc-filters" data-offcanvas-open', 'href="#elsewhere" data-offcanvas-open')],
      ['a panel without a trigger', (h) => h.replaceAll('data-offcanvas-open="demo-ofc-notice"', 'data-x="demo-ofc-notice"')],
      ['the mount script moved away', (h) => h.replace(/(<\/dialog>)(<script>window\.__superheroOffCanvas\.mount)/, '$1<p></p>$2')],
      ['the runtime defined twice', (h) => h.replace('window.__superheroOffCanvas=window.__superheroOffCanvas||', 'window.__superheroOffCanvas=window.__superheroOffCanvas||0;window.__superheroOffCanvas=window.__superheroOffCanvas||')],
    ],
    pageMutant(ofcDemo, offCanvasPageFailures, { demo: true }),
  )) +
  (await mutants(
    'off-canvas',
    [
      ['no inline render without JavaScript', (s) => s.replace('.ofc:not([data-ofc-ready]) {\n    position: static;\n    display: block;', '.ofc:not([data-ofc-ready]) {\n    position: static;')],
      ['the slide outside the reduced-motion gate', (s) => s.replace('.ofc[data-ofc-ready][open] {\n    display: flex;', '.ofc[data-ofc-ready][open] {\n    transition: translate 0.3s;\n    display: flex;')],
      ['a push panel above the consent bar', (s) => s.replace('z-index: var(--ofc-z, 110);', 'z-index: var(--ofc-z, 130);')],
      ['a modal panel opened non-modal', (s) => s.replace('s.d.showModal();\n      lock(true);', 's.d.show();\n      lock(true);')],
      ['the scrollbar width not kept', (s) => s.replace("if (bar > 0) html.style.paddingRight = bar + 'px';", '')],
      ['a dragged selection closes it', (s) => s.replace('downOutside = e.target === d && outside(e);', 'downOutside = true;')],
      ['a 32px close button', (s) => s.replace('width: 2.75rem;\n    height: 2.75rem;\n    margin-left: auto;', 'width: 2rem;\n    height: 2rem;\n    margin-left: auto;')],
    ],
    (mutate) => {
      const m = mutate(ofcSrc);
      return m === ofcSrc ? 'unchanged' : offCanvasSourceFailures(m);
    },
  ));
finish('off-canvas mutation tests');
counts.push(`off-canvas: ${roots(ofcDemo, 'dialog', 'data-ofc').length} demo panels, ${ofcMutants} mutants caught`);

console.log(`check-time-and-toggles ok: ${counts.join('; ')}.`);
