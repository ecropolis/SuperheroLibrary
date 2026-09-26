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
 *                   breakpoint lives only in the stylesheet (--tc-layout), and the runtime is
 *                   emitted once per page.
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
    const sets = roots(page, 'div', 'data-tc');
    if (sets.length !== 2) f(`the demo should render 2 tabcordions (resizable and sidebar); found ${sets.length}.`);
    if (!sets.some((s) => has(s.open, 'data-multiple')) || sets.every((s) => has(s.open, 'data-multiple'))) f('the demo needs one tabcordion with multiple and one without.');
    for (const [n, s] of sets.entries()) {
      const where = `tabcordion ${n + 1}`;
      if (!/\btc--(sm|md|lg)\b/.test(attr(s.open, 'class') ?? '')) f(`${where}: no breakpoint class (tc--sm, tc--md or tc--lg).`);
      if (has(s.open, 'data-ready') || has(s.open, 'data-layout')) f(`${where}: rendered as if the script had run (data-ready / data-layout).`);
      const list = s.html.match(/<div\b[^>]*\srole="tablist"[^>]*>/)?.[0];
      if (!list) f(`${where}: no role="tablist" in the HTML.`);
      else {
        if (!has(list, 'hidden')) f(`${where}: the tablist must be hidden until the script runs; without it, its tabs do nothing.`);
        if (!attr(list, 'aria-label')) f(`${where}: the tablist has no aria-label.`);
      }
      const tabs = [...s.html.matchAll(/<button\b[^>]*\srole="tab"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => ({ open: m[0].slice(0, m[0].indexOf('>') + 1), label: text(m[1]) }));
      const panels = [...s.html.matchAll(/<section\b[^>]*\sdata-tc-panel[^>]*>/g)].map((m) => ({ open: m[0], html: block(s.html, m.index, 'section') }));
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
        const heading = p.html.match(/<(h[2-4])\b[^>]*class="tc__heading[^"]*"[^>]*>([\s\S]*?)<\/\1>/);
        if (!heading) f(`${where}: panel #${pid} has no h2–h4 heading.`);
        else if (text(heading[2]) !== t.label) f(`${where}: panel #${pid}'s heading "${text(heading[2])}" is not its tab's label "${t.label}".`);
        const body = p.html.match(/<div\b[^>]*class="tc__body[^"]*"[^>]*>([\s\S]*)<\/div>\s*<\/section>$/);
        if (!body || !text(body[1])) f(`${where}: panel #${pid} is empty in the static HTML.`);
        else if (has(body[0], 'hidden')) f(`${where}: panel #${pid}'s body is hidden in the static HTML.`);
      });
      if (/aria-expanded=/.test(s.html)) f(`${where}: aria-expanded in the static HTML; the accordion buttons exist only once the script can run them.`);
    }
    const runtimes = (page.match(/window\.__superheroTabcordion\s*=/g) || []).length;
    if (sets.length && runtimes !== 1) f(`the runtime is on the page ${runtimes} times; it must be emitted once.`);
    // The breakpoint lives in the stylesheet only: each size sets --tc-layout: tabs in a
    // container query on the element's own width, and the script reads that property.
    for (const [size, rem] of [['sm', 30], ['md', 40], ['lg', 52]]) {
      const re = new RegExp(`@container tabcordion \\(min-width: ${rem}rem\\) \\{\\s*\\.tc--${size} > \\.tc__frame \\{\\s*--tc-layout: tabs;`);
      if (!re.test(css)) f(`the stylesheet has no \`@container tabcordion (min-width: ${rem}rem) { .tc--${size} > .tc__frame { --tc-layout: tabs; } }\`.`);
    }
    if (!/\.tc \{\s*container: tabcordion \/ inline-size;/.test(css)) f('the root must be the `tabcordion` inline-size container, or the queries measure the wrong box.');
    if (!/getPropertyValue\('--tc-layout'\)/.test(css)) f('the script must read --tc-layout rather than measure a width of its own.');
    if (/matchMedia\(|innerWidth|clientWidth\s*[<>]/.test(css)) {
      f('the script measures the width itself (matchMedia / innerWidth / clientWidth); the container query is the one breakpoint.');
    }
    return out;
  };
  for (const m of tabcordionRender(html)) fail(`${id}: ${m}`);
  finish('tabcordion render');

  // ---------------------------------------------------------- 3. mutations
  const firstPanel = html.match(/<section\b[^>]*\sdata-tc-panel[^>]*>/)[0];
  const renderMutants = [
    ['tablist not hidden', html.replace(/(<div\b[^>]*role="tablist"[^>]*?)\shidden/, '$1')],
    ['a panel hidden', html.replace(firstPanel, firstPanel.replace('<section', '<section hidden'))],
    ['a panel with role before the script', html.replace(firstPanel, firstPanel.replace('<section', '<section role="tabpanel"'))],
    ['a heading that does not match its tab', html.replace(/(<h[2-4]\b[^>]*class="tc__heading[^"]*"[^>]*>\s*<span[^>]*>)([^<]+)/, '$1Something else')],
    ['a tab controlling the wrong panel', html.replace(/(role="tab"[^>]*?)aria-controls="[^"]+"/, '$1aria-controls="nowhere"')],
    ['a tab pre-selected', html.replace(/aria-selected="false"/, 'aria-selected="true"')],
    ['aria-expanded in the static HTML', html.replace(firstPanel, firstPanel.replace('<section', '<section aria-expanded="true"'))],
    ['runtime emitted twice', html.replace('</body>', '<script>window.__superheroTabcordion = {};</script></body>')],
  ];
  const cssMutants = [
    ['the md container query removed', tcComponent.replace('@container tabcordion (min-width: 40rem)', '@media (min-width: 40rem)')],
    ['the root no longer a container', tcComponent.replace('container: tabcordion / inline-size;', '')],
    ['the script measuring the window', tcComponent.replace("getPropertyValue('--tc-layout').trim() === 'tabs'", "getPropertyValue('--tc-layout').trim() === 'tabs' || matchMedia('(min-width: 40rem)').matches")],
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
  summary.push(`tabcordion (golden cases, no-JS render of ${roots(html, 'div', 'data-tc').length}, ${killed} mutants caught)`);
}

console.log(`check-structure ok: ${summary.join('; ')}.`);
