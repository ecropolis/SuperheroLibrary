#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the mega-menu's panel
 * height. Hosts put the menu in a sticky header, where the page cannot scroll a tall panel into
 * view, so on wide screens an open panel is capped at the viewport below it and scrolls inside
 * itself.
 *
 * 1. Logic. `panelTop` lives between `// <mm-fit>` markers in the inline script. The block is
 *    taken from the BUILT page, must equal the source's, and is run against fake panels: it
 *    reads layout offsets (never the panel's own box, which the opening animation translates),
 *    counts the positioned parent's border, and falls back to the document when the panel is
 *    positioned against <body>.
 * 2. Stylesheet. The panel's max-height is `var(--mm-panel-max, calc(100dvh - var(--mm-panel-top,
 *    …)))`, border-box, with overflow-y: auto and overscroll-behavior: contain, in the source and
 *    the built CSS; the no-JS :hover / :focus-within reveal is still there; the collapsed accordion lifts
 *    the cap (its list scrolls as a whole).
 * 3. Script. open() measures at once (no uncapped first frame) and scroll / resize re-measure
 *    while a panel is open; the collapsed layout is left alone.
 * 4. Docs. Every `--mm-*` the stylesheet reads is in the component header and the catalogue's
 *    theming list, except what the script itself sets; every catalogue variable is read.
 * 5. Mutations. Each check runs against deliberately broken copies and must fail on every one.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-mega-menu failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

const { catalog } = await import(pathToFileURL(join(root, 'src/data/catalog.ts')).href);
const entry = catalog.find((e) => e.id === 'mega-menu');
if (!entry) {
  console.log('check-mega-menu: no mega-menu in the catalogue; nothing to check.');
  process.exit(0);
}
const file = entry.file;
const src = readFileSync(join(root, file), 'utf8');
const pagePath = join(root, 'dist/mega-menu/index.html');
if (!existsSync(pagePath)) {
  fail('dist/mega-menu/index.html is missing; run astro build (check-catalog.mjs does) first.');
  finish('build');
}
const html = readFileSync(pagePath, 'utf8');

const squash = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const logicBlock = (code) => code.match(/\/\/ <mm-fit>\n([\s\S]*?)\/\/ <\/mm-fit>/)?.[1] ?? null;
const styleOf = (code) => code.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
const scriptOf = (code) => code.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1] ?? '';
const headerOf = (code) => code.match(/^---\n\/\*\*([\s\S]*?)\*\//)?.[1] ?? '';
/** Declarations of the first rule whose selector list is exactly `selector` (whitespace-free compare). */
const rule = (css, selector) => {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
    if (squash(sel) === squash(selector)) return m[2].replace(/\/\*[\s\S]*?\*\//g, '');
  }
  return null;
};
const decl = (body, prop) => body?.match(new RegExp(`(?:^|;)\\s*${esc(prop)}\\s*:\\s*([^;]+)`))?.[1].trim() ?? null;

/**
 * Mutation test: `check` must report at least one failure for every broken copy. A mutant whose
 * edit did not apply (input unchanged) is itself a failure, so a refactor cannot silently turn
 * a mutation into a no-op.
 */
const mutate = async (original, mutants, check) => {
  let killed = 0;
  for (const [label, broken] of mutants) {
    if (broken === original) {
      fail(`mutation "${label}" did not change anything; update the mutation to match the code.`);
      continue;
    }
    let found;
    try {
      found = await check(broken);
    } catch (e) {
      found = [`threw ${e.message}`];
    }
    if (found.length) killed++;
    else fail(`the check passed a broken copy (${label}); it no longer guards that rule.`);
  }
  return killed;
};

// ------------------------------------------------------------------ 1. logic
const block = logicBlock(src);
if (!block) fail(`${file} has no \`// <mm-fit>\` … \`// </mm-fit>\` block.`);
else {
  const shipped = [...html.matchAll(/\/\/ <mm-fit>\n([\s\S]*?)\/\/ <\/mm-fit>/g)];
  if (shipped.length !== 1) fail(`dist/mega-menu/index.html carries the mm-fit block ${shipped.length} times; the runtime must be emitted once per page.`);
  else if (squash(shipped[0][1]) !== squash(block)) fail(`the mm-fit block in the built page differs from the one in ${file}; the checked code must be the shipped code.`);
}
finish('logic block');

