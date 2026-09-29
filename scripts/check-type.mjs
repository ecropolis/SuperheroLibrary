#!/usr/bin/env node
/**
 * The house font set and its pairings in src/data/type.ts -- one file in several repos.
 *
 * Downstream copies (the portal's src/brand/type.data.ts, the site's vendored
 * copy) are byte-identical below the file header and pin the SHA-256 of that
 * body. This check holds the data's own rules and prints the hash those pins
 * record:
 *
 *   - every FontKey in styles.ts resolves through `familyFor` to a family of that class,
 *     and the file's written-out FontKey and StyleId unions match styles.ts exactly
 *   - family and pairing ids are unique, slug-shaped and listed in the same order
 *     as their id arrays; twelve pairings, one of them "System" at zero bytes
 *   - every web family is a Fontsource package (`@fontsource-variable/*` when
 *     variable, `@fontsource/*` when not) under OFL-1.1 or Apache-2.0 and nothing else,
 *     with its licence URL, designer, 1-4 weights, fallback and metrics
 *   - the fallback's first face is one the metrics were computed against
 *   - every pairing names real families, and together they weigh at most TYPE_BUDGET_KB
 *   - the heading weight is one of the heading family's weights; body text is at 400
 *   - every family is used by a pairing, and every style board is served by one
 *   - a pairing serves a board only if its families match the board's heading and body
 *     classes, and its label class when the board names one, so `type.note` stays true
 *   - the file imports nothing (framework-free) and its header carries the pin rule
 *
 * When you change the body, the hash changes: downstream copies must take the
 * file again and move their pins in the same change, or their checks fail.
 *
 *   node --experimental-strip-types scripts/check-type.mjs
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(root, 'src/data/type.ts');
const STYLES = join(root, 'src/data/styles.ts');

const PIN_RULE = 'Only this header may differ; below it the file is one file in every repo.';
const HEADER_END = '\n */\n';
const LICENCES = ['OFL-1.1', 'Apache-2.0'];
// The local faces the metrics are computed against (Capsize's system-font metrics).
const METRIC_FACES = ['Arial', 'Times New Roman', 'Courier New'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PERCENT = /^\d+(\.\d+)?%$/;

const failures = [];
const fail = (msg) => failures.push(msg);

const src = readFileSync(FILE, 'utf8');
const at = src.indexOf(HEADER_END);
if (!src.startsWith('/**') || at === -1) fail('type.ts must open with a block-comment header: the pinned hash is taken below it');
const header = at === -1 ? '' : src.slice(0, at + HEADER_END.length);
const body = at === -1 ? src : src.slice(at + HEADER_END.length);
if (!header.replace(/\n \* ?/g, ' ').includes(PIN_RULE)) fail(`the header must say "${PIN_RULE}"`);
if (/^\s*import\s/m.test(body) || /\brequire\(/.test(body)) fail('type.ts must import nothing: downstream copies it as plain data');

const T = await import(pathToFileURL(FILE).href);
const S = await import(pathToFileURL(STYLES).href);
const fontKeys = Object.keys(S.FONT_STACKS);
const boards = S.STYLE_BOARDS;
const families = T.TYPE_FAMILIES;
const pairings = T.TYPE_PAIRINGS;

// The file's written-out unions match styles.ts.
const unionOf = (name) => {
  const m = body.match(new RegExp(`type ${name} =([^;]+);`));
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
};
for (const [name, want] of [['FontKey', fontKeys], ['StyleId', [...S.STYLE_IDS]]]) {
  const got = unionOf(name);
  if (JSON.stringify(got) !== JSON.stringify(want)) fail(`the ${name} union in type.ts must list, in order, ${want.join(', ')}; it lists ${got.join(', ') || 'nothing'}`);
}

const short = (what, s, max) => {
  if (typeof s !== 'string' || !s.trim()) fail(`${what} is empty`);
  else if (s.length > max) fail(`${what} is ${s.length} characters; at most ${max}`);
};
const idsOk = (what, list, declared) => {
  const ids = list.map((x) => x.id);
  if (new Set(ids).size !== ids.length) fail(`${what} ids repeat: ${ids.join(', ')}`);
  for (const id of ids) if (!SLUG.test(id)) fail(`${what} id "${id}" is not slug-shaped`);
  if (JSON.stringify([...declared]) !== JSON.stringify(ids)) fail(`${what}: the id array and the list name different ids or orders`);
  return ids;
};

// Families
const fids = idsOk('family', families, T.TYPE_FAMILY_IDS);
const byId = new Map(families.map((f) => [f.id, f]));
for (const f of families) {
  const w = `family ${f.id}`;
  short(`${w}: name`, f.name, 40);
  short(`${w}: designer`, f.designer, 120);
  short(`${w}: fallback`, f.fallback, 200);
  if (!fontKeys.includes(f.class)) fail(`${w}: class "${f.class}" is not a FONT_STACKS key`);
  const weights = f.weights ?? [];
  if (weights.length < 1 || weights.length > 4) fail(`${w}: ${weights.length} weights; want one to four`);
  for (const n of weights) if (!Number.isInteger(n) || n < 100 || n > 900 || n % 100) fail(`${w}: weight ${n} is not one of 100..900`);
  if (JSON.stringify([...weights]) !== JSON.stringify([...weights].sort((a, b) => a - b))) fail(`${w}: weights must be ascending`);

  if (f.source === 'system') {
    if (f.package !== null || f.licence !== null || f.licenceUrl !== null) fail(`${w}: a system family has no package, licence or licence URL`);
    if (f.kb !== 0) fail(`${w}: a system family weighs 0 KB, not ${f.kb}`);
    if (f.metrics) fail(`${w}: a system family has nothing to swap from, so no metrics`);
    continue;
  }
  if (f.source !== 'fontsource') { fail(`${w}: source "${f.source}"; want fontsource or system`); continue; }
  if (!LICENCES.includes(f.licence)) fail(`${w}: licence "${f.licence}"; only ${LICENCES.join(' or ')}`);
  const scope = f.variable ? '@fontsource-variable/' : '@fontsource/';
  if (typeof f.package !== 'string' || !f.package.startsWith(scope) || !SLUG.test(f.package.slice(scope.length))) {
    fail(`${w}: package "${f.package}"; a ${f.variable ? 'variable' : 'static'} family comes from ${scope}<slug>`);
  }
  let url = null;
  try { url = new URL(f.licenceUrl); } catch {}
  if (!url || url.protocol !== 'https:' || !f.licenceUrl.includes(f.package)) fail(`${w}: licenceUrl "${f.licenceUrl}" must be an https URL of the package's own licence`);
  if (f.variable && !(f.axes ?? []).includes('wght')) fail(`${w}: a variable family lists its axes, wght among them`);
  if (!f.variable && f.axes !== undefined) fail(`${w}: a static family has no axes`);
  if (typeof f.kb !== 'number' || !(f.kb > 0) || Math.round(f.kb * 10) !== f.kb * 10) fail(`${w}: kb "${f.kb}" must be a positive number to one decimal`);
  const first = f.fallback.split(',')[0].trim().replace(/^'|'$/g, '');
  if (!METRIC_FACES.includes(first)) fail(`${w}: the fallback must start with a face the metrics are computed against (${METRIC_FACES.join(', ')}); it starts with ${first}`);
  if (!f.metrics) fail(`${w}: no metrics for the fallback @font-face`);
  for (const [k, v] of Object.entries(f.metrics ?? {})) if (!PERCENT.test(v)) fail(`${w}: metrics.${k} "${v}" is not a percentage`);
}

// Every board class resolves.
for (const k of fontKeys) {
  const f = T.familyFor(k);
  if (!f) fail(`FontKey "${k}" resolves to no family`);
  else if (f.class !== k) fail(`familyFor("${k}") gives ${f.id}, of class ${f.class}`);
}

// Pairings
if (pairings.length !== 12) fail(`twelve pairings, not ${pairings.length}`);
idsOk('pairing', pairings, T.TYPE_PAIRING_IDS);
const used = new Set();
const served = new Map(boards.map((b) => [b.id, []]));
const report = [];
for (const p of pairings) {
  const w = `pairing ${p.id}`;
  short(`${w}: name`, p.name, 40);
  short(`${w}: feel`, p.feel, 120);
  const fam = {};
  for (const role of ['heading', 'body', 'label']) {
    if (p[role] === undefined && role === 'label') continue;
    const f = byId.get(p[role]);
    if (!f) { fail(`${w}: ${role} "${p[role]}" is not a family`); continue; }
    fam[role] = f;
    used.add(f.id);
  }
  const h = p.headings ?? {};
  if (!(h.scale >= 0.5 && h.scale <= 2)) fail(`${w}: headings.scale ${h.scale}; want 0.5 to 2`);
  if (fam.heading && !fam.heading.weights.includes(h.weight)) fail(`${w}: headings.weight ${h.weight} is not one of ${fam.heading.id}'s weights (${fam.heading.weights.join(', ')})`);
  if (!/^(0|-?\d*\.?\d+em)$/.test(h.tracking ?? '')) fail(`${w}: headings.tracking "${h.tracking}"; want 0 or a length in em`);
  if (typeof h.upper !== 'boolean') fail(`${w}: headings.upper must be true or false`);
  if (!(h.lineHeight >= 0.8 && h.lineHeight <= 1.6)) fail(`${w}: headings.lineHeight ${h.lineHeight}; want 0.8 to 1.6`);
  const b = p.bodySettings ?? {};
  if (!/^\d*\.?\d+rem$/.test(b.size ?? '')) fail(`${w}: bodySettings.size "${b.size}"; want rem`);
  if (!(b.lineHeight >= 1.3 && b.lineHeight <= 1.9)) fail(`${w}: bodySettings.lineHeight ${b.lineHeight}; want 1.3 to 1.9`);
  const measure = /^(\d+)ch$/.exec(b.measure ?? '');
  if (!measure || +measure[1] < 45 || +measure[1] > 80) fail(`${w}: bodySettings.measure "${b.measure}"; want 45ch to 80ch`);
  if (fam.body && !fam.body.weights.includes(400)) fail(`${w}: body text is set at 400, which ${fam.body.id} does not list`);
  if (!Array.isArray(p.suits) || p.suits.length < 1 || p.suits.length > 4) fail(`${w}: suits names one to four businesses`);
  for (const s of p.suits ?? []) short(`${w}: suits entry`, s, 60);

  const kb = T.pairingKb(p);
  if (kb > T.TYPE_BUDGET_KB) fail(`${w}: its families weigh ${kb} KB; the budget is ${T.TYPE_BUDGET_KB}`);

  if (!p.pairsWith?.length) fail(`${w}: pairsWith names no board`);
  for (const id of p.pairsWith ?? []) {
    const board = boards.find((x) => x.id === id);
    if (!board) { fail(`${w}: pairsWith "${id}" is not a board`); continue; }
    served.get(id).push(p.id);
    const t = board.type;
    for (const role of ['heading', 'body', 'label']) {
      if (role === 'label' && t.label === undefined) continue;
      const got = fam[role]?.class;
      if (got !== t[role]) fail(`${w}: serves ${id}, whose ${role} is ${t[role]} ("${t.note}"), but its ${role} is ${got ?? 'missing'}`);
    }
  }
  report.push(`${p.id} ${kb}KB`);
}
for (const id of fids) if (!used.has(id)) fail(`family ${id} is in no pairing: drop it or pair it`);
for (const [id, ps] of served) if (!ps.length) fail(`board ${id} is served by no pairing`);
const system = pairings.find((p) => p.id === 'system');
if (!system || T.pairingKb(system) !== 0) fail('the "system" pairing must be on the list, at zero bytes');

// Constants and helpers
for (const [k, v] of [['TYPE_PICKS_MAX', 2], ['TYPE_BUDGET_KB', 120]]) {
  if (T[k] !== v) fail(`${k} is ${T[k]}; want ${v}`);
}
if (T.pairingById('nope') !== null || T.pairingById(pairings[0]?.id) !== pairings[0]) fail('pairingById must find a pairing by id and give null for anything else');
if (T.isPairingId('nope') || !T.isPairingId(pairings[0]?.id)) fail('isPairingId must accept exactly the pairing ids');

if (failures.length) {
  console.error('check-type failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
const sha = createHash('sha256').update(body).digest('hex');
const licences = LICENCES.map((l) => `${families.filter((f) => f.licence === l).length} ${l}`).join(', ');
console.log(`check-type: ${families.length} families (${licences}, 1 system), ${pairings.length} pairings: ${report.join(', ')}`);
console.log(`check-type: body SHA-256 ${sha}  (downstream pins record this)`);
