#!/usr/bin/env node
/**
 * The colour palettes in src/data/palettes.ts -- one file in three repos.
 *
 * The portal (src/brand/palettes.data.ts) and the console
 * (src/domain/palettes.data.ts) keep copies that are byte-identical below the
 * file header, and each pins the SHA-256 of that body. This check holds the
 * data's own rules and prints the hash those pins record:
 *
 *   - twelve palettes, unique ids, in order: each direction's original, then its sibling
 *   - the six originals keep the portal's slugs, names and `colors` hexes exactly
 *   - every hex is lowercase #rrggbb; seven roles in order; roles agree with `colors`
 *   - contrast is measured here, independently of the file, and must match `contrast`
 *   - every new palette passes every floor; an original under a floor must be one
 *     of KNOWN_FAILS below (measured, reported, never nudged) -- and nothing else fails
 *   - `pairsWith` names style boards from styles.ts, and the file's own StyleId
 *     union lists exactly STYLE_IDS
 *   - mood at most 120 characters, culture at most 300, one to six `suits`
 *   - `demo.href` is https when present
 *   - the file imports nothing (framework-free) and its header carries the pin rule
 *
 * When you change the body, the hash changes: the portal and the console must
 * take the file again and move their pins in the same change, or their checks fail.
 *
 *   node --experimental-strip-types scripts/check-palettes.mjs
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(root, 'src/data/palettes.ts');

const PIN_RULE = 'Only this header may differ; below it the file is one file in three repos.';
// The header is the opening block comment; the body is everything after its close.
const HEADER_END = '\n */\n';

// The portal's six as they were when they moved here (SuperheroPortal src/brand/palettes.ts).
// Their hexes are clients' brand guides: they do not change.
const ORIGINALS = {
  'classic-professional': { name: 'Classic professional', colors: { primary: '#1f3a5f', secondary: '#4a6fa5', accent: '#c9a227', background: '#f7f9fc', text: '#1c2733' } },
  'warm-earthy': { name: 'Warm & earthy', colors: { primary: '#9c4a2f', secondary: '#6f7d4d', accent: '#e0a458', background: '#faf6f0', text: '#33302b' } },
  'bold-modern': { name: 'Bold & modern', colors: { primary: '#6d28d9', secondary: '#111827', accent: '#f43f5e', background: '#ffffff', text: '#1f2937' } },
  'fresh-natural': { name: 'Fresh & natural', colors: { primary: '#2f7d47', secondary: '#7fb069', accent: '#f4a259', background: '#f6faf4', text: '#24382a' } },
  'elegant-neutral': { name: 'Elegant neutrals', colors: { primary: '#423e37', secondary: '#8a817c', accent: '#b08d57', background: '#faf9f7', text: '#2b2926' } },
  'vibrant-playful': { name: 'Vibrant & playful', colors: { primary: '#e63946', secondary: '#457b9d', accent: '#ffb703', background: '#fffdf7', text: '#22223b' } },
};
const SIBLINGS = {
  'classic-professional': 'slate-and-copper',
  'warm-earthy': 'terracotta-and-sage',
  'bold-modern': 'ink-and-coral',
  'fresh-natural': 'forest-and-cream',
  'elegant-neutral': 'stone-and-charcoal',
  'vibrant-playful': 'sunshine-and-teal',
};
const IDS = Object.entries(SIBLINGS).flat();
const ROLES = ['background', 'surface', 'ink', 'muted', 'primary', 'on-primary', 'accent'];
const COLOR_KEYS = ['primary', 'secondary', 'accent', 'background', 'text'];
// role -> the `colors` key it must equal
const SAME = { background: 'background', ink: 'text', primary: 'primary', accent: 'accent' };
const FLOORS = [
  ['ink', 'background', 4.5],
  ['on-primary', 'primary', 4.5],
  ['accent', 'background', 3],
  ['muted', 'background', 4.5],
];
// The originals' measured failures, exactly. A new failure, or one of these
// starting to pass, fails the check so this list and the PR stay honest.
const KNOWN_FAILS = new Set([
  'classic-professional: accent on background',
  'warm-earthy: accent on background',
  'fresh-natural: accent on background',
  'elegant-neutral: accent on background',
  'vibrant-playful: on-primary on primary',
  'vibrant-playful: accent on background',
]);

