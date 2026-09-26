#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the structure elements of
 * round 4: tabcordion, tooltip and responsive-table. Each section runs when its element is in
 * the catalogue, and has three parts:
 *
 * 1. Logic. The element's rules live in one plain-JS block between `// <name>` markers inside
 *    its inline script. The block is taken from the BUILT page (what the browser runs), must
 *    equal the block in the component source, and is run against golden cases here.
 * 2. No-JS render. The built demo page is exactly what a visitor without JavaScript gets:
 *    the ARIA it may and may not carry before the script runs, and what must be visible.
 * 3. Mutations. Each check is run against deliberately broken copies (a render with one
 *    attribute removed, a logic block with one rule changed) and must fail on every one; a
 *    check that passes a broken copy is itself broken.
 *
 * tabcordion        tablist / tab / tabpanel in the tabs layout and buttons with aria-expanded
 *                   in the accordion, the state carried across the breakpoint, the keys; no-JS:
 *                   the strip hidden, every panel open under a heading naming its tab; the
 *                   breakpoint lives only in the stylesheet (--tcd-layout), and the runtime is
 *                   emitted once per page.
 * tooltip           shows on focus as well as hover, Escape hides it, the pointer can reach the
 *                   tip, taps toggle; placement flips and slides; no-JS: the trigger's
 *                   aria-describedby names a role="tooltip" of plain text, shown inline (or as
 *                   the trigger's title); icon-only triggers are named and 44px; the fallback
 *                   colours pass 4.5:1.
 * responsive-table  caption, scope and explicit table roles on every part; each cell's
 *                   data-label is its column's header text; numeric columns agree with the
 *                   checked detection (run at build time, in the frontmatter); cards are CSS
 *                   only at each size; the scrollbox is a named, focusable region with a
 *                   hidden, aria-hidden hint; the edge maths holds in right-to-left.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-structure failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};
const summary = [];

let ids;
try {
  const { catalog } = await import(pathToFileURL(join(root, 'src/data/catalog.ts')).href);
  ids = new Set(catalog.map((e) => e.id));
} catch {
  ids = new Set([...readFileSync(join(root, 'src/data/catalog.ts'), 'utf8').matchAll(/^\s{4}id: '([a-z0-9-]+)'/gm)].map((m) => m[1]));
}

// ---------------------------------------------------------------- helpers
/** WCAG contrast ratio of two #rgb / #rrggbb colours. */
const contrast = (a, b) => {
  const lum = (hex) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4]
      .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const source = (rel) => readFileSync(join(root, rel), 'utf8');
const page = (id) => {
  const file = join(root, 'dist', id, 'index.html');
  if (!existsSync(file)) {
    fail(`${id}: dist/${id}/index.html is missing; run astro build (check-catalog.mjs does) first.`);
    return '';
  }
  return readFileSync(file, 'utf8');
};
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const has = (tag, name) => attr(tag, name) !== undefined;
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
const roots = (html, tag, marker) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*\\s${marker}(?=[\\s>=])[^>]*>`, 'g'))].map((m) => ({ open: m[0], index: m.index, html: block(html, m.index, tag) }));
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const text = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const squash = (s) => s.replace(/\s+/g, ' ').trim();
/** The `// <name>` … `// </name>` block of `code`, or null. */
const logicBlock = (code, name) => code.match(new RegExp(`// <${name}>\\n([\\s\\S]*?)// </${name}>`))?.[1] ?? null;
/** Imports a plain-JS block that declares `fn` and returns fn(). */
const load = async (js, fn) => {
  const mod = await import(`data:text/javascript;base64,${Buffer.from(`${js}\nexport default ${fn};`).toString('base64')}`);
  return mod.default();
};
/**
 * The logic block as the browser gets it: from the built page, equal to the source's block.
 * Returns the block's code, or null after recording why.
 */
const shippedBlock = (id, html, file, name) => {
  const src = logicBlock(source(file), name);
  if (!src) {
    fail(`${id}: ${file} has no \`// <${name}>\` … \`// </${name}>\` block.`);
    return null;
  }
  const blocks = [...html.matchAll(new RegExp(`// <${name}>\\n([\\s\\S]*?)// </${name}>`, 'g'))];
  if (blocks.length !== 1) {
    fail(`${id}: the built demo page carries the ${name} block ${blocks.length} times; the runtime must be emitted once per page.`);
    return null;
  }
  if (squash(blocks[0][1]) !== squash(src)) {
    fail(`${id}: the ${name} block in the built page differs from the one in ${file}; the checked code must be the shipped code.`);
    return null;
  }
  return src;
};
/**
 * Mutation test: `check` must report at least one failure for every broken copy. `mutants` is
 * [label, broken input]; a mutant whose edit did not apply (input unchanged) is itself a failure,
 * so a refactor cannot silently turn a mutation into a no-op.
 */
const mutate = async (id, original, mutants, check) => {
  let killed = 0;
  for (const [label, broken] of mutants) {
    if (broken === original) {
      fail(`${id}: mutation "${label}" did not change anything; update the mutation to match the code.`);
      continue;
    }
    let found;
    try {
      found = await check(broken);
    } catch (e) {
      found = [`threw ${e.message}`];
    }
    if (found.length) killed++;
    else fail(`${id}: the check passed a broken copy (${label}); it no longer guards that rule.`);
  }
  return killed;
};

