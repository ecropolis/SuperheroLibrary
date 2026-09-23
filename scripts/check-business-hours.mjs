#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the business-hours
 * element's state machine and its static render.
 *
 * 1. Runtime: full ICU, and the zones the cases use. Intl is the time-zone database here,
 *    so an ICU without it would make every case below meaningless.
 * 2. The engine: the source between the `<business-hours-engine>` markers in
 *    src/library/business-hours/BusinessHours.astro, types stripped by Node, imported as a
 *    module. That is the same function the browser gets (serialised into the inline script).
 * 3. The golden table: (data, now) → sentence, plus the instants behind it.
 * 4. JSON-LD shape.
 * 5. The built demo page: the table is there; no Open/Closed claim outside the table, the
 *    dated list and the slots; the live region is empty; the inline script carries the same
 *    engine and gives the same answer.
 *
 * Exits 1 with one line per failed case.
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
  console.error(`check-business-hours failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

// ------------------------------------------------------------------ 1. runtime
const [major] = process.versions.node.split('.').map(Number);
if (major < 22) fail(`Node ${process.versions.node}: need 22 or later (full ICU, and module.stripTypeScriptTypes).`);
if (!process.versions.icu || Number(process.versions.icu.split('.')[0]) < 72) {
  fail(`ICU ${process.versions.icu}: need 72 or later (full ICU with current zone data).`);
}
for (const tz of ['America/Chicago', 'America/Anchorage', 'Europe/London']) {
  try {
    const got = new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone;
    if (got !== tz) fail(`Intl resolves ${tz} as ${got}.`);
  } catch (e) {
    fail(`Intl does not know ${tz}: ${e.message}`);
  }
}
if (new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone: 'UTC' }).format(0) !== 'Donnerstag') {
  fail('Intl has no de-DE data: this Node was built with small-icu.');
}
finish('runtime');

// ------------------------------------------------------------------- 2. engine
const componentPath = join(root, 'src/library/business-hours/BusinessHours.astro');
const component = readFileSync(componentPath, 'utf8');
const m = component.match(/\/\/ <business-hours-engine>\n([\s\S]*?)\/\/ <\/business-hours-engine>/);
if (!m) {
  fail('BusinessHours.astro has no `// <business-hours-engine>` … `// </business-hours-engine>` block.');
  finish('engine');
}
const js = stripTypeScriptTypes(m[1], { mode: 'strip' });
const mod = await import(`data:text/javascript;base64,${Buffer.from(`${js}\nexport default businessHoursEngine;`).toString('base64')}`);
const engine = mod.default();

// ------------------------------------------------------------- 3. golden table
const CHI = 'America/Chicago';
/** Neutral Grounds, the demo's café. */
const cafe = {
  timeZone: CHI,
  weekly: {
    mon: [['08:00', '12:00'], ['13:00', '17:00']],
    tue: [['08:00', '17:00']],
    wed: [['08:00', '17:00']],
    thu: [['08:00', '17:00']],
    fri: [['08:00', '17:00']],
    sat: [['18:00', '02:00']],
    sun: [],
  },
  exceptions: [
    { date: '2026-11-26', name: 'Thanksgiving', hours: [] },
    { date: '2026-12-24', name: 'Christmas Eve', hours: [['08:00', '13:00']] },
    { month: 12, day: 25, name: 'Christmas Day', hours: [] },
  ],
  closures: [{ from: '2026-07-01', to: '2026-07-14', name: 'Summer break' }],
  seasons: [
    {
      from: '--06-01',
      to: '--08-31',
      name: 'Summer hours',
      weekly: {
        mon: [['07:00', '15:00']],
        tue: [['07:00', '15:00']],
        wed: [['07:00', '15:00']],
        thu: [['07:00', '15:00']],
        fri: [['07:00', '15:00']],
      },
    },
  ],
};
const winter = { ...cafe, closures: [{ from: '2026-12-20', to: '2027-01-04', name: 'Winter break' }] };
const winterRecurring = { ...cafe, closures: [{ from: '--12-20', to: '--01-04', name: 'Winter break' }] };
const springForward = { timeZone: CHI, weekly: { sun: [['02:30', '06:00']] } };
const fallBack = { timeZone: CHI, weekly: { sun: [['01:30', '05:00']] } };
const rollover = { timeZone: CHI, weekly: { fri: [['18:00', '24:00']], sat: [['00:00', '02:00']] } };
const weekly = { timeZone: CHI, weekly: { wed: [['10:00', '12:00']] }, exceptions: [{ date: '2026-09-30', name: 'Staff day', hours: [] }] };
const anchorage = { timeZone: 'America/Anchorage', weekly: { tue: [['08:00', '17:00']], wed: [['08:00', '17:00']] } };

