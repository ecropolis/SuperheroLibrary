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
 *   page    role="img" named "Ends …" (or the ended text), no live region anywhere in it, the
 *           digits aria-hidden and hidden until the script runs, a "Ends <date>" line with a
 *           parseable <time datetime>, the mounting script straight after the element, the
 *           runtime defined once per page.
 *   source  motion only under prefers-reduced-motion: no-preference; evergreen in localStorage,
 *           never a cookie; the square fallback pair at 4.5:1 or more.
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
    if (attr(el.open, 'role') !== 'img') out.push(`${where}: the wrapper must be role="img", so its name is the one thing read and the digits are not.`);
    const name = decode(attr(el.open, 'aria-label') || '');
    if (!name) out.push(`${where}: the wrapper has no aria-label giving the end.`);
    else if (!name.startsWith(cfg.ends || 'Ends') && name !== cfg.ended && !name.startsWith('Ends in')) out.push(`${where}: aria-label "${name}" does not give the end ("${cfg.ends} …") or the ended text.`);
    if (/aria-live=|role="(?:timer|status|alert|log|marquee)"/.test(el.html)) out.push(`${where}: a live region; the digits must update visually only.`);
    const units = el.html.match(/<div\b[^>]*\sdata-cd-units[^>]*>/);
    if (!units) out.push(`${where}: no digits container.`);
    else {
      if (attr(units[0], 'aria-hidden') !== 'true') out.push(`${where}: the digits are not aria-hidden="true".`);
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
      ['a live region on the wrapper', (h) => h.replace('role="img"', 'role="img" aria-live="polite"')],
      ['role="timer" instead of img', (h) => h.replace('role="img"', 'role="timer"')],
      ['the digits exposed to screen readers', (h) => h.replace('aria-hidden="true" data-cd-units', 'data-cd-units')],
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

console.log(`check-time-and-toggles ok: ${counts.join('; ')}.`);