/** Imports the block with fake `document` / `window` globals; returns its panelTop. */
const env = { document: { body: { tag: 'body' } }, window: { scrollY: 0 } };
globalThis.__mmCheck = env;
const load = async (js) => {
  const code = `const { document, window } = globalThis.__mmCheck;\n${js}\nexport default panelTop;`;
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
};
const box = (top, clientTop = 0) => ({ clientTop, getBoundingClientRect: () => ({ top, bottom: top + 64 }) });
const panel = (offsetParent, offsetTop) => ({
  offsetParent,
  offsetTop,
  getBoundingClientRect() {
    throw new Error('reads the panel’s own box, which the opening animation translates');
  },
});
const FIT_CASES = [
  // [label, panel, scrollY, expected top]
  ['sticky header at the top: the panel starts where the bar ends', () => panel(box(0), 72), 900, 72],
  ['the parent’s top border counts (offsets are from its padding edge)', () => panel(box(10, 2), 44), 0, 56],
  ['a header scrolled half out of view', () => panel(box(-120, 1), 64), 400, -55],
  ['positioned against <body>: offsets are from the document', () => panel(env.document.body, 300), 100, 200],
  ['no offsetParent: offsets are from the document', () => panel(null, 80), 30, 50],
];
const fitCases = async (js) => {
  const out = [];
  const panelTop = await load(js);
  for (const [label, make, scrollY, want] of FIT_CASES) {
    env.window.scrollY = scrollY;
    let got;
    try {
      got = panelTop(make());
    } catch (e) {
      out.push(`panelTop: ${label}: ${e.message}.`);
      continue;
    }
    if (got !== want) out.push(`panelTop: ${label}: got ${got}, expected ${want}.`);
  }
  return out;
};
for (const f of await fitCases(block)) fail(f);
finish('logic');

// ------------------------------------------------------------- 2. stylesheet
const PANEL_CAP = /^var\(\s*--mm-panel-max\s*,\s*calc\(\s*100dvh\s*-\s*var\(\s*--mm-panel-top\s*,\s*[\d.]+(?:rem|px)\s*\)\s*\)\s*\)$/;
const styleCases = (code) => {
  const out = [];
  const css = styleOf(code);
  const panelRule = rule(css, '.mm__panel');
  if (!panelRule) return [`${file}: no \`.mm__panel { … }\` rule.`];
  const max = decl(panelRule, 'max-height');
  if (!max || !PANEL_CAP.test(max)) out.push(`.mm__panel max-height is "${max}"; it must be var(--mm-panel-max, calc(100dvh - var(--mm-panel-top, <length>))) so a tall panel in a sticky header stays reachable.`);
  if (decl(panelRule, 'box-sizing') !== 'border-box') out.push('.mm__panel must be box-sizing: border-box, or its top rule pushes the capped panel past the bottom of the viewport.');
  if (decl(panelRule, 'overflow-y') !== 'auto' && decl(panelRule, 'overflow') !== 'auto') out.push('.mm__panel must have overflow-y: auto, or the capped panel cuts its last links off.');
  if (decl(panelRule, 'overscroll-behavior') !== 'contain') out.push('.mm__panel must have overscroll-behavior: contain, or a wheel at the panel’s end scrolls the page behind it.');
  const reveal = rule(css, ".mm:not(.mm--js) .mm__item:is(:hover, :focus-within) > .mm__panel, .mm__top[aria-expanded='true'] + .mm__panel");
  if (decl(reveal, 'display') !== 'block') out.push('the no-JS reveal (`.mm:not(.mm--js) .mm__item:is(:hover, :focus-within) > .mm__panel`) is gone; without JavaScript no panel would open.');
  const compact = rule(css, ".mm--compact .mm__panel, .mm--compact .mm__top[aria-expanded='true'] + .mm__panel");
  if (!compact) out.push('no `.mm--compact .mm__panel` rule.');
  else {
    if (decl(compact, 'max-height') !== 'none') out.push('the collapsed panel must lift the cap (max-height: none); the list behind the Menu button scrolls as a whole.');
    if (decl(compact, 'overflow') !== 'visible') out.push('the collapsed panel must be overflow: visible, or it scrolls inside the scrolling list and traps the wheel.');
  }
  return out;
};
for (const f of styleCases(src)) fail(f);