const at = (local, tz = CHI) => engine.instantAt(tz, local);
const U = (y, mo, d, h, mi = 0) => Date.UTC(y, mo - 1, d, h, mi);
const norm = (s) => String(s).replace(/[\u202f\u00a0]/g, ' ');

/** [label, data, now, expected sentence, { locale, hourCycle, visitor, soon, showZone, words }, extra checks] */
const cases = [
  // open
  ['open, more than soonMinutes to close', cafe, at('2026-09-21T10:00'), 'Open · closes at 12:00 PM'],
  ['open, 40 minutes to close', cafe, at('2026-09-21T11:20'), 'Open · closing in 40 minutes'],
  ['open, exactly 60 minutes (singular hour)', cafe, at('2026-09-21T11:00'), 'Open · closing in 1 hour'],
  ['open, 1 minute (singular minute)', cafe, at('2026-09-22T16:59'), 'Open · closing in 1 minute'],
  ['open, 70 minutes with soonMinutes 90', cafe, at('2026-09-21T15:50'), 'Open · closing in 1 hour 10 minutes', { soon: 90 }],
  ['open, 61 minutes with soonMinutes 90 (1 hour 1 minute)', cafe, at('2026-09-21T15:59'), 'Open · closing in 1 hour 1 minute', { soon: 90 }],
  ['open, 100 minutes with soonMinutes 120: clock time from 90 up', cafe, at('2026-09-21T15:20'), 'Open · closes at 5:00 PM', { soon: 120 }],
  ['open, closes after midnight', cafe, at('2026-09-26T19:00'), 'Open · closes at 2:00 AM'],
  ['Saturday range at Sunday 01:00 belongs to Saturday', cafe, at('2026-09-27T01:00'), 'Open · closing in 1 hour', {}, (r) => r.closesAt === U(2026, 9, 27, 7)],
  ['touching ranges merge across midnight', rollover, at('2026-09-25T23:00'), 'Open · closes at 2:00 AM'],
  // closed
  ['closed at lunch, soonMinutes 20: opens later today', cafe, at('2026-09-21T12:30'), 'Closed · opens at 1:00 PM', { soon: 20 }],
  ['closed at lunch, default soonMinutes', cafe, at('2026-09-21T12:30'), 'Closed · opening in 30 minutes'],
  ['closed, opens tomorrow', cafe, at('2026-09-21T18:00'), 'Closed · opens tomorrow at 8:00 AM'],
  ['closed, 15 minutes to open', cafe, at('2026-09-22T07:45'), 'Closed · opening in 15 minutes'],
  ['closed early, opens at 8', cafe, at('2026-09-22T06:00'), 'Closed · opens at 8:00 AM'],
  ['closed Saturday morning, opens this evening', cafe, at('2026-09-26T10:00'), 'Closed · opens at 6:00 PM'],
  ['closed Friday evening, opens tomorrow evening', cafe, at('2026-09-25T18:00'), 'Closed · opens tomorrow at 6:00 PM'],
  ['closed Sunday after the Saturday range', cafe, at('2026-09-27T03:00'), 'Closed · opens tomorrow at 8:00 AM'],
  ['closed, opens another day (Thanksgiving in between)', cafe, at('2026-11-25T18:00'), 'Closed · opens Friday at 8:00 AM'],
  ['closed more than a week: the date is given', weekly, at('2026-09-24T12:00'), 'Closed · opens Wednesday, October 7 at 10:00 AM'],
  // exceptions
  ['closed by exception', cafe, at('2026-11-26T10:00'), 'Closed for Thanksgiving · opens tomorrow at 8:00 AM'],
  ['open on an exception day', cafe, at('2026-12-24T10:00'), 'Open · Christmas Eve hours, closes at 1:00 PM'],
  ['open on an exception day, soon', cafe, at('2026-12-24T12:30'), 'Open · Christmas Eve hours, closing in 30 minutes'],
  ['after exception hours, the recurring Christmas Day is skipped', cafe, at('2026-12-24T14:00'), 'Closed · opens Saturday at 6:00 PM'],
  ['recurring exception, this year', cafe, at('2026-12-25T10:00'), 'Closed for Christmas Day · opens tomorrow at 6:00 PM'],
  ['recurring exception, next year, over a Saturday', cafe, at('2027-12-25T19:00'), 'Closed for Christmas Day · opens Monday at 8:00 AM'],
  // closures and seasons
  ['closed by closure, far from reopening', cafe, at('2026-07-06T10:00'), 'Closed until July 15 (Summer break) · opens Wednesday, July 15 at 7:00 AM'],
  ['closed by closure, reopening this week', cafe, at('2026-07-12T10:00'), 'Closed until July 15 (Summer break) · opens Wednesday at 7:00 AM'],
  ['season hours', cafe, at('2026-08-10T10:00'), 'Open · closes at 3:00 PM'],
  ['season: a day the season leaves out falls back to weekly', cafe, at('2026-08-08T19:00'), 'Open · closes at 2:00 AM'],
  ['closure over New Year, far', winter, at('2026-12-24T10:00'), 'Closed until January 5 (Winter break) · opens Tuesday, January 5 at 8:00 AM'],
  ['closure over New Year, this week', winter, at('2026-12-31T10:00'), 'Closed until January 5 (Winter break) · opens Tuesday at 8:00 AM'],
  ['recurring closure over New Year', winterRecurring, at('2028-01-02T10:00'), 'Closed until January 5 (Winter break) · opens Wednesday at 8:00 AM'],
  // DST
  ['spring forward: 02:30 does not exist, opens at the jump', springForward, U(2026, 3, 8, 7, 59), 'Closed · opening in 1 minute', {}, (r) => r.opensAt === U(2026, 3, 8, 8, 0)],
  ['spring forward: open from 03:00 CDT', springForward, U(2026, 3, 8, 8, 0), 'Open · closes at 6:00 AM'],
  ['fall back: 01:30 happens twice, takes the first', fallBack, U(2026, 11, 1, 6, 0), 'Closed · opening in 30 minutes', {}, (r) => r.opensAt === U(2026, 11, 1, 6, 30)],
  ['fall back: open through the repeated hour', fallBack, U(2026, 11, 1, 7, 0), 'Open · closes at 5:00 AM', {}, (r) => r.closesAt === U(2026, 11, 1, 11, 0)],
  // zones, locales, hour cycles
  ['London visitor of a Chicago business', cafe, at('2026-09-21T10:00'), 'Open · closes at 12:00 PM Central Time', { visitor: 'Europe/London' }],
  ['London visitor: relative words need no zone', cafe, at('2026-09-22T07:45'), 'Closed · opening in 15 minutes', { visitor: 'Europe/London' }],
  ['London visitor, showZone never', cafe, at('2026-09-21T10:00'), 'Open · closes at 12:00 PM', { visitor: 'Europe/London', showZone: 'never' }],
  ['same zone, showZone always', cafe, at('2026-09-21T10:00'), 'Open · closes at 12:00 PM Central Time', { showZone: 'always' }],
  ['Anchorage counter read from Chicago', anchorage, at('2026-09-22T06:00', 'America/Anchorage'), 'Closed · opens at 8:00 AM Alaska Time', { visitor: CHI }],
  ['de-DE day names and clock', cafe, at('2026-11-25T18:00'), 'Closed · opens Freitag at 8:00', { locale: 'de-DE' }],
  ['en-US with h23', cafe, at('2026-09-21T10:00'), 'Open · closes at 12:00', { hourCycle: 'h23' }],
  ['words override', cafe, at('2026-09-21T10:00'), 'Come in · we close at 12:00 PM', { words: { open: 'Come in', closesAt: 'we close at {time}' } }],
  // no state machine
  ['always open', { timeZone: CHI, weekly: {}, alwaysOpen: true }, at('2026-09-21T03:00'), 'Open 24 hours', {}, (r) => r.state === 'open'],
  ['by appointment', { ...cafe, byAppointment: true }, at('2026-09-21T10:00'), 'By appointment', {}, (r) => r.state === 'appointment'],
  ['no opening within 60 days', { timeZone: CHI, weekly: {} }, at('2026-09-21T10:00'), 'Closed', {}, (r) => r.opensAt === undefined],
];

