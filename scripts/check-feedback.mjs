#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the feedback elements:
 * notice, toast and loading. Each section runs when its element is in the catalogue.
 *
 * notice
 * 1. On the built demo page and the gallery index (what a visitor without JavaScript gets):
 *    every notice is shown (never `hidden`), its role follows its kind (status for info and
 *    success, alert for warning and danger), the kind is said in a visually hidden word, the
 *    icon is aria-hidden. A dismissible one has a close <button type="button"> with a name,
 *    `hidden` until the script runs, a key/version config, and the one-line mount script
 *    straight after it; a plain one has neither. The runtime is emitted once per page.
 * 2. Contrast, from the component's CSS: every kind's fallback text on its ground ≥ 4.5:1, its
 *    accent (edge and icon) ≥ 3:1. The close button is 44px.
 *
 * toast
 * 3. On both built pages: exactly one region, role="region" aria-live="polite" named
 *    "Notifications", rendered `hidden` with no toast in it (without JavaScript nothing shows),
 *    icon templates aria-hidden, the mount script straight after it and the runtime once.
 * 4. The runtime itself: the source between the `<tst-runtime>` markers, types stripped by
 *    Node, run against a small DOM stand-in with a fake clock: text is text, the default and
 *    per-toast timeouts, the 4 s floor, pause and resume on hover, on focus and in a hidden
 *    tab, an action never auto-dismissing, at most three (the oldest leaves), Escape closing
 *    the focused toast and focus moving on, javascript: hrefs refused, data-toast buttons,
 *    reduced motion removing at once. Contrast of the fallbacks from the CSS; animation only
 *    under prefers-reduced-motion: no-preference.
 *
 * Mutation tests: every section re-runs its own rules on copies of the page or source with one
 * known fault planted (a warning given role="status", a close button shown without JavaScript,
 * a text colour too light…) and fails if a rule no longer notices it. A rule that cannot fail
 * is not a rule.
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
  console.error(`check-feedback failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

let ids;
try {
  const { catalog } = await import(pathToFileURL(join(root, 'src/data/catalog.ts')).href);
  ids = new Set(catalog.map((e) => e.id));
} catch {
  ids = new Set([...readFileSync(join(root, 'src/data/catalog.ts'), 'utf8').matchAll(/^\s{4}id: '([a-z0-9-]+)'/gm)].map((m) => m[1]));
}

const readRel = (rel) => {
  const path = join(root, rel);
  if (!existsSync(path)) {
    fail(`${rel} is missing; run astro build (check-catalog.mjs does).`);
    return '';
  }
  return readFileSync(path, 'utf8');
};
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const decode = (s) => s?.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
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
const text = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

// WCAG 2 relative luminance and contrast.
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

/**
 * Runs `rules` on a copy of `input` with one fault planted by `plant`; the rules must object.
 * `rules` returns a list of failure sentences and must not call fail() itself.
 */
const mutants = [];
const mutation = (element, label, input, plant, rules) => {
  const planted = plant(input);
  if (planted === input) {
    fail(`${element} mutation "${label}": the fault could not be planted; the page or source changed shape, so update the mutation.`);
    return;
  }
  if (!rules(planted).length) fail(`${element} mutation "${label}": the check did not notice it.`);
  mutants.push(`${element}: ${label}`);
};
const summary = [];

// ------------------------------------------------------------------ a small DOM stand-in
/**
 * Just enough of the DOM for the runtimes here: elements with attributes, classes, text,
 * children, events that bubble to the document, focus with focusin/focusout, and the simple
 * selectors the runtimes use ([attr], [attr="v"], tag[attr="v"]). A fake clock drives
 * setTimeout. It is not a browser; it pins the contract the runtimes rely on.
 */
function standIn({ reduce = false } = {}) {
  let clock = 1_000_000;
  let nextId = 1;
  const timers = new Map();
  const listen = (o) => {
    o.listeners = {};
    o.addEventListener = (type, fn) => (o.listeners[type] ||= []).push(fn);
    o.removeEventListener = (type, fn) => (o.listeners[type] = (o.listeners[type] || []).filter((f) => f !== fn));
  };
  const doc = { hidden: false, activeElement: null, getElementById: () => null };
  listen(doc);
  const fire = (target, type, extra = {}) => {
    const ev = { type, target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
    for (let n = target; n; n = n === doc ? null : n.parentNode || (n.isBody ? doc : null)) (n.listeners[type] || []).slice().forEach((fn) => fn(ev));
    return ev;
  };
  const match = (el, sel) => {
    const m = sel.match(/^([a-z]*)\[([\w-]+)(?:="([^"]*)")?\]$/);
    if (!m) throw new Error(`stand-in: unsupported selector ${sel}`);
    if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
    if (!el.attrs.has(m[2])) return false;
    return m[3] === undefined || el.attrs.get(m[2]) === m[3];
  };
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.attrs = new Map();
      this.children = [];
      this.parentNode = null;
      this.own = '';
      this.style = { props: {}, setProperty: (k, v) => (this.style.props[k] = v), removeProperty: (k) => delete this.style.props[k] };
      const self = this;
      this.classList = {
        add: (c) => self.setAttribute('class', [...new Set([...self.className.split(/\s+/).filter(Boolean), c])].join(' ')),
        remove: (c) => self.setAttribute('class', self.className.split(/\s+/).filter((x) => x && x !== c).join(' ')),
        contains: (c) => self.className.split(/\s+/).includes(c),
      };
      listen(this);
    }
    setAttribute(k, v) { this.attrs.set(k, String(v)); }
    getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
    hasAttribute(k) { return this.attrs.has(k); }
    removeAttribute(k) { this.attrs.delete(k); }
    toggleAttribute(k, on) { if (on === undefined ? !this.attrs.has(k) : on) this.attrs.set(k, ''); else this.attrs.delete(k); }
    get hidden() { return this.attrs.has('hidden'); }
    set hidden(v) { this.toggleAttribute('hidden', !!v); }
    get inert() { return this.attrs.has('inert'); }
    set inert(v) { this.toggleAttribute('inert', !!v); }
    get className() { return this.getAttribute('class') || ''; }
    set className(v) { this.setAttribute('class', v); }
    get textContent() { return this.own + this.children.map((c) => c.textContent).join(''); }
    set textContent(v) { this.children.forEach((c) => (c.parentNode = null)); this.children = []; this.own = String(v); }
    get isConnected() { for (let n = this; n; n = n.parentNode) if (n.isBody) return true; return false; }
    append(...nodes) {
      for (const n of nodes) {
        if (n.isFragment) { this.append(...n.children); continue; }
        n.remove();
        n.parentNode = this;
        this.children.push(n);
      }
    }
    remove() {
      if (!this.parentNode) return;
      const p = this.parentNode;
      if (this.contains(doc.activeElement)) doc.activeElement = null;
      p.children = p.children.filter((c) => c !== this);
      this.parentNode = null;
    }
    contains(n) { for (; n; n = n.parentNode) if (n === this) return true; return false; }
    matches(sel) { return match(this, sel); }
    closest(sel) { for (let n = this; n && n.attrs; n = n.parentNode) if (match(n, sel)) return n; return null; }
    querySelectorAll(sel) { const out = []; const walk = (n) => n.children.forEach((c) => { if (match(c, sel)) out.push(c); walk(c); }); walk(this); return out; }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    focus() {
      const prev = doc.activeElement;
      if (prev === this) return;
      if (prev) fire(prev, 'focusout', { relatedTarget: this });
      doc.activeElement = this;
      fire(this, 'focusin', { relatedTarget: prev });
    }
    blur() { if (doc.activeElement !== this) return; doc.activeElement = null; fire(this, 'focusout', { relatedTarget: null }); }
    click() { return fire(this, 'click'); }
    getBoundingClientRect() { return { top: 0, height: 0, width: 0 }; }
  }
  doc.createElement = (tag) => new El(tag);
  doc.body = new El('body');
  doc.body.isBody = true;
  const template = (name) => {
    const t = new El('template');
    t.setAttribute('data-tst-icon', name);
    t.content = { cloneNode: () => { const svg = new El('svg'); svg.setAttribute('aria-hidden', 'true'); return { isFragment: true, children: [svg] }; } };
    return t;
  };
  const win = {
    document: doc,
    innerHeight: 800,
    console: { warn() {}, error() {} },
    Date: { now: () => clock },
    matchMedia: (q) => ({ matches: reduce && /reduce/.test(q) }),
    setTimeout: (fn, ms) => { const id = nextId++; timers.set(id, { at: clock + ms, fn }); return id; },
    clearTimeout: (id) => timers.delete(id),
  };
  const advance = (ms) => {
    const end = clock + ms;
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      clock = due[1].at;
      due[1].fn();
    }
    clock = end;
  };
  return { win, doc, El, fire, advance, template };
}


// ---------------------------------------------------------------------------------- notice
if (ids.has('notice')) {
  const file = 'src/library/notice/Notice.astro';
  const src = readFileSync(join(root, file), 'utf8');
  const ROLE = { info: 'status', success: 'status', warning: 'alert', danger: 'alert' };

  /** The rules for one built page. */
  const noticePage = (html, rel, demo) => {
    const out = [];
    const roots = [...html.matchAll(/<div\b[^>]*\sclass="nt nt--([a-z]+)\b[^"]*"[^>]*>/g)];
    if (demo) {
      const kinds = roots.map((r) => r[1]).sort().join(',');
      if (kinds !== 'danger,info,success,warning') out.push(`${rel}: expected the demo's four notices, one of each kind; found ${kinds || 'none'}.`);
    }
    let dismissible = 0;
    roots.forEach((r, i) => {
      const [tag, kind] = r;
      const where = `${rel}, notice ${i + 1} (${kind})`;
      const body = block(html, r.index, 'div');
      if (!ROLE[kind]) {
        out.push(`${where}: "${kind}" is not a kind.`);
        return;
      }
      if (attr(tag, 'role') !== ROLE[kind]) out.push(`${where}: role="${attr(tag, 'role')}", expected "${ROLE[kind]}" for a ${kind} notice.`);
      if (attr(tag, 'hidden') !== undefined) out.push(`${where}: rendered hidden; without JavaScript a notice must show.`);
      const sr = body.match(/<span\b[^>]*class="nt__sr"[^>]*>([^<]*)<\/span>/);
      if (!sr || !/\S+: $/.test(decode(sr[1]))) out.push(`${where}: no visually hidden kind word ("Warning: ") before the message.`);
      const icon = body.match(/<svg\b[^>]*class="nt__icon"[^>]*>/);
      if (icon && (attr(icon[0], 'aria-hidden') !== 'true' || attr(icon[0], 'focusable') !== 'false')) out.push(`${where}: the icon must be aria-hidden="true" focusable="false".`);
      const close = body.match(/<button\b[^>]*\sdata-nt-close[^>]*>/);
      const cfgRaw = attr(tag, 'data-nt');
      if (cfgRaw === undefined) {
        if (close) out.push(`${where}: a close button on a notice without a dismissal config.`);
        return;
      }
      dismissible++;
      let cfg = {};
      try {
        cfg = JSON.parse(decode(cfgRaw));
      } catch {
        out.push(`${where}: data-nt is not JSON.`);
      }
      if (!cfg.key || !cfg.version) out.push(`${where}: the dismissal config has no key and version.`);
      if (!close) out.push(`${where}: dismissible, but no close button.`);
      else {
        if (attr(close[0], 'type') !== 'button') out.push(`${where}: the close button needs type="button".`);
        if (!attr(close[0], 'aria-label')) out.push(`${where}: the close button has no aria-label.`);
        if (attr(close[0], 'hidden') === undefined) out.push(`${where}: the close button must be hidden until the script can make it work.`);
      }
      const next = html.slice(r.index + body.length, r.index + body.length + 4000);
      if (!/^\s*<script>[\s\S]*?window\.__superheroNotice\.mount\(document\.currentScript\.previousElementSibling\);<\/script>/.test(next)) {
        out.push(`${where}: the mount script must come straight after the notice, or a notice closed earlier in the visit flashes before it hides.`);
      }
    });
    if (demo && dismissible !== 1) out.push(`${rel}: expected 1 dismissible notice in the demo, found ${dismissible}.`);
    const defs = (html.match(/window\.__superheroNotice=window\.__superheroNotice\|\|/g) || []).length;
    if (dismissible && defs !== 1) out.push(`${rel}: the notice runtime is defined ${defs} times; it must be once per page.`);
    return out;
  };

  /** The rules for the source: contrast per kind, 44px close. */
  const ratios = [];
  const noticeSource = (s) => {
    const out = [];
    ratios.length = 0;
    for (const kind of Object.keys(ROLE)) {
      const rule = s.match(
        new RegExp(`\\.nt--${kind} \\{\\s*background: var\\(--nt-${kind}-bg, (#[0-9a-f]{3,6})\\);\\s*color: var\\(--nt-${kind}-fg, (#[0-9a-f]{3,6})\\);\\s*--_nt-accent: var\\(--nt-${kind}-accent, (#[0-9a-f]{3,6})\\);`, 'i'),
      );
      if (!rule) {
        out.push(`${file}: no \`.nt--${kind} { background: var(--nt-${kind}-bg, #…); color: var(--nt-${kind}-fg, #…); --_nt-accent: var(--nt-${kind}-accent, #…); }\` rule to measure.`);
        continue;
      }
      const [, bg, fg, accent] = rule;
      const t = ratio(fg, bg);
      const a = ratio(accent, bg);
      ratios.push(`${kind} ${t.toFixed(2)}/${a.toFixed(2)}`);
      if (t < 4.5) out.push(`notice "${kind}": text ${fg} on ${bg} is ${t.toFixed(2)}:1, under 4.5:1.`);
      if (a < 3) out.push(`notice "${kind}": accent ${accent} on ${bg} is ${a.toFixed(2)}:1, under 3:1 for the edge and icon.`);
    }
    if (!/\.nt__close \{[^}]*width: 2\.75rem;[^}]*height: 2\.75rem;/.test(s)) out.push(`${file}: the close button must be 2.75rem (44px) square.`);
    if (!/\.nt__text :global\(a\) \{\s*color: inherit;/.test(s)) out.push(`${file}: links in a notice must inherit its text colour, or their contrast needs measuring here too.`);
    return out;
  };

  const demoRel = 'dist/notice/index.html';
  const demoHtml = readRel(demoRel);
  for (const [rel, html] of [[demoRel, demoHtml], ['dist/index.html', readRel('dist/index.html')]]) if (html) noticePage(html, rel, rel === demoRel).forEach(fail);
  noticeSource(src).forEach(fail);
  const measured = [...ratios];
  finish('notice');

  const pageRules = (h) => noticePage(h, demoRel, true);
  mutation('notice', 'a warning given role="status"', demoHtml, (h) => h.replace(/(class="nt nt--warning"[^>]*\srole=)"alert"/, '$1"status"'), pageRules);
  mutation('notice', 'an info notice given role="alert"', demoHtml, (h) => h.replace(/(class="nt nt--info"[^>]*\srole=)"status"/, '$1"alert"'), pageRules);
  mutation('notice', 'a notice rendered hidden', demoHtml, (h) => h.replace(/(<div class="nt nt--success")/, '$1 hidden'), pageRules);
  mutation('notice', 'the close button shown without JavaScript', demoHtml, (h) => h.replace(/(data-nt-close) hidden/, '$1'), pageRules);
  mutation('notice', 'the mount script moved away from its notice', demoHtml, (h) => h.replace(/(<\/button><\/div>)(<script>)/, '$1<p>x</p>$2'), pageRules);
  mutation('notice', 'the kind word removed', demoHtml, (h) => h.replace(/<span class="nt__sr"[^>]*>Error: <\/span>/, ''), pageRules);
  mutation('notice', 'the runtime emitted twice', demoHtml, (h) => h.replace(/(<\/body>)/, '<script>window.__superheroNotice=window.__superheroNotice||1</script>$1'), pageRules);
  mutation('notice', 'warning text too light', src, (s) => s.replace('--nt-warning-fg, #553800', '--nt-warning-fg, #b08a3a'), noticeSource);
  mutation('notice', 'danger accent too light', src, (s) => s.replace('--nt-danger-accent, #b42318', '--nt-danger-accent, #f0a8a8'), noticeSource);
  mutation('notice', 'a 32px close button', src, (s) => s.replace(/(\.nt__close \{[^}]*)width: 2\.75rem;/, '$1width: 2rem;'), noticeSource);
  finish('notice mutations');
  summary.push(`notice: roles, no-JS render and mount order on 2 pages; contrast (text/accent) ${measured.join(', ')}`);
}