// The built CSS is what ships: Astro minifies it, so compare loosely.
const cssFiles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="\/([^"]+\.css)"/g)].map((m) => join(root, 'dist', m[1]));
const builtCss = cssFiles.filter(existsSync).map((p) => readFileSync(p, 'utf8')).join('\n') + [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const builtPanel = [...builtCss.matchAll(/(?:^|})\.mm__panel\[data-astro-cid-[\w-]+\]\{([^}]*)\}/g)].map((m) => m[1]).find((b) => b.includes('max-height'));
if (!builtPanel) fail('the built CSS has no .mm__panel rule with a max-height.');
else {
  if (!/max-height:var\(--mm-panel-max,calc\(100dvh - var\(--mm-panel-top,[\d.]+(?:rem|px)\)\)\)/.test(builtPanel)) fail(`the built .mm__panel max-height is not the cap: ${builtPanel}`);
  if (!/overflow(?:-y)?:auto/.test(builtPanel)) fail('the built .mm__panel lost overflow-y: auto.');
  if (!/overscroll-behavior:contain/.test(builtPanel)) fail('the built .mm__panel lost overscroll-behavior: contain.');
  if (!/box-sizing:border-box/.test(builtPanel)) fail('the built .mm__panel lost box-sizing: border-box.');
}
finish('stylesheet');

// ----------------------------------------------------------------- 3. script
const scriptCases = (code) => {
  const out = [];
  const js = scriptOf(code);
  const openFn = js.match(/const open = \([^)]*\) => \{([\s\S]*?)\n\s{6}\};/)?.[1];
  if (!openFn) return [`${file}: no \`const open = (…) => { … };\` in the inline script.`];
  if (!/\bfit\(\);/.test(openFn)) out.push('open() must call fit() at once, or the first frame of a tall panel is uncapped.');
  const fitFn = js.match(/const fit = \(\) => \{([\s\S]*?)\n\s{6}\};/)?.[1];
  if (!fitFn) out.push('no `const fit = () => { … };` in the inline script.');
  else {
    if (!/if \(!openBtn \|\| compact\(\)\) return;/.test(fitFn)) out.push('fit() must do nothing while no panel is open or the menu is collapsed.');
    if (!/\.style\.setProperty\('--mm-panel-top', `\$\{Math\.ceil\(panelTop\(panel\)\)\}px`\)/.test(fitFn)) out.push("fit() must set --mm-panel-top on the panel from panelTop(), rounded up.");
  }
  if (!/addEventListener\('scroll', refit, \{ passive: true \}\)/.test(js)) out.push('a passive scroll listener must re-measure an open panel (a header that shrinks on scroll moves it).');
  if (!/addEventListener\('resize', refit\)/.test(js)) out.push('a resize listener must re-measure an open panel.');
  if (!/const refit = \(\) => \{\s*if \(openBtn && !fitFrame\) fitFrame = requestAnimationFrame\(fit\);/.test(js)) out.push('refit() must measure at most once a frame, and only while a panel is open.');
  return out;
};
for (const f of scriptCases(src)) fail(f);
finish('script');