for (const [label, data, now, expected, o = {}, extra] of cases) {
  let r;
  try {
    r = engine.stateAt(data, now, o.locale ?? 'en-US', o.hourCycle, {
      soonMinutes: o.soon,
      showZone: o.showZone,
      words: o.words,
      visitorTimeZone: o.visitor ?? data.timeZone,
    });
  } catch (e) {
    fail(`${label}: threw ${e.stack}`);
    continue;
  }
  if (norm(r.sentence) !== expected) fail(`${label}: expected "${expected}", got "${norm(r.sentence)}".`);
  if (extra && !extra(r)) fail(`${label}: the instants behind the sentence are wrong (${JSON.stringify({ opensAt: r.opensAt, closesAt: r.closesAt, state: r.state })}).`);
}

// The rest of the result.
{
  const r = engine.stateAt(cafe, at('2026-09-21T10:00'), 'en-US', undefined, { visitorTimeZone: CHI, upcomingDays: 70 });
  if (r.state !== 'open' || r.closesAt !== U(2026, 9, 21, 17)) fail(`state/closesAt wrong for Monday 10:00: ${r.state} ${r.closesAt}.`);
  if (r.today.weekday !== 'mon' || r.today.date !== '2026-09-21') fail(`today is ${JSON.stringify(r.today)}.`);
  if (JSON.stringify(r.todayRanges.map((x) => [x.opens, x.closes])) !== '[["08:00","12:00"],["13:00","17:00"]]') fail(`todayRanges: ${JSON.stringify(r.todayRanges)}.`);
  const keys = r.upcoming.map((u) => u.key).join(', ');
  if (keys !== 'exception:2026-11-26') fail(`upcoming within 70 days of 2026-09-21: expected Thanksgiving only, got "${keys}".`);
  const inClosure = engine.stateAt(cafe, at('2026-07-06T10:00'), 'en-US', undefined, { visitorTimeZone: CHI });
  if (inClosure.upcoming[0]?.from !== '2026-07-01' || inClosure.upcoming[0]?.to !== '2026-07-14') {
    fail(`an ongoing closure should be listed with its full extent: ${JSON.stringify(inClosure.upcoming[0])}.`);
  }
  if (inClosure.today.season !== 0) fail('2026-07-06 is inside the summer season.');
}
for (const bad of [
  { timeZone: 'Mars/Olympus', weekly: {} },
  { timeZone: CHI, weekly: { mon: [['8am', '5pm']] } },
  { timeZone: CHI, weekly: {}, closures: [{ from: '2026-07-14', to: '2026-07-01', name: 'x' }] },
  { timeZone: CHI, weekly: {}, exceptions: [{ name: 'x', hours: [] }] },
]) {
  if (!engine.validate(bad).length) fail(`validate() accepted ${JSON.stringify(bad)}.`);
}
if (engine.validate(cafe).length) fail(`validate() rejected the demo café: ${engine.validate(cafe).join(' ')}`);
finish('golden table');