const failures = [];
const fail = (msg) => failures.push(msg);

const src = readFileSync(FILE, 'utf8');
const at = src.indexOf(HEADER_END);
if (!src.startsWith('/**') || at === -1) fail('palettes.ts must open with a block-comment header: the pinned hash is taken below it');
const header = at === -1 ? '' : src.slice(0, at + HEADER_END.length);
const body = at === -1 ? src : src.slice(at + HEADER_END.length);
if (!header.replace(/\n \* ?/g, ' ').includes(PIN_RULE)) fail(`the header must say "${PIN_RULE}"`);
for (const copy of ['src/brand/palettes.data.ts', 'src/domain/palettes.data.ts']) {
  if (!header.includes(copy)) fail(`the header must name the downstream copy ${copy}`);
}
if (/^\s*import\s/m.test(body) || /\brequire\(/.test(body)) fail('palettes.ts must import nothing: the portal and console copy it as plain data');

const P = await import(pathToFileURL(FILE).href);
const S = await import(pathToFileURL(join(root, 'src/data/styles.ts')).href);
const palettes = P.PALETTES;

// Our own WCAG 2.x measurement, so the file's helper is checked rather than trusted.
const lin = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// Ids and order
const ids = palettes.map((p) => p.id);
if (new Set(ids).size !== ids.length) fail(`palette ids repeat: ${ids.join(', ')}`);
if (JSON.stringify(ids) !== JSON.stringify(IDS)) fail(`palette ids must be, in order, ${IDS.join(', ')}; they are ${ids.join(', ')}`);
if (JSON.stringify([...P.PALETTE_IDS]) !== JSON.stringify(ids)) fail('PALETTE_IDS and PALETTES list different ids or orders');
if (JSON.stringify([...P.DIRECTION_IDS]) !== JSON.stringify(Object.keys(ORIGINALS))) fail(`DIRECTION_IDS must be ${Object.keys(ORIGINALS).join(', ')}`);
if (JSON.stringify([...P.PALETTE_ROLES]) !== JSON.stringify(ROLES)) fail(`PALETTE_ROLES must be ${ROLES.join(', ')}`);

// The file's written-out StyleId union matches styles.ts.
const union = body.match(/type StyleId =([^;]+);/);
const unionIds = union ? [...union[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
if (JSON.stringify(unionIds) !== JSON.stringify([...S.STYLE_IDS])) fail(`the StyleId union in palettes.ts must list, in order, ${S.STYLE_IDS.join(', ')}; it lists ${unionIds.join(', ') || 'nothing'}`);

const short = (what, s, max) => {
  if (typeof s !== 'string' || !s.trim()) fail(`${what} is empty`);
  else if (s.length > max) fail(`${what} is ${s.length} characters; at most ${max}`);
};
const hexOk = (h) => /^#[0-9a-f]{6}$/.test(h);

const reportFails = [];
for (const p of palettes) {
  const original = ORIGINALS[p.id];
  const direction = original ? p.id : Object.keys(SIBLINGS).find((d) => SIBLINGS[d] === p.id);
  if (p.direction !== direction) fail(`${p.id}: direction is "${p.direction}"; want "${direction}"`);

  short(`${p.id}: name`, p.name, 40);
  short(`${p.id}: mood`, p.mood, 120);
  short(`${p.id}: culture`, p.culture, 300);
  if (!Array.isArray(p.suits) || p.suits.length < 1 || p.suits.length > 6) fail(`${p.id}: suits must name one to six, not ${p.suits?.length}`);
  for (const s of p.suits ?? []) short(`${p.id}: suits entry`, s, 40);
  if (!p.pairsWith?.length) fail(`${p.id}: pairsWith names no style board`);
  for (const s of p.pairsWith ?? []) if (!S.STYLE_IDS.includes(s)) fail(`${p.id}: pairsWith "${s}" is not a style board`);
  if (p.demo !== undefined) {
    short(`${p.id}: demo.label`, p.demo.label, 40);
    let url = null;
    try { url = new URL(p.demo.href); } catch {}
    if (!url || url.protocol !== 'https:') fail(`${p.id}: demo.href "${p.demo.href}" must be an https URL`);
  }

  // colors: the brand guide's shape
  if (JSON.stringify(Object.keys(p.colors ?? {})) !== JSON.stringify(COLOR_KEYS)) fail(`${p.id}: colors must have ${COLOR_KEYS.join(', ')} in that order`);
  for (const k of COLOR_KEYS) if (!hexOk(p.colors?.[k])) fail(`${p.id}: colors.${k} is "${p.colors?.[k]}"; want lowercase #rrggbb`);
  if (original) {
    if (p.name !== original.name) fail(`${p.id}: name is "${p.name}"; the portal calls it "${original.name}"`);
    for (const k of COLOR_KEYS) {
      if (p.colors[k] !== original.colors[k]) fail(`${p.id}: colors.${k} is ${p.colors[k]}; the original is ${original.colors[k]} and must not change`);
    }
  }

  // roles: the hero's shape
  const names = (p.roles ?? []).map((r) => r.name);
  if (JSON.stringify(names) !== JSON.stringify(ROLES)) fail(`${p.id}: roles must be ${ROLES.join(', ')} in that order; they are ${names.join(', ')}`);
  const role = Object.fromEntries((p.roles ?? []).map((r) => [r.name, r.hex]));
  for (const r of p.roles ?? []) if (!hexOk(r.hex)) fail(`${p.id}: role ${r.name} is "${r.hex}"; want lowercase #rrggbb`);
  for (const [r, k] of Object.entries(SAME)) {
    if (role[r] !== p.colors?.[k]) fail(`${p.id}: role ${r} is ${role[r]} but colors.${k} is ${p.colors?.[k]}; they must be the same hex`);
  }

  // contrast: measured, never typed
  const measured = FLOORS.map(([fg, bg, floor]) => {
    const r = Math.floor(ratio(role[fg], role[bg]) * 100) / 100;
    return { pair: `${fg} on ${bg}`, ratio: r, passes: r < floor ? 'fail' : r >= 4.5 ? 'AA' : 'AA-large' };
  });
  if (JSON.stringify(p.contrast) !== JSON.stringify(measured)) {
    fail(`${p.id}: contrast ${JSON.stringify(p.contrast)} does not match the measurement ${JSON.stringify(measured)}`);
  }
  for (const m of measured) {
    if (m.passes !== 'fail') continue;
    const key = `${p.id}: ${m.pair}`;
    if (!original) fail(`${key} is ${m.ratio}:1, under its floor; adjust the new palette's hexes`);
    else if (!KNOWN_FAILS.has(key)) fail(`${key} is ${m.ratio}:1, under its floor, and is not a known failure`);
    else reportFails.push(`${key} ${m.ratio}:1`);
  }
}
const reported = new Set(reportFails.map((f) => f.replace(/ [\d.]+:1$/, '')));
for (const k of KNOWN_FAILS) if (!reported.has(k)) fail(`KNOWN_FAILS lists "${k}" but it no longer fails; take it out`);

// Helpers and constants
if (P.PALETTE_PICKS_MAX !== 2) fail(`PALETTE_PICKS_MAX is ${P.PALETTE_PICKS_MAX}; the portal and console both enforce 2`);
if (P.paletteById('sunshine-and-teal')?.id !== 'sunshine-and-teal') fail('paletteById does not find a known id');
if (P.paletteById('nope') !== null || P.paletteById(undefined) !== null) fail('paletteById must return null for anything not a palette id');
if (!P.isPaletteId('slate-and-copper') || P.isPaletteId('slate') || P.isPaletteId(3)) fail('isPaletteId accepts or refuses the wrong things');
if (Math.abs(P.contrastRatio('#000000', '#ffffff') - 21) > 1e-9) fail('contrastRatio(black, white) must be 21');

if (failures.length) {
  console.error('check-palettes failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
const sha = createHash('sha256').update(body).digest('hex');
console.log(`check-palettes: ${palettes.length} palettes in ${P.DIRECTION_IDS.length} directions, ${palettes.filter((p) => p.demo).length} with a demo`);
if (reportFails.length) {
  console.log(`check-palettes: ${reportFails.length} known failures in the originals (measured, shown as "fail", hexes unchanged):`);
  for (const f of reportFails) console.log(`  - ${f}`);
}
console.log(`check-palettes: body SHA-256 ${sha}  (the portal's and console's pins record this)`);
