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
 * 5. No shift. Below the breakpoint the served page is already folded where the script will fold
 *    it: the frontmatter's `// <mm-prescript>` block is run for several breakpoints and must give
 *    one `(scripting: enabled)` rule at the script's own matchMedia threshold, keyed on that
 *    breakpoint, that shows the Menu button and folds the list; the built nav opens with it. The
 *    Menu button is not served `hidden` and the script never unhides it; only the collapsed layout
 *    hides the list; a panel item's link carries its button's caret and both are border-box, so
 *    the swap above the breakpoint keeps the bar's width; a collapsed menu is set up when its script
 *    is reached, asking the same question as the stylesheet.
 * 6. Mutations. Each check runs against deliberately broken copies and must fail on every one.
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
// The component's own stylesheet: a `<style>` alone on its line (the header comment names the tag too).
const styleOf = (code) => code.match(/^<style>$([\s\S]*?)^<\/style>$/m)?.[1] ?? '';
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

// ------------------------------------------------------------- 5. no shift
// Below the breakpoint the script folds the list behind the Menu button. If the page were served
// unfolded, everything under the header would jump up by the list's height when the script ran
// (superherotech.ai, 2026-10-01: 233px → 69px at 412px, CLS 0.307). So the served page is already
// folded wherever the script will fold it, and only when scripting is on.
const prescriptBlock = (code) => code.match(/\/\/ <mm-prescript>\n([\s\S]*?)\/\/ <\/mm-prescript>/)?.[1] ?? null;
/** Runs the frontmatter's pre-script block for one breakpoint; returns its CSS. */
const preScriptFor = (blockCode, breakpoint) => new Function('breakpoint', `${blockCode}\nreturn preScript;`)(breakpoint);
/** What the inline script asks matchMedia for a nav with this data-breakpoint, from its own source. */
const scriptQueryFor = (js, dataBreakpoint) => {
  const parse = js.match(/const bp = (parseFloat\(nav\.dataset\.breakpoint\) \|\| 0);/)?.[1];
  const query = js.match(/matchMedia\(`([^`]*)`\)/)?.[1];
  if (!parse || !query) return null;
  const nav = { dataset: { breakpoint: dataBreakpoint } };
  return new Function('nav', `const bp = ${parse};\nreturn \`${query}\`;`)(nav);
};
/** The rule the pre-script CSS must be, for a nav whose data-breakpoint is `value`. */
const preScriptShape = (css, value, scriptQuery) => {
  const out = [];
  const media = css.match(/^@media ([^{]+)\{([\s\S]*)\}$/);
  if (!media) return [`breakpoint ${value}: the pre-script CSS is not one @media block: ${css}`];
  const [, query, body] = media;
  if (!/^\(scripting: enabled\) and /.test(query.trim())) out.push(`breakpoint ${value}: the pre-script rule must sit under (scripting: enabled), or a visit without JavaScript loses the list with no Menu button to open it.`);
  if (scriptQuery && query.trim() !== `(scripting: enabled) and ${scriptQuery}`) out.push(`breakpoint ${value}: the pre-script rule asks "${query.trim()}" and the script asks matchMedia "${scriptQuery}"; between the two widths the menu would still jump.`);
  const key = `.mm:not(.mm--js)[data-breakpoint=${JSON.stringify(String(value))}]`;
  if (decl(rule(body, `${key} > .mm__toggle`), 'display') !== 'inline-flex') out.push(`breakpoint ${value}: no \`${key} > .mm__toggle { display: inline-flex }\`; the Menu button's place must be held before the script runs.`);
  if (decl(rule(body, `${key} > .mm__bar`), 'display') !== 'none') out.push(`breakpoint ${value}: no \`${key} > .mm__bar { display: none }\`; the list must be folded before the script runs.`);
  return out;
};
const noShiftCases = (code) => {
  const out = [];
  const blk = prescriptBlock(code);
  if (!blk) return [`${file} has no \`// <mm-prescript>\` … \`// </mm-prescript>\` block in its frontmatter.`];
  const js = scriptOf(code);
  for (const bp of [960, 720, 1040, '1200']) {
    let css;
    try {
      css = preScriptFor(blk, bp);
    } catch (e) {
      out.push(`the pre-script block threw for breakpoint ${bp}: ${e.message}`);
      continue;
    }
    out.push(...preScriptShape(css, bp, scriptQueryFor(js, String(bp))));
  }
  // Two menus with different breakpoints on one page: each rule names only its own.
  try {
    const [a, b] = [preScriptFor(blk, 1040), preScriptFor(blk, 720)];
    if (a.includes('data-breakpoint="720"') || b.includes('data-breakpoint="1040"') || !a.includes('[data-breakpoint="1040"]')) out.push('the pre-script rule is not keyed on its own data-breakpoint; two menus with different breakpoints on one page would fold each other.');
    if (preScriptFor(blk, 0) !== '') out.push('breakpoint 0 never collapses (the script says so), so it must emit no pre-script rule.');
  } catch (e) {
    out.push(`the pre-script block threw: ${e.message}`);
  }
  // The rule must be in the nav, as its first child, so it is parsed before the nav is painted.
  if (!/<nav\b[^>]*data-mm\b[^>]*>\s*\{preScript && <style is:inline set:html=\{preScript\} \/>\}/.test(code)) out.push('the nav must open with `{preScript && <style is:inline set:html={preScript} />}`, so the rule is parsed before anything in the nav is painted.');
  // The Menu button: served without `hidden`, shown by the stylesheet only in the collapsed layout.
  const toggleTag = code.match(/<button class="mm__toggle"[^>]*>/)?.[0] ?? '';
  if (!toggleTag) out.push('no `<button class="mm__toggle" …>` in the markup.');
  else if (/\shidden(?=[\s>])/.test(toggleTag)) out.push('the Menu button is served `hidden`, and `.mm [hidden]` is display: none !important: no rule could hold its place before the script runs.');
  if (/toggle\.hidden\s*=/.test(js)) out.push('the script sets toggle.hidden; the stylesheet decides where the Menu button shows, the same way before the script and after.');
  const css = styleOf(code);
  if (decl(rule(css, '.mm__toggle'), 'display') !== 'none') out.push('`.mm__toggle { display: none }` is gone; without JavaScript (and above the breakpoint) the Menu button would show and do nothing.');
  if (decl(rule(css, '.mm--compact .mm__toggle'), 'display') !== 'inline-flex') out.push('`.mm--compact .mm__toggle { display: inline-flex }` is gone; the collapsed menu would have no Menu button.');
  // Without JavaScript the list shows: only the collapsed class folds it.
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = squash(m[1].replace(/\/\*[\s\S]*?\*\//g, ''));
    if (!/\.mm__bar(?![\w-])/.test(sel) || decl(m[2], 'display') !== 'none') continue;
    for (const part of sel.split(',')) if (/\.mm__bar(?![\w-])/.test(part) && !part.trim().startsWith('.mm--compact')) out.push(`\`${part.trim()}\` hides the list outside the collapsed layout; without JavaScript the list must show.`);
  }
  // Above the breakpoint the script swaps each panel item's link for a button: same width.
  const link = code.match(/<a class="mm__top"[^>]*data-mm-link>([\s\S]*?)<\/a>/)?.[1] ?? '';
  if (!/\{hasPanel && <span class="mm__caret" aria-hidden="true" \/>\}/.test(link)) out.push('a top link with a panel must carry the caret its button carries, or the bar widens when the script swaps them.');
  const top = rule(css, '.mm__top, .mm__toggle');
  if (decl(top, 'box-sizing') !== 'border-box') out.push('`.mm__top, .mm__toggle` must be box-sizing: border-box: a link is content-box by default and a button border-box, so with min-height they differ in height.');
  for (const p of ['letter-spacing', 'text-transform']) if (decl(top, p) !== 'inherit') out.push(`\`.mm__top, .mm__toggle\` must set ${p}: inherit; a button does not inherit it and the link does.`);
  // A collapsed menu is set up when the browser reaches its script, not at DOMContentLoaded,
  // and "collapsed" is the same question everywhere the script asks it.
  if (!/\n\s*start\(\);\n/.test(js)) out.push('the script must call start() at once (it follows the nav); waiting for DOMContentLoaded leaves a collapsed menu\'s Menu button dead until the whole page has parsed.');
  if (!/const bootCollapsed = \(\) =>[\s\S]*?\.matches\) init\(nav\);/.test(js)) out.push('bootCollapsed() must set up each menu whose collapsed query matches.');
  const queries = new Set([...js.matchAll(/matchMedia\(`([^`]*)`\)/g)].map((m) => m[1]));
  const parses = new Set([...js.matchAll(/const bp = ([^;]+);/g)].map((m) => m[1]));
  if (queries.size !== 1 || parses.size !== 1) out.push(`the script asks "collapsed?" in more than one way (${[...queries].join(' | ')}; ${[...parses].join(' | ')}); the early setup and the menu itself must agree, and both must agree with the stylesheet.`);
  return out;
};
for (const f of noShiftCases(src)) fail(f);

// The built page: each nav carries its own rule, at its own breakpoint, and the Menu button
// is not served hidden.
const builtNoShift = (page) => {
  const out = [];
  const navs = [...page.matchAll(/<nav\b([^>]*\bdata-mm\b[^>]*)>([\s\S]*?)<\/nav>/g)];
  if (!navs.length) return ['the built demo page has no mega-menu nav.'];
  const js = [...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('__megaMenu')) ?? '';
  for (const [, attrs, inner] of navs) {
    const value = attrs.match(/data-breakpoint="([^"]*)"/)?.[1];
    if (!value) { out.push('a built nav has no data-breakpoint.'); continue; }
    const style = inner.match(/^\s*<style>([\s\S]*?)<\/style>/)?.[1];
    if (!style) { out.push(`the built nav (breakpoint ${value}) does not open with its pre-script <style>.`); continue; }
    out.push(...preScriptShape(style.trim(), value, scriptQueryFor(js, value)));
    const toggle = inner.match(/<button class="mm__toggle"[^>]*>/)?.[0] ?? '';
    if (!toggle) out.push(`the built nav (breakpoint ${value}) has no Menu button.`);
    else if (/\shidden(?=[\s>])/.test(toggle)) out.push(`the built nav (breakpoint ${value}) serves its Menu button hidden.`);
  }
  return out;
};
for (const f of builtNoShift(html)) fail(f);
finish('no shift');

// -------------------------------------------------------------- 6. mutations
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

const shiftMutants = [
  ['the pre-script rule ignores scripting', swap(src, '`@media (scripting: enabled) and (max-width:', '`@media (max-width:')],
  ['the pre-script threshold is not the script’s', swap(src, '(max-width: ${bp - 0.02}px) { ${key}', '(max-width: ${bp}px) { ${key}')],
  ['the script’s threshold is not the stylesheet’s', swap(src, 'matchMedia(`(max-width: ${bp - 0.02}px)`)', 'matchMedia(`(max-width: ${bp - 1}px)`)')],
  ['the pre-script rule is not keyed on the breakpoint', swap(src, '`.mm:not(.mm--js)[data-breakpoint=${JSON.stringify(String(breakpoint))}]`', '`.mm:not(.mm--js)`')],
  ['the pre-script rule outlives the script', swap(src, '`.mm:not(.mm--js)[data-breakpoint=', '`.mm[data-breakpoint=')],
  ['the pre-script rule does not hold the Menu button', swap(src, '${key} > .mm__toggle { display: inline-flex; } ', '')],
  ['the pre-script rule does not fold the list', swap(src, ' ${key} > .mm__bar { display: none; }', '')],
  ['a rule for breakpoint 0', swap(src, '  bp > 0\n    ?', '  bp >= 0\n    ?')],
  ['the nav does not carry the rule', swap(src, '  {preScript && <style is:inline set:html={preScript} />}\n', '')],
  ['the Menu button is served hidden', swap(src, 'aria-controls={`${uid}-list`} data-mm-toggle>', 'aria-controls={`${uid}-list`} hidden data-mm-toggle>')],
  ['the script unhides the Menu button', swap(src, "        nav.classList.toggle('mm--compact', compact());\n", "        nav.classList.toggle('mm--compact', compact());\n        toggle.hidden = !compact();\n")],
  ['the Menu button shows without JavaScript', swap(src, '  .mm__toggle {\n    display: none;\n  }\n', '')],
  ['the collapsed menu has no Menu button', swap(src, '  .mm--compact .mm__toggle {\n    display: inline-flex;\n  }\n', '')],
  ['the list is hidden without JavaScript', swap(src, '  .mm__bar {\n    display: flex;', '  .mm__bar {\n    display: none;')],
  ['the link has no caret', swap(src, '              {hasPanel && <span class="mm__caret" aria-hidden="true" />}\n            </a>', '            </a>')],
  ['link and button size their boxes differently', swap(src, '    box-sizing: border-box;\n    min-height: 2.75rem;', '    min-height: 2.75rem;')],
  ['the button ignores the host’s letter-spacing', swap(src, '    letter-spacing: inherit;\n', '')],
  ['the script waits for DOMContentLoaded', swap(src, '    window.__megaMenu = start;\n    start();\n', '    window.__megaMenu = start;\n')],
  ['the early setup asks another question', swap(src, 'if (bp > 0 && matchMedia(`(max-width: ${bp - 0.02}px)`).matches) init(nav);', 'if (bp > 0 && matchMedia(`(max-width: ${bp}px)`).matches) init(nav);')],
  ['the early setup sets up nothing', swap(src, '.matches) init(nav);', '.matches) return;')],
];
total += shiftMutants.length;
killed += await mutate(src, shiftMutants, noShiftCases);

const builtMutants = [
  ['the built Menu button is hidden', html.replace(/(<button class="mm__toggle")/, '$1 hidden')],
  ['the built rule is missing', html.replace(/(<nav\b[^>]*\bdata-mm\b[^>]*>)<style>[\s\S]*?<\/style>/, '$1')],
  ['the built rule is at another width', html.replace(/(<nav\b[^>]*\bdata-mm\b[^>]*><style>@media \(scripting: enabled\) and \(max-width: )([\d.]+)px/, (_, a, n) => `${a}${Number(n) + 40}px`)],
  ['the built rule names another breakpoint', html.replace(/(<style>@media[^<]*?)\[data-breakpoint="(\d+)"\] > \.mm__bar/, (_, a, n) => `${a}[data-breakpoint="${Number(n) + 1}"] > .mm__bar`)],
];
total += builtMutants.length;
killed += await mutate(html, builtMutants, builtNoShift);
finish('mutations');

const shiftCount = [...html.matchAll(/<nav\b[^>]*\bdata-mm\b/g)].length;
console.log(`check-mega-menu ok: ${FIT_CASES.length} panelTop cases; panel cap in source and built CSS; script and docs; no shift (pre-script rule at the script's threshold for 4 breakpoints, keyed per breakpoint, ${shiftCount} built nav(s), Menu button not served hidden, list shown without JavaScript, link and button the same width); ${killed}/${total} mutants killed.`);