// ------------------------------------------------------------------ 4. JSON-LD
{
  const ld = engine.jsonLd(cafe, at('2026-09-23T12:00'), { id: '#neutral-grounds' });
  const specs = ld.openingHoursSpecification;
  const find = (p) => specs.find(p);
  if (ld['@id'] !== '#neutral-grounds' || ld['@type'] !== 'LocalBusiness' || ld['@context'] !== 'https://schema.org') fail(`JSON-LD header: ${JSON.stringify({ ...ld, openingHoursSpecification: undefined })}.`);
  if (specs.some((s) => s['@type'] !== 'OpeningHoursSpecification')) fail('every spec needs @type OpeningHoursSpecification.');
  const weekday = find((s) => !s.validFrom && s.opens === '08:00' && s.closes === '17:00');
  if (JSON.stringify(weekday?.dayOfWeek) !== '["Tuesday","Wednesday","Thursday","Friday"]') fail(`Tue–Fri spec: ${JSON.stringify(weekday)}.`);
  if (!find((s) => !s.validFrom && s.opens === '08:00' && s.closes === '12:00' && s.dayOfWeek.join() === 'Monday')) fail('Monday morning shift missing.');
  if (!find((s) => !s.validFrom && s.opens === '13:00' && s.closes === '17:00' && s.dayOfWeek.join() === 'Monday')) fail('Monday afternoon shift missing (split shifts are separate specs).');
  if (!find((s) => !s.validFrom && s.opens === '18:00' && s.closes === '02:00' && s.dayOfWeek.join() === 'Saturday')) fail('Saturday past midnight should be opens 18:00, closes 02:00.');
  if (specs.some((s) => !s.validFrom && s.dayOfWeek?.includes('Sunday'))) fail('a closed weekday gets no weekly spec.');
  if (!find((s) => s.validFrom === '2026-11-26' && s.validThrough === '2026-11-26' && s.opens === '00:00' && s.closes === '00:00')) fail('Thanksgiving should be 00:00–00:00 on 2026-11-26.');
  if (!find((s) => s.validFrom === '2026-12-24' && s.opens === '08:00' && s.closes === '13:00')) fail('Christmas Eve hours missing.');
  for (const y of [2026, 2027]) if (!find((s) => s.validFrom === `${y}-12-25` && s.closes === '00:00')) fail(`recurring Christmas Day ${y} missing.`);
  if (find((s) => s.validFrom === '2026-07-01')) fail('a closure that ended before the build date is still emitted.');
  if (!find((s) => s.validFrom === '2027-06-01' && s.validThrough === '2027-08-31' && s.opens === '07:00' && s.dayOfWeek.length === 5)) fail('next year\'s summer season missing.');
  if (find((s) => s.validFrom === '2026-06-01')) fail('this year\'s season ended before the build date and is still emitted.');
  const bad = specs.find((s) => !/^\d{2}:\d{2}$/.test(s.opens) || !/^\d{2}:\d{2}$/.test(s.closes) || (s.validFrom && !/^\d{4}-\d{2}-\d{2}$/.test(s.validFrom)));
  if (bad) fail(`malformed spec ${JSON.stringify(bad)}.`);
  const always = engine.jsonLd({ timeZone: CHI, weekly: {}, alwaysOpen: true }, 0, { id: '#x', type: 'CafeOrCoffeeShop' });
  if (always['@type'] !== 'CafeOrCoffeeShop' || always.openingHoursSpecification[0].closes !== '23:59' || always.openingHoursSpecification[0].dayOfWeek.length !== 7) fail('always open should be one spec, all days, 00:00–23:59.');
}
finish('JSON-LD');