// ------------------------------------------------------------------- 4. docs
const docCases = (code, theming) => {
  const out = [];
  const css = styleOf(code);
  const setByScript = new Set([...scriptOf(code).matchAll(/setProperty\('(--mm-[\w-]+)'/g)].map((m) => m[1]));
  const read = new Set([...css.matchAll(/var\(\s*(--mm-[\w-]+)/g)].map((m) => m[1]).filter((v) => !setByScript.has(v)));
  const header = headerOf(code);
  const documented = new Set((theming ?? []).map((t) => t.name));
  for (const v of read) {
    if (!documented.has(v)) out.push(`${v} is read by the stylesheet but missing from the catalogue entry's theming list.`);
    if (!new RegExp(`${esc(v)}(?![\\w-])`).test(header)) out.push(`${v} is read by the stylesheet but not named in ${file}'s header comment.`);
  }
  for (const v of documented) if (!read.has(v)) out.push(`the catalogue documents ${v}, which the stylesheet never reads.`);
  return out;
};
for (const f of docCases(src, entry.theming)) fail(f);
finish('docs');

// -------------------------------------------------------------- 5. mutations
const swap = (s, from, to) => s.replace(from, to);
let killed = 0;
let total = 0;
const logicMutants = [
  ['reads the panel’s own (translated) box', swap(block, 'return parent.getBoundingClientRect().top + parent.clientTop + panel.offsetTop;', 'return panel.getBoundingClientRect().top;')],
  ['ignores the parent’s border', swap(block, ' + parent.clientTop', '')],
  ['forgets the document scroll', swap(block, 'panel.offsetTop - window.scrollY', 'panel.offsetTop')],
  ['treats <body> as a positioned parent', swap(block, '!parent || parent === document.body', '!parent')],
];
total += logicMutants.length;
killed += await mutate(block, logicMutants, fitCases);

const cap = 'max-height: var(--mm-panel-max, calc(100dvh - var(--mm-panel-top, 5rem)));';
const srcMutants = [
  ['no cap on the panel', swap(src, cap, '')],
  ['the top rule sits outside the cap', swap(src, '    box-sizing: border-box;\n    max-height: var(--mm-panel-max', '    max-height: var(--mm-panel-max')],
  ['a cap the host cannot replace', swap(src, cap, 'max-height: calc(100dvh - var(--mm-panel-top, 5rem));')],
  ['a fixed cap that ignores where the panel starts', swap(src, cap, 'max-height: var(--mm-panel-max, 80vh);')],
  ['the panel does not scroll', swap(src, 'overflow-y: auto;\n    overscroll-behavior: contain;', 'overscroll-behavior: contain;')],
  ['the wheel chains to the page', swap(src, '\n    overscroll-behavior: contain;', '')],
  ['no no-JS reveal', swap(src, '.mm:not(.mm--js) .mm__item:is(:hover, :focus-within) > .mm__panel,\n', '')],
  ['the collapsed panel keeps the cap', swap(src, '    max-height: none;\n    overflow: visible;\n', '    overflow: visible;\n')],
  ['the collapsed panel scrolls inside the list', swap(src, '    max-height: none;\n    overflow: visible;\n', '    max-height: none;\n')],
];
total += srcMutants.length;
killed += await mutate(src, srcMutants, styleCases);

const scriptMutants = [
  ['open() does not measure', swap(src, '        byHover = hover;\n        fit();\n', '        byHover = hover;\n')],
  ['no scroll re-measure', swap(src, "      addEventListener('scroll', refit, { passive: true });\n", '')],
  ['no resize re-measure', swap(src, "      addEventListener('resize', refit);\n", '')],
  ['measures the collapsed layout', swap(src, 'if (!openBtn || compact()) return;', 'if (!openBtn) return;')],
  ['a non-passive scroll listener', swap(src, "addEventListener('scroll', refit, { passive: true })", "addEventListener('scroll', refit)")],
];
total += scriptMutants.length;
killed += await mutate(src, scriptMutants, scriptCases);

const docMutants = [
  ['header omits --mm-panel-max', swap(src, headerOf(src), headerOf(src).replaceAll('--mm-panel-max', '--mm-panel-cap'))],
];
total += docMutants.length;
killed += await mutate(src, docMutants, (s) => docCases(s, entry.theming));
const noTheme = entry.theming.filter((t) => t.name !== '--mm-panel-max');
total += 2;
killed += await mutate(entry.theming, [['catalogue omits --mm-panel-max', noTheme]], (t) => docCases(src, t));
killed += await mutate(entry.theming, [['catalogue lists a variable nobody reads', [...entry.theming, { name: '--mm-ghost' }]]], (t) => docCases(src, t));
finish('mutations');

console.log(`check-mega-menu ok: ${FIT_CASES.length} panelTop cases; panel cap in source and built CSS; script and docs; ${killed}/${total} mutants killed.`);
