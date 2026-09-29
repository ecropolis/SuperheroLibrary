#!/usr/bin/env node
/**
 * The style boards and flavours in src/data/styles.ts -- one file in three repos.
 *
 * The portal (src/styles/boards.data.ts) and the console
 * (src/domain/styleBoards.data.ts) keep copies that are byte-identical below
 * the file header, and each pins the SHA-256 of that body. This check holds
 * the data's own rules and prints the hash those pins record:
 *
 *   - ten boards, unique ids, in the order clients see them
 *   - sixteen flavours, unique ids
 *   - every flavour's `pairsWith` names a board
 *   - every palette hex is lowercase #rrggbb, four roles in order
 *   - every font key is one of FONT_STACKS
 *   - labels (board, word, flavour, demo) at most 40 characters; a board's feel at most 120
 *   - `demo.href` is https when present
 *   - the file imports nothing (framework-free) and its header carries the pin rule
 *
 * When you change the body, the hash changes: the portal and the console must
 * take the file again and move their pins in the same change, or their checks fail.
 *
 *   node --experimental-strip-types scripts/check-styles.mjs
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(root, 'src/data/styles.ts');

const IDS = ['high-tech', 'minimal', 'classic', 'natural', 'luxurious', 'playful', 'childlike', 'retro', 'bold', 'handcrafted'];
const ROLES = ['ground', 'ink', 'accent', 'surface'];
const PIN_RULE = 'Only this header may differ; below it the file is one file in three repos.';
// The header is the opening block comment; the body is everything after its close.
const HEADER_END = '\n */\n';

const failures = [];
const fail = (msg) => failures.push(msg);

const src = readFileSync(FILE, 'utf8');
const at = src.indexOf(HEADER_END);
if (!src.startsWith('/**') || at === -1) fail('styles.ts must open with a block-comment header: the pinned hash is taken below it');
const header = at === -1 ? '' : src.slice(0, at + HEADER_END.length);
const body = at === -1 ? src : src.slice(at + HEADER_END.length);
if (!header.replace(/\n \* ?/g, ' ').includes(PIN_RULE)) fail(`the header must say "${PIN_RULE}"`);
if (/^\s*import\s/m.test(body) || /\brequire\(/.test(body)) fail('styles.ts must import nothing: the portal and console copy it as plain data');

const S = await import(pathToFileURL(FILE).href);
const boards = S.STYLE_BOARDS;
const flavors = S.STYLE_FLAVORS;

// Boards
if (boards.length !== 10) fail(`ten boards, not ${boards.length}`);
const ids = boards.map((b) => b.id);
if (new Set(ids).size !== ids.length) fail(`board ids repeat: ${ids.join(', ')}`);
if (JSON.stringify(ids) !== JSON.stringify(IDS)) fail(`board ids must be, in order, ${IDS.join(', ')}; they are ${ids.join(', ')}`);
if (JSON.stringify([...S.STYLE_IDS]) !== JSON.stringify(ids)) fail('STYLE_IDS and STYLE_BOARDS list different ids or orders');

const short = (what, s, max) => {
  if (typeof s !== 'string' || !s.trim()) fail(`${what} is empty`);
  else if (s.length > max) fail(`${what} is ${s.length} characters; at most ${max}`);
};
for (const b of boards) {
  short(`${b.id}: label`, b.label, 40);
  short(`${b.id}: word`, b.word, 40);
  short(`${b.id}: feel`, b.feel, 120);
  for (const k of ['colour', 'shape', 'motion']) short(`${b.id}: ${k}`, b[k], 120);
  short(`${b.id}: type.note`, b.type?.note, 120);

  const roles = (b.palette ?? []).map((p) => p.name);
  if (JSON.stringify(roles) !== JSON.stringify(ROLES)) fail(`${b.id}: palette roles must be ${ROLES.join(', ')} in that order; they are ${roles.join(', ')}`);
  for (const p of b.palette ?? []) {
    if (!/^#[0-9a-f]{6}$/.test(p.hex)) fail(`${b.id}: palette ${p.name} is "${p.hex}"; want lowercase #rrggbb`);
  }
  for (const k of ['heading', 'body', 'label']) {
    const key = b.type?.[k];
    if (key === undefined && k === 'label') continue;
    if (!(key in S.FONT_STACKS)) fail(`${b.id}: type.${k} "${key}" is not a FONT_STACKS key`);
  }
  if (!Array.isArray(b.suits) || b.suits.length === 0) fail(`${b.id}: suits names no business`);
  if (b.demo !== undefined) {
    short(`${b.id}: demo.label`, b.demo.label, 40);
    let url = null;
    try { url = new URL(b.demo.href); } catch {}
    if (!url || url.protocol !== 'https:') fail(`${b.id}: demo.href "${b.demo.href}" must be an https URL`);
  }
  if (!b.draw?.sample?.headline) fail(`${b.id}: draw.sample is missing its headline`);
}

// Flavours
if (flavors.length !== 16) fail(`sixteen flavours, not ${flavors.length}`);
const fids = flavors.map((f) => f.id);
if (new Set(fids).size !== fids.length) fail(`flavour ids repeat: ${fids.join(', ')}`);
if (JSON.stringify([...S.FLAVOR_IDS]) !== JSON.stringify(fids)) fail('FLAVOR_IDS and STYLE_FLAVORS list different ids or orders');
for (const f of flavors) {
  short(`flavour ${f.id}: label`, f.label, 40);
  short(`flavour ${f.id}: meaning`, f.meaning, 120);
  if (!f.pairsWith?.length) fail(`flavour ${f.id}: pairsWith names no board`);
  for (const p of f.pairsWith ?? []) if (!ids.includes(p)) fail(`flavour ${f.id}: pairsWith "${p}" is not a board`);
}

// Constants
for (const [k, v] of [['STYLE_PICKS_MAX', 2], ['STYLE_FLAVORS_MAX', 3], ['STYLE_FEEL_MAX', 80]]) {
  if (S[k] !== v) fail(`${k} is ${S[k]}; the portal and console both enforce ${v}`);
}

if (failures.length) {
  console.error('check-styles failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
const sha = createHash('sha256').update(body).digest('hex');
console.log(`check-styles: ${boards.length} boards, ${flavors.length} flavours, ${boards.filter((b) => b.demo).length} with a demo`);
console.log(`check-styles: body SHA-256 ${sha}  (the portal's and console's pins record this)`);