// ----------------------------------------------------------------------------------- toast
if (ids.has('toast')) {
  const file = 'src/library/toast/Toast.astro';
  const src = readFileSync(join(root, file), 'utf8');

  const toastPage = (html, rel) => {
    const out = [];
    const regions = [...html.matchAll(/<div\b[^>]*\sclass="tst tst--[a-z-]+[^"]*"[^>]*>/g)];
    if (regions.length !== 1) {
      out.push(`${rel}: expected exactly one toast region, found ${regions.length}.`);
      if (!regions.length) return out;
    }
    const r = regions[0];
    const tag = r[0];
    const where = `${rel}, toast region`;
    if (attr(tag, 'role') !== 'region') out.push(`${where}: not role="region".`);
    if (attr(tag, 'aria-live') !== 'polite') out.push(`${where}: aria-live="${attr(tag, 'aria-live')}", expected "polite".`);
    if (attr(tag, 'aria-label') !== 'Notifications') out.push(`${where}: named "${attr(tag, 'aria-label')}", expected "Notifications".`);
    if (attr(tag, 'hidden') === undefined) out.push(`${where}: must be rendered hidden; without JavaScript no toast can exist, so nothing shows.`);
    let cfg = {};
    try {
      cfg = JSON.parse(decode(attr(tag, 'data-tst')));
    } catch {
      out.push(`${where}: data-tst is not JSON.`);
    }
    if (!(cfg.timeout >= 0) || !cfg.closeLabel) out.push(`${where}: the config has no timeout or closeLabel.`);
    const body = block(html, r.index, 'div');
    const inner = body.replace(/<template\b[\s\S]*?<\/template>/g, '');
    if (/tst__item|data-tst-item/.test(inner)) out.push(`${where}: a toast in the static HTML; toasts are made by script only.`);
    for (const name of ['info', 'success', 'warning', 'danger', 'close']) {
      const t = body.match(new RegExp(`<template data-tst-icon="${name}"[^>]*>\\s*(<svg\\b[^>]*>)`));
      if (!t) out.push(`${where}: no icon template for "${name}".`);
      else if (attr(t[1], 'aria-hidden') !== 'true') out.push(`${where}: the "${name}" icon must be aria-hidden.`);
    }
    const next = html.slice(r.index + body.length, r.index + body.length + 200);
    if (!/^\s*<script>window\.__superheroToast=window\.__superheroToast\|\|/.test(next)) out.push(`${where}: the runtime script must come straight after the region.`);
    if (!html.includes('window.__superheroToast.mount(document.currentScript.previousElementSibling)')) out.push(`${where}: the region is never mounted.`);
    const defs = (html.match(/window\.__superheroToast=window\.__superheroToast\|\|/g) || []).length;
    if (defs !== 1) out.push(`${rel}: the toast runtime is defined ${defs} times; it must be once per page.`);
    return out;
  };

  /** Runs the runtime in `source` (the whole .astro file) against the stand-in; returns failures. */
  const behaviours = async (source) => {
    const out = [];
    const m = source.match(/\/\/ <tst-runtime>\n([\s\S]*?)\/\/ <\/tst-runtime>/);
    if (!m) return [`${file} has no \`// <tst-runtime>\` … \`// </tst-runtime>\` block.`];
    let toastRuntime;
    try {
      ({ toastRuntime } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(m[1], { mode: 'strip' })).toString('base64')}`));
    } catch (e) {
      return [`the toast runtime does not load: ${e.message}`];
    }
    const setup = (opts = {}) => {
      const s = standIn(opts);
      const region = new s.El('div');
      region.setAttribute('data-tst', JSON.stringify({ timeout: 6000, closeLabel: 'Dismiss notification', labels: { info: '', success: 'Success', warning: 'Warning', danger: 'Error' }, bottom: true }));
      region.hidden = true;
      for (const n of ['info', 'success', 'warning', 'danger', 'close']) region.append(s.template(n));
      const before = new s.El('button');
      s.doc.body.append(before, region);
      const api = toastRuntime(s.win);
      api.mount(region);
      const items = () => region.children.filter((c) => c.hasAttribute('data-tst-item'));
      return { ...s, region, before, api, items };
    };
    const expect = (cond, msg) => cond || out.push(`toast: ${msg}`);
    const run = (label, fn) => {
      try {
        fn();
      } catch (e) {
        out.push(`toast: ${label}: threw ${e.message}`);
      }
    };

    run('mount and text', () => {
      const t = setup({ reduce: true });
      expect(!t.region.hidden, 'mount() must unhide the region.');
      const h = t.api.show({ text: '<img src=x onerror=alert(1)>' });
      const it = t.items()[0];
      expect(h.open && h.element === it, 'show() must return a handle whose element is the toast and open is true.');
      expect(it && it.textContent.includes('<img src=x onerror=alert(1)>') && !it.querySelector('img[src]'), 'text must be set as text, never parsed as HTML.');
      expect(it && it.className.includes('tst__item--info'), 'the default kind must be info.');
      const d = t.api.show({ text: 'Failed', kind: 'danger' });
      expect(d.element.className.includes('tst__item--danger') && d.element.textContent.startsWith('Error: '), 'a danger toast must carry its class and the word "Error: " first.');
      expect(t.api.show({ text: 'x', kind: 'shout' }).element.className.includes('tst__item--info'), 'an unknown kind must fall back to info.');
      expect(!t.api.show({ text: '  ' }).open && t.items().length === 3, 'empty text must make no toast and return a closed handle.');
      expect(t.api.show('Saved').element.textContent === 'Saved', 'show("text") must work as a shorthand.');
      const close = h.element && h.element.querySelector('[data-tst-close]');
      expect(!close || close.getAttribute('aria-label') === 'Dismiss notification', 'the close button must be named by closeLabel.');
    });

    run('timeouts', () => {
      const t = setup({ reduce: true });
      const a = t.api.show({ text: 'default' });
      t.advance(5999);
      expect(a.open, 'a toast left before the default 6000 ms.');
      t.advance(1);
      expect(!a.open && !t.items().length, 'a toast did not leave at the default 6000 ms.');
      const b = t.api.show({ text: 'short', timeout: 1000 });
      t.advance(3999);
      expect(b.open, 'a timeout under 4000 ms must be raised to 4000.');
      t.advance(1);
      expect(!b.open, 'a 1000 ms toast was still there at 4000 ms.');
      const c = t.api.show({ text: 'sticky', timeout: 0 });
      t.advance(600_000);
      expect(c.open, 'timeout 0 must keep a toast until it is closed.');
      c.dismiss();
      expect(!c.open && !t.items().length, 'handle.dismiss() must close it.');
    });

    run('pause on hover', () => {
      const t = setup({ reduce: true });
      const a = t.api.show({ text: 'hover', timeout: 5000 });
      t.advance(2000);
      t.fire(a.element.querySelector('[data-tst-close]'), 'pointerover', { relatedTarget: null });
      t.advance(60_000);
      expect(a.open, 'the timer must pause while the pointer is over a toast.');
      t.fire(a.element, 'pointerout', { relatedTarget: t.doc.body });
      t.advance(2999);
      expect(a.open, 'after the pointer leaves, the toast must get back the 3000 ms it had left.');
      t.advance(1);
      expect(!a.open, 'after the pointer leaves, the toast must leave when its time is up.');
    });

    run('pause on focus and in a hidden tab', () => {
      const t = setup({ reduce: true });
      const a = t.api.show({ text: 'focus', timeout: 5000 });
      t.before.focus();
      t.advance(1000);
      a.element.querySelector('[data-tst-close]').focus();
      t.advance(60_000);
      expect(a.open, 'the timer must pause while focus is in a toast.');
      t.before.focus();
      t.advance(3999);
      expect(a.open, 'after focus leaves, the toast must get back the 4000 ms it had left.');
      t.advance(1);
      expect(!a.open, 'after focus leaves, the toast must leave when its time is up.');
      const b = t.api.show({ text: 'tab', timeout: 5000 });
      t.doc.hidden = true;
      t.fire(t.doc, 'visibilitychange');
      t.advance(60_000);
      expect(b.open, 'the timer must pause while the tab is hidden.');
      t.doc.hidden = false;
      t.fire(t.doc, 'visibilitychange');
      t.advance(5000);
      expect(!b.open, 'the timer must resume when the tab is visible again.');
    });

    run('actions', () => {
      const t = setup({ reduce: true });
      let got = null;
      const a = t.api.show({ text: 'Archived', timeout: 5000, action: { label: 'Undo', onClick: (e, handle) => (got = handle) } });
      t.advance(600_000);
      expect(a.open, 'a toast with an action must never leave by itself.');
      const btn = a.element.querySelector('[data-tst-action]');
      expect(btn && btn.tagName === 'BUTTON' && btn.getAttribute('type') === 'button' && btn.textContent === 'Undo', 'an onClick action must be a <button type="button"> with its label.');
      btn && btn.click();
      expect(got === a, 'onClick must receive the handle.');
      expect(!a.open, 'using the action must close the toast.');
      const link = t.api.show({ text: 'Sent', action: { label: 'View', href: '/orders/12/' } }).element.querySelector('[data-tst-action]');
      expect(link && link.tagName === 'A' && link.getAttribute('href') === '/orders/12/', 'an href action must be a link to that href.');
      for (const bad of ['javascript:alert(1)', ' JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<b>x</b>']) {
        const el = t.api.show({ text: 'x', action: { label: 'Go', href: bad } }).element.querySelector('[data-tst-action]');
        expect(el && el.tagName === 'BUTTON' && el.getAttribute('href') === null, `href "${bad.replace('\t', '\\t')}" must be refused.`);
      }
    });

    run('at most three', () => {
      const t = setup({ reduce: true });
      const hs = ['one', 'two', 'three', 'four'].map((text) => t.api.show({ text }));
      expect(t.api.count === 3 && t.items().length === 3, `expected 3 toasts after 4 shows, found ${t.items().length}.`);
      expect(!hs[0].open && hs.slice(1).every((h) => h.open), 'the oldest must leave for the fourth.');
      expect(t.items().map((i) => i.textContent).join(',') === 'two,three,four', 'the remaining toasts must keep their order.');
    });

    run('Escape and focus', () => {
      const t = setup({ reduce: true });
      t.before.focus();
      const hs = ['one', 'two', 'three'].map((text) => t.api.show({ text, timeout: 0 }));
      hs[1].element.querySelector('[data-tst-close]').focus();
      const ev = t.fire(hs[1].element.querySelector('[data-tst-close]'), 'keydown', { key: 'Escape' });
      expect(!hs[1].open && hs[0].open && hs[2].open, 'Escape must close the focused toast, and only it.');
      expect(ev.defaultPrevented, 'Escape on a toast must be taken (preventDefault).');
      expect(hs[2].element.contains(t.doc.activeElement), 'focus must move to the next toast when the focused one leaves.');
      hs[2].element.querySelector('[data-tst-close]').click();
      expect(hs[0].element.contains(t.doc.activeElement), 'with no next toast, focus must move to the previous one.');
      hs[0].element.querySelector('[data-tst-close]').click();
      expect(t.doc.activeElement === t.before, 'with no toast left, focus must return to where it was before.');
    });

    run('declarative buttons', () => {
      const t = setup({ reduce: true });
      const b = new t.El('button');
      b.setAttribute('data-toast', 'Link copied.');
      b.setAttribute('data-toast-kind', 'success');
      b.setAttribute('data-toast-action', 'Open');
      b.setAttribute('data-toast-href', '/links/');
      const inner = new t.El('span');
      b.append(inner);
      t.doc.body.append(b);
      t.fire(inner, 'click');
      const it = t.items()[0];
      expect(it && it.className.includes('tst__item--success') && it.textContent.includes('Link copied.'), 'a click inside a data-toast button must show its text and kind.');
      const act = it && it.querySelector('[data-tst-action]');
      expect(act && act.getAttribute('href') === '/links/' && act.textContent === 'Open', 'data-toast-action and data-toast-href must make the action link.');
    });

    run('motion', () => {
      const t = setup({ reduce: false });
      const a = t.api.show({ text: 'moving', timeout: 0 });
      const el = a.element;
      a.dismiss();
      expect(el.parentNode === t.region && el.className.includes('tst__item--out'), 'with motion allowed, a leaving toast must play its exit before it is removed.');
      t.advance(400);
      expect(el.parentNode === null, 'a leaving toast must be removed within 400 ms even if no animationend arrives.');
      const r = setup({ reduce: true });
      const b = r.api.show({ text: 'still', timeout: 0 });
      const bel = b.element;
      b.dismiss();
      expect(bel.parentNode === null, 'under reduced motion a toast must leave at once.');
    });
    return out;
  };

  const ratios = [];
  const toastSource = (s) => {
    const out = [];
    ratios.length = 0;
    const fb = (name) => (s.match(new RegExp(`var\\(--ts-${name}, (#[0-9a-f]{3,6})\\)`, 'i')) || [])[1];
    const bg = fb('bg');
    const pairs = [['fg', 4.5], ['action', 4.5], ['info', 3], ['success', 3], ['warning', 3], ['danger', 3], ['focus', 3]];
    if (!bg) out.push(`${file}: no --ts-bg fallback to measure against.`);
    else
      for (const [name, min] of pairs) {
        const c = fb(name);
        if (!c) {
          out.push(`${file}: no --ts-${name} fallback to measure.`);
          continue;
        }
        const r = ratio(c, bg);
        ratios.push(`${name} ${r.toFixed(2)}`);
        if (r < min) out.push(`toast: --ts-${name} ${c} on ${bg} is ${r.toFixed(2)}:1, under ${min}:1.`);
      }
    const css = s.slice(s.indexOf('<style'));
    const motionFree = css.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n  \}\n/g, '');
    if (/\banimation:\s*tst-/.test(motionFree)) out.push(`${file}: a toast animation outside @media (prefers-reduced-motion: no-preference); reduced motion means no slide.`);
    if (!/\.tst__close \{[^}]*width: 2\.75rem;[^}]*height: 2\.75rem;/.test(s)) out.push(`${file}: the close button must be 2.75rem (44px) square.`);
    return out;
  };

  const demoRel = 'dist/toast/index.html';
  const demoHtml = readRel(demoRel);
  for (const [rel, html] of [[demoRel, demoHtml], ['dist/index.html', readRel('dist/index.html')]]) if (html) toastPage(html, rel).forEach(fail);
  if (demoHtml && !/<button\b[^>]*\sdata-toast="[^"]+"/.test(demoHtml)) fail(`${demoRel}: the demo has no data-toast button.`);
  (await behaviours(src)).forEach(fail);
  toastSource(src).forEach(fail);
  const measured = [...ratios];
  finish('toast');

  const pageRules = (h) => toastPage(h, demoRel);
  mutation('toast', 'the region rendered visible', demoHtml, (h) => h.replace(/(class="tst tst--[^"]*"[^>]*) hidden>/, '$1>'), pageRules);
  mutation('toast', 'an assertive region', demoHtml, (h) => h.replace(/(class="tst [^>]*aria-live=)"polite"/, '$1"assertive"'), pageRules);
  mutation('toast', 'a second region', demoHtml, (h) => h.replace(/(<\/body>)/, '<div class="tst tst--top-left" role="region" aria-label="Notifications" aria-live="polite" hidden></div>$1'), pageRules);
  mutation('toast', 'a toast in the static HTML', demoHtml, (h) => h.replace(/(<template data-tst-icon="info")/, '<div class="tst__item">Saved</div>$1'), pageRules);
  const planted = [
    ['four allowed at once', (s) => s.replace('const MAX = 3;', 'const MAX = 4;')],
    ['no pause on hover', (s) => s.replace('const paused = () => !!hovering || focused', 'const paused = () => focused')],
    ['no pause on focus', (s) => s.replace('const paused = () => !!hovering || focused', 'const paused = () => !!hovering')],
    ['an action toast that times out', (s) => s.replace('sticky: !!a || ', 'sticky: ')],
    ['text parsed as HTML', (s) => s.replace('words.textContent = text;', 'words.textContent = text.replace(/<[^>]*>/g, "");')],
    ['javascript: allowed', (s) => s.replace("const SCHEMES = ['http', 'https', 'mailto', 'tel'];", "const SCHEMES = ['http', 'https', 'mailto', 'tel', 'javascript'];")],
    ['Escape ignored', (s) => s.replace("if (e.key !== 'Escape') return;", "if (e.key !== 'Esc') return;")],
    ['no 4 s floor', (s) => s.replace('const MIN_MS = 4000;', 'const MIN_MS = 0;')],
    ['exit animation under reduced motion', (s) => s.replace('if (reduce()) {', 'if (false) {')],
  ];
  for (const [label, plant] of planted) {
    const bad = plant(src);
    if (bad === src) {
      fail(`toast mutation "${label}": the fault could not be planted; the runtime changed shape, so update the mutation.`);
      continue;
    }
    if (!(await behaviours(bad)).length) fail(`toast mutation "${label}": the check did not notice it.`);
    mutants.push(`toast: ${label}`);
  }
  mutation('toast', 'a slide under reduced motion', src, (s) => s.replace('.tst__item {\n    box-sizing: border-box;', '.tst__item {\n    animation: tst-in 0.2s;\n    box-sizing: border-box;'), toastSource);
  mutation('toast', 'action text too dark', src, (s) => s.replace('--ts-action, #c4b5ff', '--ts-action, #5933d8'), toastSource);
  finish('toast mutations');
  summary.push(`toast: one hidden region on 2 pages; runtime behaviours on a DOM stand-in; contrast ${measured.join(', ')}`);
}

console.log(`check-feedback ok: ${summary.join('; ')}; ${mutants.length} planted faults caught.`);