// ------------------------------------------------------- 5. the built demo page
const page = join(root, 'dist/business-hours/index.html');
if (!existsSync(page)) {
  fail(`${page} is missing; run astro build (check-catalog.mjs does) first.`);
  finish('render');
}
const html = readFileSync(page, 'utf8');
const roots = [...html.matchAll(/<div[^>]*\sdata-bh(?=[\s>])[^>]*>/g)];
if (roots.length < 2) fail(`the demo page should render two elements (the café and the Anchorage counter); found ${roots.length}.`);
if (!/<table class="bh__table[^"]*"[^>]*>\s*<caption[^>]*>[^<]*Opening hours/.test(html)) fail('the demo page has no hours <table> with a caption.');
if (!/<th scope="col"/.test(html) || !/<th scope="row"/.test(html)) fail('the hours table needs scoped column and row headers.');
if (!/data-bh-today hidden[^>]*>\s*\(today\)/.test(html)) fail('each row should carry a hidden "(today)" marker for the script to reveal.');
if (/data-now=/.test(html)) fail('the demo page ships a frozen clock (data-now); the demo must start live.');
/** Each element's own markup: from its root <div data-bh> to the matching </div>. */
const elements = roots.map((r) => {
  let depth = 0;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = r.index;
  for (let t; (t = re.exec(html)); ) {
    depth += t[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(r.index, re.lastIndex);
  }
  return html.slice(r.index);
});
// Everything the element renders, minus the parts that state dated or weekly facts.
for (const el of elements) {
  const rest = el
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<table[\s\S]*?<\/table>/g, '')
    .replace(/<div[^>]*data-bh-upcoming-list[\s\S]*?<\/ul>/g, '')
    .replace(/<div[^>]*data-bh-when="(open|closed)"[^>]*>[\s\S]*?<\/div>/g, '');
  const claim = rest.replace(/<[^>]+>/g, ' ').match(/\b(Open|Closed)\b[^<]{0,40}/);
  if (claim) fail(`the static HTML claims a state outside the table, the dated list and the slots: "${claim[0].trim()}".`);
}
for (const live of html.matchAll(/<p[^>]*data-bh-live[^>]*>([\s\S]*?)<\/p>/g)) {
  if (live[1].trim()) fail(`the live region is not empty in the static HTML: "${live[1].trim()}".`);
  if (!/aria-live="polite"/.test(live[0])) fail('the live region needs aria-live="polite".');
}
if ((html.match(/data-bh-when="open"/g) || []).length < 1 || (html.match(/data-bh-when="closed"/g) || []).length < 1) fail('both the open and the closed slot must be in the static HTML.');
// The shipped copy of the engine is the checked copy.
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((s) => s[1]).filter((s) => s.includes('function businessHoursEngine'));
if (scripts.length !== 1) fail(`expected the engine script once on the page, found ${scripts.length}.`);
else {
  const src = scripts[0].match(/\((function businessHoursEngine\(\)[\s\S]*\})\)\(\)\);\}/);
  if (!src) fail('could not find businessHoursEngine inside the inline script.');
  else {
    const shipped = new Function(`return (${src[1]})`)()();
    const a = shipped.stateAt(cafe, at('2026-11-26T10:00'), 'en-US', undefined, { visitorTimeZone: CHI }).sentence;
    const b = engine.stateAt(cafe, at('2026-11-26T10:00'), 'en-US', undefined, { visitorTimeZone: CHI }).sentence;
    if (a !== b) fail(`the engine in the built page answers "${a}", the checked source "${b}".`);
  }
}
finish('render');

console.log(`check-business-hours ok: ${cases.length} golden cases, JSON-LD shape, static render.`);