// ================================================================= tabcordion
if (ids.has('tabcordion')) {
  const id = 'tabcordion';
  const file = 'src/library/tabcordion/Tabcordion.astro';
  const html = page(id);
  finish('tabcordion page');

  // ---------------------------------------------------------- 1. logic, golden cases
  const PIDS = ['a', 'b', 'c', 'd'];
  /** Every rule the state block must keep; returns failures (strings). */
  const tabcordionCases = (T) => {
    const out = [];
    const f = (m) => out.push(m);
    const openOf = (s) => s.open.map((o, i) => (o ? i : -1)).filter((i) => i >= 0).join(',');
    const run = (s, ...actions) => actions.reduce((st, a) => T.reduce(st, a), s);
    const mode = (m) => ({ type: 'mode', mode: m });
    const toggle = (index) => ({ type: 'toggle', index });
    const select = (index) => ({ type: 'select', index });
    const acc = (o = {}) => T.init({ n: 4, mode: 'accordion', ...o });
    const tabs = (o = {}) => T.init({ n: 4, mode: 'tabs', ...o });
    const expect = (label, s, want) => {
      const got = { mode: s.mode, selected: s.selected, open: openOf(s) };
      for (const k of Object.keys(want)) if (got[k] !== want[k]) f(`${label}: ${k} is ${JSON.stringify(got[k])}, expected ${JSON.stringify(want[k])}.`);
    };

    // State
    expect('loaded as an accordion, the selected panel is open', acc({ selected: 2 }), { mode: 'accordion', selected: 2, open: '2' });
    expect('loaded as tabs, no accordion panel is open yet', tabs({ selected: 1 }), { mode: 'tabs', selected: 1, open: '' });
    expect('an out-of-range selected falls back to the first', acc({ selected: 9 }), { selected: 0, open: '0' });
    expect('tabs → accordion opens the selected tab’s panel', run(tabs(), select(2), mode('accordion')), { mode: 'accordion', selected: 2, open: '2' });
    expect('accordion → tabs selects the panel opened last', run(acc(), toggle(3), mode('tabs')), { mode: 'tabs', selected: 3 });
    expect('multiple: opening one keeps the others', run(acc(), toggle(1), toggle(3)), { open: '0,1,3', selected: 3 });
    expect('closing the latest selects the one opened before it', run(acc(), toggle(2), toggle(1), toggle(1)), { open: '0,2', selected: 2 });
    expect('…and that is the tab when it widens', run(acc(), toggle(2), toggle(1), toggle(1), mode('tabs')), { mode: 'tabs', selected: 2 });
    expect('closing every panel keeps the last selection for the tabs', run(acc(), toggle(2), toggle(2), toggle(0), mode('tabs')), { selected: 0, open: '' });
    expect('round trip keeps what the visitor had open', run(acc(), toggle(1), mode('tabs'), select(3), mode('accordion')), { selected: 3, open: '0,1,3' });
    expect('single: opening one closes the others', run(acc({ multiple: false }), toggle(1), toggle(3)), { open: '3', selected: 3 });
    expect('single: tabs → accordion leaves only the selected open', run(acc({ multiple: false }), mode('tabs'), select(2), mode('accordion')), { open: '2' });
    expect('a #hash (select) in the accordion opens that panel', run(acc(), select(3)), { open: '0,3', selected: 3 });
    expect('select in tabs only moves the selection', run(tabs(), select(3)), { selected: 3, open: '' });
    {
      const s = acc();
      if (T.reduce(s, mode('accordion')) !== s) f('a mode action for the current mode must return the same state (no re-render).');
      if (T.reduce(s, toggle(7)) !== s || T.reduce(s, select(-1)) !== s) f('an index outside the panels must be ignored.');
      if (T.reduce(s, mode('grid')) !== s) f('an unknown layout must be ignored.');
    }

    // Keys
    const keys = [
      ['tabs', 'ArrowRight', 3, 0], ['tabs', 'ArrowLeft', 0, 3], ['tabs', 'ArrowRight', 1, 2], ['tabs', 'Home', 2, 0], ['tabs', 'End', 0, 3],
      ['tabs', 'ArrowDown', 1, -1], ['accordion', 'ArrowDown', 3, 0], ['accordion', 'ArrowUp', 0, 3], ['accordion', 'ArrowRight', 1, -1],
      ['accordion', 'End', 1, 3], ['tabs', 'Enter', 1, -1],
    ];
    for (const [m, key, from, want] of keys) {
      const got = T.move(m, key, from, 4);
      if (got !== want) f(`${m}: ${key} from ${from} gives ${got}, expected ${want}.`);
    }

    // The ARIA contract, both sides of the breakpoint.
    const tabsView = T.view(run(tabs(), select(1)), PIDS, [false, true, false, false]);
    if (tabsView.list.hidden !== null) f('tabs: the tablist must not be hidden.');
    tabsView.panels.forEach((p, i) => {
      const on = i === 1;
      if (p.tab['aria-selected'] !== String(on)) f(`tabs: tab ${i} aria-selected="${p.tab['aria-selected']}", expected "${on}".`);
      if (p.tab.tabindex !== (on ? '0' : '-1')) f(`tabs: tab ${i} tabindex ${p.tab.tabindex}; the selected tab is the one Tab stop.`);
      if (p.panel.role !== 'tabpanel') f(`tabs: panel ${i} role ${p.panel.role}, expected tabpanel.`);
      if (p.panel['aria-labelledby'] !== `${PIDS[i]}-tab`) f(`tabs: panel ${i} is labelled by ${p.panel['aria-labelledby']}, expected its tab ${PIDS[i]}-tab.`);
      if ((p.panel.hidden === '') === on) f(`tabs: panel ${i} hidden is ${p.panel.hidden}; only the selected panel shows.`);
      if (p.body.hidden !== null) f(`tabs: panel ${i}'s body must not be hidden (the panel is).`);
      const wantTabindex = i === 1 ? null : '0';
      if (p.panel.tabindex !== wantTabindex) f(`tabs: panel ${i} tabindex ${p.panel.tabindex}, expected ${wantTabindex} (focusable only when it holds nothing focusable).`);
    });
    const accView = T.view(run(acc(), toggle(2)), PIDS, []);
    if (accView.list.hidden !== '') f('accordion: the tablist must be hidden.');
    accView.panels.forEach((p, i) => {
      const open = i === 0 || i === 2;
      if (p.button['aria-expanded'] !== String(open)) f(`accordion: button ${i} aria-expanded="${p.button['aria-expanded']}", expected "${open}".`);
      if (p.body.hidden !== (open ? null : '')) f(`accordion: panel ${i}'s body hidden is ${p.body.hidden}, expected ${open ? 'shown' : 'hidden'}.`);
      if (p.panel.role !== null || p.panel['aria-labelledby'] !== null || p.panel.tabindex !== null) f(`accordion: panel ${i} keeps tab semantics (${JSON.stringify(p.panel)}).`);
      if (p.panel.hidden !== null) f(`accordion: panel ${i} itself must not be hidden; its body is.`);
      if (p.tab['aria-selected'] !== 'false') f(`accordion: tab ${i} still aria-selected="true" behind the hidden strip.`);
    });
    return out;
  };

  const tcSrc = shippedBlock(id, html, file, 'tabcordion-state');
  finish('tabcordion block');
  const T = await load(tcSrc, 'tabcordionState');
  for (const m of tabcordionCases(T)) fail(`${id}: ${m}`);
  finish('tabcordion logic');

  // ---------------------------------------------------------- 2. no-JS render
  const tcComponent = source(file);
  /** Failures in a built tabcordion page (and the component's CSS, which holds the breakpoint). */
  const tabcordionRender = (page, css = tcComponent) => {
    const out = [];
    const f = (m) => out.push(m);
    const sets = roots(page, 'div', 'data-tcd');
    if (sets.length !== 2) f(`the demo should render 2 tabcordions (resizable and sidebar); found ${sets.length}.`);
    if (!sets.some((s) => has(s.open, 'data-multiple')) || sets.every((s) => has(s.open, 'data-multiple'))) f('the demo needs one tabcordion with multiple and one without.');
    for (const [n, s] of sets.entries()) {
      const where = `tabcordion ${n + 1}`;
      if (!/\btcd--(sm|md|lg)\b/.test(attr(s.open, 'class') ?? '')) f(`${where}: no breakpoint class (tcd--sm, tcd--md or tcd--lg).`);
      if (has(s.open, 'data-ready') || has(s.open, 'data-layout')) f(`${where}: rendered as if the script had run (data-ready / data-layout).`);
      const list = s.html.match(/<div\b[^>]*\srole="tablist"[^>]*>/)?.[0];
      if (!list) f(`${where}: no role="tablist" in the HTML.`);
      else {
        if (!has(list, 'hidden')) f(`${where}: the tablist must be hidden until the script runs; without it, its tabs do nothing.`);
        if (!attr(list, 'aria-label')) f(`${where}: the tablist has no aria-label.`);
      }
      const tabs = [...s.html.matchAll(/<button\b[^>]*\srole="tab"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => ({ open: m[0].slice(0, m[0].indexOf('>') + 1), label: text(m[1]) }));
      const panels = [...s.html.matchAll(/<section\b[^>]*\sdata-tcd-panel[^>]*>/g)].map((m) => ({ open: m[0], html: block(s.html, m.index, 'section') }));
      if (!tabs.length || tabs.length !== panels.length) f(`${where}: ${tabs.length} tabs for ${panels.length} panels; one each.`);
      tabs.forEach((t, i) => {
        const p = panels[i];
        if (!p) return;
        const pid = attr(p.open, 'id');
        if (attr(t.open, 'aria-controls') !== pid) f(`${where}: tab "${t.label}" controls "${attr(t.open, 'aria-controls')}", but its panel is #${pid}.`);
        if (attr(t.open, 'id') !== `${pid}-tab`) f(`${where}: tab "${t.label}" must have id "${pid}-tab" (the panel is labelled by it).`);
        if (attr(t.open, 'type') !== 'button') f(`${where}: tab "${t.label}" needs type="button".`);
        if (attr(t.open, 'aria-selected') !== 'false' || attr(t.open, 'tabindex') !== '-1') f(`${where}: tab "${t.label}" must start aria-selected="false" tabindex="-1"; the script selects one.`);
        if (has(p.open, 'hidden')) f(`${where}: panel #${pid} is hidden in the static HTML; without JavaScript every panel is open.`);
        if (has(p.open, 'role')) f(`${where}: panel #${pid} has a role before the script runs; tabpanel is only true in the tabs layout.`);
        const heading = p.html.match(/<(h[2-4])\b[^>]*class="tcd__heading[^"]*"[^>]*>([\s\S]*?)<\/\1>/);
        if (!heading) f(`${where}: panel #${pid} has no h2–h4 heading.`);
        else if (text(heading[2]) !== t.label) f(`${where}: panel #${pid}'s heading "${text(heading[2])}" is not its tab's label "${t.label}".`);
        const body = p.html.match(/<div\b[^>]*class="tcd__body[^"]*"[^>]*>([\s\S]*)<\/div>\s*<\/section>$/);
        if (!body || !text(body[1])) f(`${where}: panel #${pid} is empty in the static HTML.`);
        else if (has(body[0], 'hidden')) f(`${where}: panel #${pid}'s body is hidden in the static HTML.`);
      });
      if (/aria-expanded=/.test(s.html)) f(`${where}: aria-expanded in the static HTML; the accordion buttons exist only once the script can run them.`);
    }
    const runtimes = (page.match(/window\.__superheroTabcordion\s*=/g) || []).length;
    if (sets.length && runtimes !== 1) f(`the runtime is on the page ${runtimes} times; it must be emitted once.`);
    // The breakpoint lives in the stylesheet only: each size sets --tcd-layout: tabs in a
    // container query on the element's own width, and the script reads that property.
    for (const [size, rem] of [['sm', 30], ['md', 40], ['lg', 52]]) {
      const re = new RegExp(`@container tabcordion \\(min-width: ${rem}rem\\) \\{\\s*\\.tcd--${size} > \\.tcd__frame \\{\\s*--tcd-layout: tabs;`);
      if (!re.test(css)) f(`the stylesheet has no \`@container tabcordion (min-width: ${rem}rem) { .tcd--${size} > .tcd__frame { --tcd-layout: tabs; } }\`.`);
    }
    if (!/\.tcd \{\s*container: tabcordion \/ inline-size;/.test(css)) f('the root must be the `tabcordion` inline-size container, or the queries measure the wrong box.');
    if (!/getPropertyValue\('--tcd-layout'\)/.test(css)) f('the script must read --tcd-layout rather than measure a width of its own.');
    if (/matchMedia\(|innerWidth|clientWidth\s*[<>]/.test(css)) {
      f('the script measures the width itself (matchMedia / innerWidth / clientWidth); the container query is the one breakpoint.');
    }
    return out;
  };
  for (const m of tabcordionRender(html)) fail(`${id}: ${m}`);
  finish('tabcordion render');

  // ---------------------------------------------------------- 3. mutations
  const firstPanel = html.match(/<section\b[^>]*\sdata-tcd-panel[^>]*>/)[0];
  const renderMutants = [
    ['tablist not hidden', html.replace(/(<div\b[^>]*role="tablist"[^>]*?)\shidden/, '$1')],
    ['a panel hidden', html.replace(firstPanel, firstPanel.replace('<section', '<section hidden'))],
    ['a panel with role before the script', html.replace(firstPanel, firstPanel.replace('<section', '<section role="tabpanel"'))],
    ['a heading that does not match its tab', html.replace(/(<h[2-4]\b[^>]*class="tcd__heading[^"]*"[^>]*>\s*<span[^>]*>)([^<]+)/, '$1Something else')],
    ['a tab controlling the wrong panel', html.replace(/(role="tab"[^>]*?)aria-controls="[^"]+"/, '$1aria-controls="nowhere"')],
    ['a tab pre-selected', html.replace(/aria-selected="false"/, 'aria-selected="true"')],
    ['aria-expanded in the static HTML', html.replace(firstPanel, firstPanel.replace('<section', '<section aria-expanded="true"'))],
    ['runtime emitted twice', html.replace('</body>', '<script>window.__superheroTabcordion = {};</script></body>')],
  ];
  const cssMutants = [
    ['the md container query removed', tcComponent.replace('@container tabcordion (min-width: 40rem)', '@media (min-width: 40rem)')],
    ['the root no longer a container', tcComponent.replace('container: tabcordion / inline-size;', '')],
    ['the script measuring the window', tcComponent.replace("getPropertyValue('--tcd-layout').trim() === 'tabs'", "getPropertyValue('--tcd-layout').trim() === 'tabs' || matchMedia('(min-width: 40rem)').matches")],
  ];
  const logicMutants = [
    ['closing a panel leaves it selected', tcSrc.replace('selected: recent.length ? recent[recent.length - 1] : s.selected };', 'selected: s.selected };')],
    ['to the accordion forgets the selected panel', tcSrc.replace("if (a.mode === 'accordion') return { ...opened(s, s.selected), mode: 'accordion' };", "if (a.mode === 'accordion') return { ...s, mode: 'accordion' };")],
    ['multiple ignored', tcSrc.replace('const open = s.multiple ? s.open.slice() : s.open.map(() => false);', 'const open = s.open.map(() => false);')],
    ['aria-expanded always true', tcSrc.replace("button: { 'aria-expanded': String(!!s.open[i]) },", "button: { 'aria-expanded': 'true' },")],
    ['tabpanel role kept in the accordion', tcSrc.replace("role: tabs ? 'tabpanel' : null,", "role: 'tabpanel',")],
    ['arrows stop at the ends', tcSrc.replace('if (key === next) return (i + 1) % n;', 'if (key === next) return Math.min(i + 1, n - 1);')],
  ];
  let killed = 0;
  killed += await mutate(id, html, renderMutants, (h) => tabcordionRender(h));
  killed += await mutate(id, tcComponent, cssMutants, (c) => tabcordionRender(html, c));
  killed += await mutate(id, tcSrc, logicMutants, async (js) => tabcordionCases(await load(js, 'tabcordionState')));
  finish('tabcordion mutations');
  summary.push(`tabcordion (golden cases, no-JS render of ${roots(html, 'div', 'data-tcd').length}, ${killed} mutants caught)`);
}

// ================================================================= tooltip
if (ids.has('tooltip')) {
  const id = 'tooltip';
  const file = 'src/library/tooltip/Tooltip.astro';
  const html = page(id);
  finish('tooltip page');

  // ---------------------------------------------------------- 1. logic, golden cases
  /** When a tip is visible, after a run of events from a fresh trigger. */
  const stateCases = [
    [[], false, 'nothing has happened'],
    [['focus'], true, 'keyboard focus alone shows it (never hover only)'],
    [['enter'], true, 'hover shows it'],
    [['enter', 'leave'], false, 'hover out hides it'],
    [['focus', 'enter', 'leave'], true, 'still focused after the pointer leaves'],
    [['enter', 'focus', 'blur'], true, 'still hovered after focus leaves'],
    [['focus', 'blur'], false, 'focus leaving hides it'],
    [['focus', 'dismiss'], false, 'Escape hides it while focused'],
    [['enter', 'focus', 'dismiss'], false, 'Escape hides it while hovered and focused'],
    [['focus', 'dismiss', 'blur', 'focus'], true, 'focus again after Escape shows it'],
    [['enter', 'dismiss', 'leave', 'enter'], true, 'hover again after Escape shows it'],
    [['focus', 'dismiss', 'enter'], true, 'a new hover after Escape shows it'],
    [['enter', 'tip-enter', 'leave'], true, 'the pointer can move from the trigger onto the tip'],
    [['enter', 'tip-enter', 'leave', 'tip-leave'], false, 'leaving the tip too hides it'],
    [['enter', 'leave', 'tip-enter'], true, 'crossing the gap onto the tip (inside the hide delay) keeps it'],
    [['enter', 'dismiss', 'tip-enter'], false, 'after Escape, reaching the tip does not bring it back'],
    [['tap'], true, 'a tap shows it'],
    [['tap', 'tap'], false, 'a second tap hides it'],
    [['tap', 'tap', 'tap'], true, 'a third tap shows it again'],
    [['tap', 'outside'], false, 'a tap elsewhere hides it'],
    [['focus', 'tap', 'blur'], false, 'focus leaving clears a tap'],
    [['enter', 'tip-enter', 'outside', 'leave'], false, 'a tap elsewhere forgets the tip hover'],
  ];
  const tooltipStateCases = (S) => {
    const out = [];
    for (const [events, want, label] of stateCases) {
      const s = events.reduce((st, e) => S.reduce(st, e), S.initial);
      if (S.visible(s) !== want) out.push(`${label}: [${events.join(', ')}] leaves it ${S.visible(s) ? 'visible' : 'hidden'}.`);
    }
    if (S.reduce(S.initial, 'dismiss') !== S.initial) out.push('dismissing a hidden tip must change nothing (it would block the next hover).');
    return out;
  };
  const rect = (left, top, width = 100, height = 20) => ({ left, top, width, height, right: left + width, bottom: top + height });
  const TIP = { w: 200, h: 40 };
  /** [label, trigger rect, tip size, vw, vh, preferred, expected { side, left, top, arrow }] */
  const placeCases = [
    ['room above: top, centred', rect(500, 400), TIP, 1000, 800, 'top', { side: 'top', left: 450, top: 352, arrow: 100 }],
    ['room below: bottom, centred', rect(500, 400), TIP, 1000, 800, 'bottom', { side: 'bottom', left: 450, top: 428 }],
    ['no room above: flips below', rect(500, 20), TIP, 1000, 800, 'top', { side: 'bottom', top: 48 }],
    ['no room below: flips above', rect(500, 760), TIP, 1000, 800, 'bottom', { side: 'top', top: 712 }],
    ['room left: left, centred on the trigger', rect(500, 400), TIP, 1000, 800, 'left', { side: 'left', left: 292, top: 390, arrow: 20 }],
    ['no room left: flips right', rect(10, 400), TIP, 1000, 800, 'left', { side: 'right', left: 118 }],
    ['no room right: flips left', rect(890, 400), TIP, 1000, 800, 'right', { side: 'left', left: 682 }],
    ['no room either side: goes above', rect(450, 400), { w: 480, h: 40 }, 1000, 800, 'right', { side: 'top' }],
    ['at the right edge: slides left, arrow still on the trigger', rect(960, 400, 30), TIP, 1000, 800, 'top', { side: 'top', left: 792, arrow: 183 }],
    ['at the left edge: slides right, arrow clamped to the tip', rect(0, 400, 20), TIP, 1000, 800, 'top', { side: 'top', left: 8, arrow: 10 }],
    ['beside, near the top: slides down', rect(10, 0, 20, 20), TIP, 1000, 800, 'right', { side: 'right', top: 8, arrow: 10 }],
    ['nowhere fits: the side with the most room', rect(140, 20, 20, 20), TIP, 300, 60, 'left', { side: 'top' }],
    ['an unknown placement is treated as top', rect(500, 400), TIP, 1000, 800, 'middle', { side: 'top' }],
  ];
  const tooltipPlaceCases = (P) => {
    const out = [];
    for (const [label, r, size, vw, vh, pref, want] of placeCases) {
      const got = P.place(r, size, vw, vh, pref);
      for (const k of Object.keys(want)) if (got[k] !== want[k]) out.push(`${label}: ${k} is ${got[k]}, expected ${want[k]}.`);
    }
    return out;
  };

  const stateSrc = shippedBlock(id, html, file, 'tooltip-state');
  const placeSrc = shippedBlock(id, html, file, 'tooltip-place');
  finish('tooltip blocks');
  for (const m of tooltipStateCases(await load(stateSrc, 'tooltipState'))) fail(`${id}: ${m}`);
  for (const m of tooltipPlaceCases(await load(placeSrc, 'tooltipPlace'))) fail(`${id}: ${m}`);
  finish('tooltip logic');

  // ---------------------------------------------------------- 2. no-JS render, wiring, contrast
  const ttComponent = source(file);
  const INTERACTIVE = /<(a|button|input|select|textarea|details|summary|iframe|label)\b|\stabindex=|\scontenteditable/;
  const tooltipRender = (page, css = ttComponent) => {
    const out = [];
    const f = (m) => out.push(m);
    const tts = roots(page, 'span', 'data-tt');
    const seen = { button: 0, link: 0, icon: 0, title: 0, top: 0, bottom: 0, left: 0, right: 0 };
    const tipIds = new Set();
    for (const [n, t] of tts.entries()) {
      const where = `tooltip ${n + 1}`;
      const cls = attr(t.open, 'class') ?? '';
      const placement = attr(t.open, 'data-placement');
      if (!['top', 'bottom', 'left', 'right'].includes(placement)) f(`${where}: data-placement "${placement}".`);
      else seen[placement]++;
      if (has(t.open, 'data-ready')) f(`${where}: rendered as if the script had run (data-ready).`);
      const trig = t.html.match(/^<span\b[^>]*>\s*<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/);
      if (!trig) {
        f(`${where}: the trigger must be the first child, a <button> or an <a>.`);
        continue;
      }
      const [, tag, attrs, inner] = trig;
      const open = `<${tag}${attrs}>`;
      if (tag === 'button') {
        seen.button++;
        if (attr(open, 'type') !== 'button') f(`${where}: the trigger button needs type="button".`);
      } else {
        seen.link++;
        if (!attr(open, 'href')) f(`${where}: a link trigger without href is not focusable.`);
      }
      const tipTag = t.html.slice(t.html.indexOf(trig[0]) + trig[0].length).match(/^\s*<span\b[^>]*>/)?.[0];
      if (!tipTag) {
        f(`${where}: the tip must follow the trigger directly.`);
        continue;
      }
      const tipId = attr(tipTag, 'id');
      const tipHtml = block(t.html, t.html.indexOf(tipTag), 'span');
      const tipText = text(tipHtml);
      if (attr(tipTag, 'role') !== 'tooltip') f(`${where}: the tip is not role="tooltip".`);
      if (!tipId || attr(open, 'aria-describedby') !== tipId) f(`${where}: the trigger's aria-describedby is "${attr(open, 'aria-describedby')}", not the tip's id "${tipId}".`);
      if (tipId && tipIds.has(tipId)) f(`${where}: tip id "${tipId}" is used twice on the page.`);
      tipIds.add(tipId);
      if (!tipText) f(`${where}: the tip is empty.`);
      if (INTERACTIVE.test(tipHtml.slice(tipTag.length))) f(`${where}: the tip holds interactive content; that is a popover, not a tooltip.`);
      const inline = /\btt--inline\b/.test(cls);
      if (inline) {
        if (has(tipTag, 'hidden')) f(`${where}: inline, but the tip is hidden; without JavaScript its text must show after the trigger.`);
        if (has(open, 'title')) f(`${where}: inline, but the trigger also has a title; the text would show twice.`);
      } else {
        seen.title++;
        if (!has(tipTag, 'hidden')) f(`${where}: inline={false}, but the tip is not hidden in the static HTML.`);
        if (decode(attr(open, 'title') ?? '') !== tipText) f(`${where}: inline={false}: the trigger's title must carry the tip's text for the no-JS render.`);
      }
      if (/\btt--icon\b/.test(cls)) {
        seen.icon++;
        if (!attr(open, 'aria-label')) f(`${where}: an icon-only trigger needs aria-label.`);
        const wrap = inner.match(/^\s*<span\b[^>]*class="tt__icon[^"]*"[^>]*>/)?.[0];
        if (!wrap || attr(wrap, 'aria-hidden') !== 'true') f(`${where}: the icon must sit in an aria-hidden wrapper.`);
        if (text(inner)) f(`${where}: an icon-only trigger has visible text "${text(inner)}"; drop \`label\` or the text.`);
      } else if (!text(inner)) f(`${where}: the trigger has no text; an icon-only trigger needs \`label\`.`);
    }
    for (const [k, v] of Object.entries(seen)) if (!v) f(`the demo needs at least one ${k === 'title' ? 'inline={false}' : k} tooltip.`);
    const runtimes = (page.match(/window\.__superheroTooltip\s*=/g) || []).length;
    if (tts.length && runtimes !== 1) f(`the runtime is on the page ${runtimes} times; it must be emitted once.`);
    // The component's CSS and wiring.
    if (!/\.tt--icon \.tt__trigger \{[^}]*min-width: 44px;[^}]*min-height: 44px;/.test(css)) f('an icon-only trigger must be at least 44 × 44 px (min-width / min-height 44px).');
    if (!/\.tt\[data-ready\] \.tt__tip:not\(\[data-open\]\) \{\s*display: none;/.test(css)) f('with the script, a tip must be hidden until it is shown.');
    if (!/document\.addEventListener\('focusin',[\s\S]{0,160}send\(t, 'focus'\)/.test(css)) f('the script does not show the tip on focus; hover only fails keyboard users.');
    if (!/e\.key !== 'Escape'[\s\S]{0,160}send\(t, 'dismiss'\)/.test(css)) f('the script does not hide the tip on Escape.');
    if (!/@media \(prefers-reduced-motion: no-preference\) \{\s*\.tt\[data-ready\] \.tt__tip\[data-open\] \{\s*animation:/.test(css)) f('the fade must sit inside prefers-reduced-motion: no-preference.');
    const bg = css.match(/background: var\(--tt-bg, (#[0-9a-f]{3,6})\);/i)?.[1];
    const fg = css.match(/color: var\(--tt-fg, (#[0-9a-f]{3,6})\);/i)?.[1];
    if (!bg || !fg) f('no `background: var(--tt-bg, #…)` / `color: var(--tt-fg, #…)` fallbacks to measure.');
    else if (contrast(bg, fg) < 4.5) f(`the fallback tip colours ${fg} on ${bg} are ${contrast(bg, fg).toFixed(2)}:1, under 4.5:1.`);
    return out;
  };
  for (const m of tooltipRender(html)) fail(`${id}: ${m}`);
  finish('tooltip render');
  const ttBg = ttComponent.match(/background: var\(--tt-bg, (#[0-9a-f]{3,6})\);/i)[1];
  const ttFg = ttComponent.match(/color: var\(--tt-fg, (#[0-9a-f]{3,6})\);/i)[1];

  // ---------------------------------------------------------- 3. mutations
  const firstTrigger = html.match(/<button class="tt__trigger"[^>]*>/)[0];
  const iconTrigger = html.match(/<button class="tt__trigger"[^>]*aria-label="[^"]*"[^>]*>/)[0];
  const firstTip = html.match(/<span class="tt__tip"[^>]*>/)[0];
  const titled = html.match(/<button class="tt__trigger"[^>]*title="[^"]*"[^>]*>[\s\S]*?<\/button><span class="tt__tip"[^>]*>/)[0];
  const renderMutants = [
    ['trigger without aria-describedby', html.replace(firstTrigger, firstTrigger.replace(/ aria-describedby="[^"]*"/, ''))],
    ['aria-describedby naming another element', html.replace(firstTrigger, firstTrigger.replace(/aria-describedby="[^"]*"/, 'aria-describedby="nowhere"'))],
    ['tip without role="tooltip"', html.replace(firstTip, firstTip.replace(' role="tooltip"', ''))],
    ['a link inside the tip', html.replace(firstTip, `${firstTip}<a href="#x">more</a> `)],
    ['icon trigger without aria-label', html.replace(iconTrigger, iconTrigger.replace(/ aria-label="[^"]*"/, ''))],
    ['icon not hidden from assistive tech', html.replace('<span class="tt__icon" aria-hidden="true"', '<span class="tt__icon"')],
    ['inline tip hidden', html.replace(firstTip, firstTip.replace('<span', '<span hidden'))],
    ['inline={false} tip shown', html.replace(titled, titled.replace(/ hidden(?=[\s>])/, ''))],
    ['inline trigger also titled', html.replace(firstTrigger, firstTrigger.replace('<button', '<button title="x"'))],
    ['runtime emitted twice', html.replace('</body>', '<script>window.__superheroTooltip = {};</script></body>')],
  ];
  const cssMutants = [
    ['icon trigger under 44px', ttComponent.replace('min-width: 44px;', 'min-width: 24px;')],
    ['focus not wired', ttComponent.replace("if (t && t.trigger === e.target) send(t, 'focus');", 'if (t && t.trigger === e.target) void 0;')],
    ['Escape not wired', ttComponent.replace("for (const t of [...open]) send(t, 'dismiss');", 'open.clear();')],
    ['fade outside reduced motion', ttComponent.replace('@media (prefers-reduced-motion: no-preference) {\n    .tt[data-ready]', '@media all {\n    .tt[data-ready]')],
    ['low-contrast fallback', ttComponent.replace(`background: var(--tt-bg, ${ttBg});`, `background: var(--tt-bg, #8a8a8a);`)],
    ['tip visible before it is shown', ttComponent.replace('.tt[data-ready] .tt__tip:not([data-open]) {\n    display: none;', '.tt[data-ready] .tt__tip:not([data-open]) {\n    opacity: 0;')],
  ];
  void ttFg;
  const logicMutants = [
    ['focus does not show it', stateSrc.replace("case 'focus': return { ...s, focus: true, dismissed: false };", "case 'focus': return s;")],
    ['Escape ignored', stateSrc.replace("case 'dismiss': return visible(s) ? { ...s, pinned: false, tip: false, dismissed: true } : s;", "case 'dismiss': return s;")],
    ['not hoverable', stateSrc.replace("case 'tip-enter': return { ...s, tip: true };", "case 'tip-enter': return s;")],
    ['Escape sticks for good', stateSrc.replace("case 'enter': return { ...s, hover: true, dismissed: false };", "case 'enter': return { ...s, hover: true };")],
  ];
  const placeMutants = [
    ['never flips', placeSrc.replace('const side = order.find((s) => room[s] >= need[s]) ??', 'const side = order[0] ??')],
    ['no slide along the side', placeSrc.replace('left = clamp(cx - w / 2, margin, Math.max(margin, vw - margin - w));', 'left = cx - w / 2;')],
    ['arrow not following the trigger', placeSrc.replace('arrow = clamp(cx - left, 10, Math.max(10, w - 10));', 'arrow = w / 2;')],
    ['flips to the wrong side first', placeSrc.replace("top: ['top', 'bottom', 'right', 'left']", "top: ['top', 'right', 'bottom', 'left']")],
  ];
  let killed = 0;
  killed += await mutate(id, html, renderMutants, (h) => tooltipRender(h));
  killed += await mutate(id, ttComponent, cssMutants, (c) => tooltipRender(html, c));
  killed += await mutate(id, stateSrc, logicMutants, async (js) => tooltipStateCases(await load(js, 'tooltipState')));
  killed += await mutate(id, placeSrc, placeMutants, async (js) => tooltipPlaceCases(await load(js, 'tooltipPlace')));
  finish('tooltip mutations');
  summary.push(`tooltip (${stateCases.length} state and ${placeCases.length} placement cases, no-JS render of ${roots(html, 'span', 'data-tt').length}, contrast ${contrast(ttBg, ttFg).toFixed(2)}:1, ${killed} mutants caught)`);
}

// ================================================================= responsive-table
if (ids.has('responsive-table')) {
  const id = 'responsive-table';
  const file = 'src/library/responsive-table/ResponsiveTable.astro';
  const html = page(id);
  finish('responsive-table page');
  const rtComponent = source(file);

  // ---------------------------------------------------------- 1. logic, golden cases
  // Numeric detection runs at build time, in the component's frontmatter (TypeScript).
  const numericTs = logicBlock(rtComponent, 'table-numeric');
  if (!numericTs) fail(`${id}: ${file} has no \`// <table-numeric>\` … \`// </table-numeric>\` block.`);
  finish('responsive-table numeric block');
  const loadNumeric = async (ts) => {
    const js = stripTypeScriptTypes(ts, { mode: 'strip' });
    const mod = await import(`data:text/javascript;base64,${Buffer.from(`${js}\nexport default numericColumn;`).toString('base64')}`);
    return mod.default;
  };
  const numericCases = [
    [['1', '2', '30'], true, 'plain integers'],
    [[1, 2.5, 30], true, 'numbers'],
    [['$4.95', '$12.00'], true, 'prices'],
    [['1,200', '35', '1,000,000'], true, 'thousands separators'],
    [['12%', '−3.5%', '-0.25'], true, 'percentages and signs (hyphen and minus)'],
    [['€9', '£1,250.50', '¥300'], true, 'other currencies'],
    [['—', '44', '', null, 'n/a'], true, 'blanks do not count against a column'],
    [['', null, '—'], false, 'a column of blanks is not numeric'],
    [['1959', 'Ongoing'], false, 'one word makes it text'],
    [['2026-09-26'], false, 'a date is not a number'],
    [['1,20'], false, 'a misplaced separator'],
    [['4.95 USD'], false, 'a trailing unit'],
    [['Apollo', 'Gemini'], false, 'words'],
    [[Infinity], false, 'a non-finite number'],
  ];
  const tableNumericCases = (numericColumn) => {
    const out = [];
    for (const [values, want, label] of numericCases) {
      const got = numericColumn(values);
      if (got !== want) out.push(`numericColumn(${JSON.stringify(values)}) is ${got}, expected ${want} (${label}).`);
    }
    return out;
  };
  const edgeCases = [
    // [label, scrollLeft, scrollWidth, clientWidth, rtl, { overflow, start, end }]
    ['fits: no fades, no hint', 0, 600, 600, false, { overflow: false, start: false, end: false }],
    ['one pixel over is rounding, not overflow', 0, 601, 600, false, { overflow: false, start: false, end: false }],
    ['at the start: more at the end only', 0, 1200, 600, false, { overflow: true, start: false, end: true }],
    ['in the middle: both', 300, 1200, 600, false, { overflow: true, start: true, end: true }],
    ['at the end: more at the start only', 600, 1200, 600, false, { overflow: true, start: true, end: false }],
    ['sub-pixel short of the end counts as the end', 599.4, 1200, 600, false, { overflow: true, start: true, end: false }],
    ['right-to-left, at the start (scrollLeft 0)', 0, 1200, 600, true, { overflow: true, start: false, end: true }],
    ['right-to-left, at the end (scrollLeft negative)', -600, 1200, 600, true, { overflow: true, start: true, end: false }],
    ['right-to-left, in the middle', -250, 1200, 600, true, { overflow: true, start: true, end: true }],
  ];
  const tableEdgeCases = (E) => {
    const out = [];
    for (const [label, sl, sw, cw, rtl, want] of edgeCases) {
      const got = E.edges(sl, sw, cw, rtl);
      for (const k of Object.keys(want)) if (got[k] !== want[k]) out.push(`${label}: ${k} is ${got[k]}, expected ${want[k]}.`);
    }
    return out;
  };
  const numericColumn = await loadNumeric(numericTs);
  for (const m of tableNumericCases(numericColumn)) fail(`${id}: ${m}`);
  const edgesSrc = shippedBlock(id, html, file, 'table-edges');
  finish('responsive-table blocks');
  for (const m of tableEdgeCases(await load(edgesSrc, 'tableEdges'))) fail(`${id}: ${m}`);
  finish('responsive-table logic');

  // ---------------------------------------------------------- 2. no-JS render and CSS
  const tableRender = (page, css = rtComponent) => {
    const out = [];
    const f = (m) => out.push(m);
    const tables = roots(page, 'div', 'data-rt');
    const modes = new Set(tables.map((t) => attr(t.open, 'data-rt')));
    if (!modes.has('cards') || !modes.has('scroll')) f('the demo needs one table in cards mode and one in scroll mode.');
    if (!tables.some((t) => /\brt--sticky\b/.test(attr(t.open, 'class') ?? ''))) f('the demo needs a sticky table.');
    for (const [n, t] of tables.entries()) {
      const where = `table ${n + 1}`;
      const mode = attr(t.open, 'data-rt');
      if (has(t.open, 'data-ready') || has(t.open, 'data-more-end')) f(`${where}: rendered as if the script had run.`);
      const table = t.html.match(/<table\b[^>]*>/)?.[0];
      if (!table) {
        f(`${where}: no <table>.`);
        continue;
      }
      if (attr(table, 'role') !== 'table') f(`${where}: the <table> needs role="table" (cards drop table semantics without it).`);
      const cap = t.html.match(/<table\b[^>]*>\s*<caption\b([^>]*)>([\s\S]*?)<\/caption>/);
      if (!cap || !text(cap[2])) f(`${where}: no <caption> with text as the table's first child.`);
      const heads = [...t.html.matchAll(/<thead\b[^>]*>[\s\S]*?<\/thead>/g)][0]?.[0] ?? '';
      if (!/<thead\b[^>]*role="rowgroup"/.test(heads) || !/<tbody\b[^>]*role="rowgroup"/.test(t.html)) f(`${where}: thead and tbody need role="rowgroup".`);
      const cols = [...heads.matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/g)].map((m) => ({ open: `<th${m[1]}>`, label: text(m[2]) }));
      if (!cols.length) f(`${where}: no column headers.`);
      cols.forEach((c) => {
        if (attr(c.open, 'scope') !== 'col') f(`${where}: column header "${c.label}" has no scope="col".`);
        if (attr(c.open, 'role') !== 'columnheader') f(`${where}: column header "${c.label}" has no role="columnheader".`);
      });
      const body = t.html.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/)?.[1] ?? '';
      const rows = [...body.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g)];
      if (!rows.length) f(`${where}: no rows.`);
      const columnValues = cols.map(() => []);
      const columnNum = cols.map(() => []);
      rows.forEach((r, ri) => {
        if (attr(`<tr${r[1]}>`, 'role') !== 'row') f(`${where}: row ${ri + 1} has no role="row".`);
        const cells = [...r[2].matchAll(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/g)];
        if (cells.length !== cols.length) f(`${where}: row ${ri + 1} has ${cells.length} cells for ${cols.length} columns.`);
        cells.forEach(([, tag, attrs, inner], ci) => {
          const open = `<${tag}${attrs}>`;
          const col = cols[ci];
          if (!col) return;
          columnValues[ci].push(text(inner));
          columnNum[ci].push(/\brt__num\b/.test(attr(open, 'class') ?? ''));
          if (tag === 'th') {
            if (attr(open, 'scope') !== 'row' || attr(open, 'role') !== 'rowheader') f(`${where}: row ${ri + 1}'s header cell needs scope="row" and role="rowheader".`);
          } else {
            if (attr(open, 'role') !== 'cell') f(`${where}: row ${ri + 1}, "${col.label}": no role="cell".`);
            if (decode(attr(open, 'data-label') ?? '') !== col.label) f(`${where}: row ${ri + 1}, "${col.label}": data-label is "${decode(attr(open, 'data-label') ?? '')}"; the card would label it wrongly.`);
          }
        });
        if (!/<th\b[^>]*scope="row"/.test(r[2])) f(`${where}: row ${ri + 1} has no row header.`);
      });
      // Numbers: a column's header and cells agree, and agree with the checked detection.
      cols.forEach((c, ci) => {
        const headNum = /\brt__num\b/.test(attr(c.open, 'class') ?? '');
        if (columnNum[ci].some((v) => v !== headNum)) f(`${where}: column "${c.label}" is aligned as a number in some cells and not others.`);
        if (numericColumn(columnValues[ci]) !== headNum) f(`${where}: column "${c.label}" is ${headNum ? '' : 'not '}marked numeric, but its values say otherwise.`);
      });
      const box = t.html.match(/<div\b[^>]*\sdata-rt-box[^>]*>/)?.[0] ?? '';
      const hint = t.html.match(/<p\b[^>]*\sdata-rt-hint[^>]*>/)?.[0];
      if (mode === 'scroll') {
        if (attr(box, 'role') !== 'region') f(`${where}: the scrollbox must be role="region".`);
        if (!cap || attr(box, 'aria-labelledby') !== attr(`<caption${cap[1]}>`, 'id')) f(`${where}: the scrollbox must be labelled by the caption's id.`);
        if (attr(box, 'tabindex') !== '0') f(`${where}: the scrollbox must be focusable (tabindex="0") so a keyboard can scroll it.`);
        if (!hint) f(`${where}: no scroll hint.`);
        else {
          if (!has(hint, 'hidden')) f(`${where}: the hint must be hidden until the script knows the box overflows.`);
          if (attr(hint, 'aria-hidden') !== 'true') f(`${where}: the hint must be aria-hidden.`);
        }
      } else {
        if (attr(box, 'role') || attr(box, 'tabindex')) f(`${where}: a cards table is not a region or a Tab stop.`);
        if (hint) f(`${where}: a cards table has no scroll hint.`);
      }
    }
    const runtimes = (page.match(/window\.__superheroResponsiveTable\s*=/g) || []).length;
    if (runtimes !== (modes.has('scroll') ? 1 : 0)) f(`the scroll runtime is on the page ${runtimes} times; it must be emitted once, and only with a scroll table.`);
    // Cards are CSS only: each size turns rows into blocks and draws data-label.
    if (!/\.rt \{\s*container: rtable \/ inline-size;/.test(css)) f('the root must be the `rtable` inline-size container.');
    for (const [size, rem] of [['sm', 30], ['md', 40], ['lg', 52]]) {
      const q = css.match(new RegExp(`@container rtable \\(width < ${rem}rem\\) \\{([\\s\\S]*?)\\n  \\}\\n`))?.[1] ?? '';
      const c = `.rt--cards.rt--${size}`;
      if (!q.includes(`${c} td {\n      display: block;`)) f(`no \`@container rtable (width < ${rem}rem)\` block turning ${c} rows into blocks.`);
      if (!q.includes(`${c} td::before {\n      content: attr(data-label);\n      content: attr(data-label) / '';`)) f(`the ${size} card block must draw each cell's label from data-label, with empty alternative text so it is not read twice.`);
      if (!q.includes(`${c} thead {`)) f(`the ${size} card block must hide the header row visually (the labels replace it).`);
    }
    if (!/\.rt--scroll \.rt__frame:has\(> \.rt__box:focus-visible\) \{\s*outline:/.test(css)) f('the scrollbox needs a visible focus ring (on the frame: the mask would hide one on the box).');
    return out;
  };
  for (const m of tableRender(html)) fail(`${id}: ${m}`);
  finish('responsive-table render');

  // ---------------------------------------------------------- 3. mutations
  const firstTd = html.match(/<td\b[^>]*data-label="[^"]*"[^>]*>/)[0];
  const firstCol = html.match(/<th scope="col"[^>]*>/)[0];
  const numHead = html.match(/<th scope="col"[^>]*class="rt__num"[^>]*>/)[0];
  const scrollBox = html.match(/<div\b[^>]*role="region"[^>]*data-rt-box[^>]*>/)[0];
  const hintTag = html.match(/<p\b[^>]*data-rt-hint[^>]*>/)[0];
  const renderMutants = [
    ['caption removed', html.replace(/<caption\b[^>]*>[\s\S]*?<\/caption>/, '')],
    ['a wrong data-label', html.replace(firstTd, firstTd.replace(/data-label="[^"]*"/, 'data-label="Something else"'))],
    ['a column header without scope', html.replace(firstCol, firstCol.replace(' scope="col"', ''))],
    ['a cell without role', html.replace(firstTd, firstTd.replace(' role="cell"', ''))],
    ['a row header without scope', html.replace('<th scope="row"', '<th')],
    ['table role removed', html.replace('<table class="rt__table" role="table"', '<table class="rt__table"')],
    ['a numeric column not aligned', html.replace(numHead, numHead.replace(' class="rt__num"', ''))],
    ['scrollbox not focusable', html.replace(scrollBox, scrollBox.replace(' tabindex="0"', ''))],
    ['scrollbox unnamed', html.replace(scrollBox, scrollBox.replace(/ aria-labelledby="[^"]*"/, ''))],
    ['hint shown before the script', html.replace(hintTag, hintTag.replace(/ hidden(?=[\s>])/, ''))],
    ['runtime emitted twice', html.replace('</body>', '<script>window.__superheroResponsiveTable = {};</script></body>')],
  ];
  const cssMutants = [
    ['sm rows never become cards', rtComponent.replace('.rt--cards.rt--sm td {\n      display: block;', '.rt--cards.rt--sm td {\n      display: table-cell;')],
    ['md cards without labels', rtComponent.replace('.rt--cards.rt--md td::before {\n      content: attr(data-label);', '.rt--cards.rt--md td::before {\n      content: "";')],
    ['lg card labels read twice', rtComponent.replace(".rt--cards.rt--lg td::before {\n      content: attr(data-label);\n      content: attr(data-label) / '';", ".rt--cards.rt--lg td::before {\n      content: attr(data-label);")],
    ['lg cards keep the header row', rtComponent.replace('.rt--cards.rt--lg thead {', '.rt--cards.rt--lg thead:not(*) {')],
    ['the root no longer a container', rtComponent.replace('container: rtable / inline-size;', '')],
    ['no focus ring on the scrollbox', rtComponent.replace('.rt--scroll .rt__frame:has(> .rt__box:focus-visible) {', '.rt--scroll .rt__frame:has(> .rt__box:hover) {')],
  ];
  const numericMutants = [
    ['thousands separators refused', numericTs.replace('(\\d{1,3}(,\\d{3})+|\\d+)', '(\\d+)')],
    ['blanks count as text', numericTs.replace('if (BLANK.test(s)) continue;', '')],
    ['a column of blanks counts as numeric', numericTs.replace('return numbers > 0;', 'return true;')],
  ];
  const edgeMutants = [
    ['right-to-left ignored', edgesSrc.replace('const pos = rtl ? -scrollLeft : scrollLeft;', 'const pos = scrollLeft;')],
    ['no tolerance at the end', edgesSrc.replace('end: pos < max - 1', 'end: pos < max')],
    ['rounding counts as overflow', edgesSrc.replace('if (max < 2)', 'if (max < 1)')],
  ];
  let killed = 0;
  killed += await mutate(id, html, renderMutants, (h) => tableRender(h));
  killed += await mutate(id, rtComponent, cssMutants, (c) => tableRender(html, c));
  killed += await mutate(id, numericTs, numericMutants, async (ts) => tableNumericCases(await loadNumeric(ts)));
  killed += await mutate(id, edgesSrc, edgeMutants, async (js) => tableEdgeCases(await load(js, 'tableEdges')));
  finish('responsive-table mutations');
  summary.push(`responsive-table (${numericCases.length} numeric and ${edgeCases.length} edge cases, no-JS render of ${roots(html, 'div', 'data-rt').length}, ${killed} mutants caught)`);
}

console.log(`check-structure ok: ${summary.join('; ')}.`);
