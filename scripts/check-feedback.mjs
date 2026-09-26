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
 * loading
 * 5. On both built pages: every spinner is role="status" with a non-empty name and an
 *    aria-hidden ring; every skeleton's shapes are aria-hidden, and a skeleton is either wholly
 *    aria-hidden or carries a named role="status"; every busy wrapper renders its content usable
 *    (no inert, no aria-busy), its overlay aria-hidden, and an empty role="status" OUTSIDE the
 *    content (screen readers hold back changes inside an aria-busy region). The runtime is
 *    emitted once per page with a busy wrapper, and not at all without one.
 * 6. The busy runtime on the DOM stand-in: busy(el, on) and the bare data-busy attribute both
 *    set aria-busy + inert on the content and the status; focus held on the wrapper and given
 *    back; the slow message after slowAfter; doneLabel; false for a non-wrapper. Motion only
 *    under no-preference (the reduce branch may only fade); the slow message ≥ 4.5:1.
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
  const doc = { hidden: false, activeElement: null, readyState: 'complete', getElementById: () => null };
  listen(doc);
  const observers = [];
  const notify = (el, name) => observers.forEach((o) => o.target === el && (!o.filter || o.filter.includes(name)) && o.cb([{ type: 'attributes', target: el, attributeName: name }]));
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
    setAttribute(k, v) { this.attrs.set(k, String(v)); notify(this, k); }
    getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
    hasAttribute(k) { return this.attrs.has(k); }
    removeAttribute(k) { if (this.attrs.delete(k)) notify(this, k); }
    toggleAttribute(k, on) { const had = this.attrs.has(k); if (on === undefined ? !had : on) this.attrs.set(k, ''); else this.attrs.delete(k); if (had !== this.attrs.has(k)) notify(this, k); }
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
  doc.querySelectorAll = (sel) => doc.body.querySelectorAll(sel);
  doc.querySelector = (sel) => doc.body.querySelector(sel);
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
    MutationObserver: class {
      constructor(cb) { this.cb = cb; }
      observe(target, opts = {}) { observers.push({ target, cb: this.cb, filter: opts.attributeFilter }); }
      disconnect() {}
    },
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
    const roots = [...html.matchAll(/<div\b[^>]*\sclass="ntc ntc--([a-z]+)\b[^"]*"[^>]*>/g)];
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
      const sr = body.match(/<span\b[^>]*class="ntc__sr"[^>]*>([^<]*)<\/span>/);
      if (!sr || !/\S+: $/.test(decode(sr[1]))) out.push(`${where}: no visually hidden kind word ("Warning: ") before the message.`);
      const icon = body.match(/<svg\b[^>]*class="ntc__icon"[^>]*>/);
      if (icon && (attr(icon[0], 'aria-hidden') !== 'true' || attr(icon[0], 'focusable') !== 'false')) out.push(`${where}: the icon must be aria-hidden="true" focusable="false".`);
      const close = body.match(/<button\b[^>]*\sdata-ntc-close[^>]*>/);
      const cfgRaw = attr(tag, 'data-ntc');
      if (cfgRaw === undefined) {
        if (close) out.push(`${where}: a close button on a notice without a dismissal config.`);
        return;
      }
      dismissible++;
      let cfg = {};
      try {
        cfg = JSON.parse(decode(cfgRaw));
      } catch {
        out.push(`${where}: data-ntc is not JSON.`);
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
        new RegExp(`\\.ntc--${kind} \\{\\s*background: var\\(--ntc-${kind}-bg, (#[0-9a-f]{3,6})\\);\\s*color: var\\(--ntc-${kind}-fg, (#[0-9a-f]{3,6})\\);\\s*--_ntc-accent: var\\(--ntc-${kind}-accent, (#[0-9a-f]{3,6})\\);`, 'i'),
      );
      if (!rule) {
        out.push(`${file}: no \`.ntc--${kind} { background: var(--ntc-${kind}-bg, #…); color: var(--ntc-${kind}-fg, #…); --_ntc-accent: var(--ntc-${kind}-accent, #…); }\` rule to measure.`);
        continue;
      }
      const [, bg, fg, accent] = rule;
      const t = ratio(fg, bg);
      const a = ratio(accent, bg);
      ratios.push(`${kind} ${t.toFixed(2)}/${a.toFixed(2)}`);
      if (t < 4.5) out.push(`notice "${kind}": text ${fg} on ${bg} is ${t.toFixed(2)}:1, under 4.5:1.`);
      if (a < 3) out.push(`notice "${kind}": accent ${accent} on ${bg} is ${a.toFixed(2)}:1, under 3:1 for the edge and icon.`);
    }
    if (!/\.ntc__close \{[^}]*width: 2\.75rem;[^}]*height: 2\.75rem;/.test(s)) out.push(`${file}: the close button must be 2.75rem (44px) square.`);
    if (!/\.ntc__text :global\(a\) \{\s*color: inherit;/.test(s)) out.push(`${file}: links in a notice must inherit its text colour, or their contrast needs measuring here too.`);
    return out;
  };

  const demoRel = 'dist/notice/index.html';
  const demoHtml = readRel(demoRel);
  for (const [rel, html] of [[demoRel, demoHtml], ['dist/index.html', readRel('dist/index.html')]]) if (html) noticePage(html, rel, rel === demoRel).forEach(fail);
  noticeSource(src).forEach(fail);
  const measured = [...ratios];
  finish('notice');

  const pageRules = (h) => noticePage(h, demoRel, true);
  mutation('notice', 'a warning given role="status"', demoHtml, (h) => h.replace(/(class="ntc ntc--warning"[^>]*\srole=)"alert"/, '$1"status"'), pageRules);
  mutation('notice', 'an info notice given role="alert"', demoHtml, (h) => h.replace(/(class="ntc ntc--info"[^>]*\srole=)"status"/, '$1"alert"'), pageRules);
  mutation('notice', 'a notice rendered hidden', demoHtml, (h) => h.replace(/(<div class="ntc ntc--success")/, '$1 hidden'), pageRules);
  mutation('notice', 'the close button shown without JavaScript', demoHtml, (h) => h.replace(/(data-ntc-close) hidden/, '$1'), pageRules);
  mutation('notice', 'the mount script moved away from its notice', demoHtml, (h) => h.replace(/(<\/button><\/div>)(<script>)/, '$1<p>x</p>$2'), pageRules);
  mutation('notice', 'the kind word removed', demoHtml, (h) => h.replace(/<span class="ntc__sr"[^>]*>Error: <\/span>/, ''), pageRules);
  mutation('notice', 'the runtime emitted twice', demoHtml, (h) => h.replace(/(<\/body>)/, '<script>window.__superheroNotice=window.__superheroNotice||1</script>$1'), pageRules);
  mutation('notice', 'warning text too light', src, (s) => s.replace('--ntc-warning-fg, #553800', '--ntc-warning-fg, #b08a3a'), noticeSource);
  mutation('notice', 'danger accent too light', src, (s) => s.replace('--ntc-danger-accent, #b42318', '--ntc-danger-accent, #f0a8a8'), noticeSource);
  mutation('notice', 'a 32px close button', src, (s) => s.replace(/(\.ntc__close \{[^}]*)width: 2\.75rem;/, '$1width: 2rem;'), noticeSource);
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

// --------------------------------------------------------------------------------- loading
if (ids.has('loading')) {
  const file = 'src/library/loading/Loading.astro';
  const src = readFileSync(join(root, file), 'utf8');

  const loadingPage = (html, rel, demo) => {
    const out = [];
    const count = { spinner: 0, skeleton: 0, busy: 0 };
    for (const r of html.matchAll(/<(span|div)\b[^>]*\sclass="ld ld--(spinner|skeleton|busy)\b[^"]*"[^>]*>/g)) {
      const [tag, el, shape] = r;
      count[shape]++;
      const where = `${rel}, ${shape} ${count[shape]}`;
      const body = block(html, r.index, el);
      if (shape === 'spinner') {
        if (attr(tag, 'role') !== 'status') out.push(`${where}: a spinner must be role="status".`);
        const ring = body.match(/<svg\b[^>]*class="ld__ring[^"]*"[^>]*>/);
        if (!ring || attr(ring[0], 'aria-hidden') !== 'true') out.push(`${where}: the ring must be aria-hidden.`);
        if (!text(body)) out.push(`${where}: a spinner without a name; screen readers would say nothing.`);
      } else if (shape === 'skeleton') {
        const bones = body.match(/<div\b[^>]*class="ld__bones"[^>]*>/);
        if (!bones || attr(bones[0], 'aria-hidden') !== 'true') out.push(`${where}: the skeleton shapes must be aria-hidden.`);
        const status = body.match(/<span\b[^>]*role="status"[^>]*>([^<]*)<\/span>/);
        if (attr(tag, 'aria-hidden') === 'true') {
          if (status) out.push(`${where}: a status inside an aria-hidden skeleton is never read.`);
        } else if (!status || !status[1].trim()) out.push(`${where}: a skeleton that is not aria-hidden needs a named role="status".`);
        if (text(body.replace(/<span\b[^>]*role="status"[^>]*>[^<]*<\/span>/, ''))) out.push(`${where}: text inside the skeleton shapes.`);
      } else {
        let cfg = {};
        try {
          cfg = JSON.parse(decode(attr(tag, 'data-ld')));
        } catch {
          out.push(`${where}: data-ld is not JSON.`);
        }
        if (!cfg.label) out.push(`${where}: no label in the config; the status would be empty.`);
        if (/\sinert(?=[\s>=])/.test(body) || /aria-busy=/.test(body)) out.push(`${where}: inert or aria-busy in the static HTML; without JavaScript the content must be usable.`);
        const content = body.match(/<div\b[^>]*\sdata-ld-content[^>]*>/);
        if (!content) {
          out.push(`${where}: no [data-ld-content] around the content.`);
          continue;
        }
        const contentHtml = block(body, content.index, 'div');
        if (/data-ld-status/.test(contentHtml)) out.push(`${where}: the status is inside the busy content, where aria-busy holds it back.`);
        const status = body.match(/<span\b[^>]*\sdata-ld-status[^>]*>([\s\S]*?)<\/span>/);
        if (!status || attr(status[0], 'role') !== 'status') out.push(`${where}: no role="status" [data-ld-status] beside the content.`);
        else if (status[1].trim()) out.push(`${where}: the status must be empty until the wrapper is busy.`);
        const overlay = body.match(/<div\b[^>]*class="ld__overlay"[^>]*>/);
        if (!overlay || attr(overlay[0], 'aria-hidden') !== 'true') out.push(`${where}: the overlay must be aria-hidden.`);
      }
    }
    if (demo) {
      if (count.spinner !== 4 || count.skeleton !== 4 || count.busy !== 1) out.push(`${rel}: expected the demo's 4 spinners, 4 skeletons and 1 busy wrapper; found ${count.spinner}, ${count.skeleton}, ${count.busy}.`);
    }
    const defs = (html.match(/window\.__superheroLoading=window\.__superheroLoading\|\|/g) || []).length;
    if (defs !== (count.busy ? 1 : 0)) out.push(`${rel}: the loading runtime is emitted ${defs} times with ${count.busy} busy wrappers; it must be once when there is one, and never without.`);
    return out;
  };

  const behaviours = async (source) => {
    const out = [];
    const m = source.match(/\/\/ <ld-runtime>\n([\s\S]*?)\/\/ <\/ld-runtime>/);
    if (!m) return [`${file} has no \`// <ld-runtime>\` … \`// </ld-runtime>\` block.`];
    let loadingRuntime;
    try {
      ({ loadingRuntime } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(m[1], { mode: 'strip' })).toString('base64')}`));
    } catch (e) {
      return [`the loading runtime does not load: ${e.message}`];
    }
    const expect = (cond, msg) => cond || out.push(`loading: ${msg}`);
    const setup = (cfg = {}) => {
      const s = standIn();
      const wrap = new s.El('div');
      wrap.setAttribute('data-ld', JSON.stringify({ label: 'Saving', slowText: 'Still saving', slowAfter: 3000, doneLabel: 'Saved', ...cfg }));
      const content = new s.El('div');
      content.setAttribute('data-ld-content', '');
      const button = new s.El('button');
      content.append(button);
      const overlay = new s.El('div');
      const slow = new s.El('p');
      slow.setAttribute('data-ld-slow', '');
      slow.hidden = true;
      overlay.append(slow);
      const status = new s.El('span');
      status.setAttribute('data-ld-status', '');
      wrap.append(content, overlay, status);
      const outside = new s.El('a');
      s.doc.body.append(outside, wrap);
      const api = loadingRuntime(s.win);
      return { ...s, wrap, content, button, slow, status, outside, api };
    };
    try {
      const t = setup();
      expect(t.wrap.className.includes('ld--live'), 'mounting must add ld--live, which is what lets the overlay show.');
      t.button.focus();
      expect(t.api.busy(t.button, true) === true, 'busy() on an element inside a wrapper must find the wrapper and return true.');
      expect(t.content.getAttribute('aria-busy') === 'true' && t.content.inert, 'busy on: the content must be aria-busy="true" and inert.');
      expect(t.wrap.getAttribute('aria-busy') === null, 'aria-busy belongs on the content, not the wrapper that holds the status.');
      expect(t.status.textContent === 'Saving', 'busy on: the status must say the label.');
      expect(t.doc.activeElement === t.wrap && t.wrap.getAttribute('tabindex') === '-1', 'busy on with focus inside: focus must move to the wrapper, not fall to <body>.');
      t.advance(2999);
      expect(t.slow.hidden, 'the slow message appeared before slowAfter.');
      t.advance(1);
      expect(!t.slow.hidden && t.status.textContent === 'Still saving', 'past slowAfter the slow message must show and be said.');
      t.api.busy(t.wrap, false);
      expect(t.content.getAttribute('aria-busy') === null && !t.content.inert, 'busy off: aria-busy and inert must go.');
      expect(t.slow.hidden && t.status.textContent === 'Saved', 'busy off: the slow message must hide and doneLabel be said.');
      expect(t.doc.activeElement === t.button && t.wrap.getAttribute('tabindex') === null, 'busy off: focus must go back to the control that had it.');

      const a = setup({ doneLabel: '' });
      a.outside.focus();
      a.wrap.toggleAttribute('data-busy', true);
      expect(a.content.inert && a.content.getAttribute('aria-busy') === 'true', 'setting the data-busy attribute alone must make the content busy.');
      expect(a.doc.activeElement === a.outside, 'focus outside the content must stay where it is.');
      a.wrap.removeAttribute('data-busy');
      expect(!a.content.inert && a.status.textContent === '', 'removing data-busy must clear it, with an empty status when there is no doneLabel.');
      a.advance(10_000);
      expect(a.slow.hidden, 'a cleared wrapper must not show the slow message later.');
      expect(a.api.busy(a.outside, true) === false, 'busy() on an element outside any wrapper must return false.');
      expect(a.api.busy('[data-nothing]', true) === false, 'busy() with a selector that matches nothing must return false.');
    } catch (e) {
      out.push(`loading: threw ${e.message}`);
    }
    return out;
  };

  const loadingSource = (s) => {
    const out = [];
    const css = s.slice(s.indexOf('<style'));
    const blocks = [...css.matchAll(/@media \(prefers-reduced-motion: (no-preference|reduce)\) \{([\s\S]*?)\n  \}\n/g)];
    let rest = css;
    for (const b of blocks) rest = rest.replace(b[0], '');
    if (/\banimation:/.test(rest)) out.push(`${file}: an animation outside the prefers-reduced-motion blocks.`);
    const reduce = blocks.filter((b) => b[1] === 'reduce').map((b) => b[2]).join('');
    for (const a of reduce.matchAll(/animation:\s*([\w-]+)/g)) {
      const kf = css.match(new RegExp(`@keyframes ${a[1]} \\{([\\s\\S]*?)\\n  \\}`));
      if (!kf || /transform|background-position|translate|rotate/.test(kf[1])) out.push(`${file}: under reduced motion, ${a[1]} may only fade, not move.`);
    }
    // Every rule that gives the overlay a display other than none must need .ld--live[data-busy].
    if (!/\.ld__overlay \{\s*display: none;/.test(css)) out.push(`${file}: the overlay must be display: none by default.`);
    const shows = [...css.matchAll(/([^{}]*\.ld__overlay[^{}]*)\{([^{}]*)\}/g)].filter((r) => { const d = r[2].match(/display:\s*([a-z-]+)/); return d && d[1] !== 'none'; });
    if (!shows.length) out.push(`${file}: no rule shows the overlay.`);
    for (const r of shows) if (!r[1].includes('.ld--live[data-busy]')) out.push(`${file}: \`${r[1].trim()}\` shows the overlay without .ld--live[data-busy], so it could cover content without JavaScript.`);
    const bg = (css.match(/var\(--ld-msg-bg, (#[0-9a-f]{3,6})\)/i) || [])[1];
    const fg = (css.match(/var\(--ld-msg-fg, (#[0-9a-f]{3,6})\)/i) || [])[1];
    if (!bg || !fg) out.push(`${file}: no --ld-msg-bg / --ld-msg-fg fallbacks to measure.`);
    else if (ratio(fg, bg) < 4.5) out.push(`loading: the slow message ${fg} on ${bg} is ${ratio(fg, bg).toFixed(2)}:1, under 4.5:1.`);
    return out;
  };

  const demoRel = 'dist/loading/index.html';
  const demoHtml = readRel(demoRel);
  for (const [rel, html] of [[demoRel, demoHtml], ['dist/index.html', readRel('dist/index.html')]]) if (html) loadingPage(html, rel, rel === demoRel).forEach(fail);
  for (const rel of ['dist/notice/index.html', 'dist/toast/index.html']) {
    const html = readRel(rel);
    if (html && /window\.__superheroLoading=/.test(html)) fail(`${rel}: the loading runtime is on a page with no busy wrapper.`);
  }
  (await behaviours(src)).forEach(fail);
  loadingSource(src).forEach(fail);
  finish('loading');

  const pageRules = (h) => loadingPage(h, demoRel, true);
  mutation('loading', 'a spinner without role="status"', demoHtml, (h) => h.replace(/(class="ld ld--spinner ld--md") role="status"/, '$1'), pageRules);
  mutation('loading', 'a spinner without a name', demoHtml, (h) => h.replace(/(class="ld ld--spinner ld--lg"[\s\S]*?<span class="ld__sr"[^>]*>)Loading/, '$1'), pageRules);
  mutation('loading', 'skeleton shapes not hidden', demoHtml, (h) => h.replace(/(class="ld__bones") aria-hidden="true"/, '$1'), pageRules);
  mutation('loading', 'busy content inert without JavaScript', demoHtml, (h) => h.replace(/(<div class="ld__content" data-ld-content)/, '$1 inert'), pageRules);
  mutation('loading', 'the status inside the busy content', demoHtml, (h) => h.replace(/(<div class="ld__content" data-ld-content[^>]*>)/, '$1<span class="ld__sr" role="status" data-ld-status></span>'), pageRules);
  const planted = [
    ['aria-busy on the wrapper', (s) => s.replace("content.setAttribute('aria-busy', 'true');", "el.setAttribute('aria-busy', 'true');")],
    ['content left operable', (s) => s.replace('content.inert = true;', 'content.inert = false;')],
    ['focus dropped to <body>', (s) => s.replace("          el.focus();\n", '')],
    ['focus not given back', (s) => s.replace('if (stillHere && back && back.isConnected', 'if (false && back && back.isConnected')],
    ['the attribute ignored', (s) => s.replace("if (win.MutationObserver) new win.MutationObserver", 'if (false) new win.MutationObserver')],
    ['no slow message', (s) => s.replace('if (slow && s.cfg.slowText) {', 'if (false) {')],
  ];
  for (const [label, plant] of planted) {
    const bad = plant(src);
    if (bad === src) {
      fail(`loading mutation "${label}": the fault could not be planted; the runtime changed shape, so update the mutation.`);
      continue;
    }
    if (!(await behaviours(bad)).length) fail(`loading mutation "${label}": the check did not notice it.`);
    mutants.push(`loading: ${label}`);
  }
  mutation('loading', 'a shimmer under reduced motion', src, (s) => s.replace('.ld__bone--line {\n    height: 0.8em;', '.ld__bone--line {\n    animation: ld-shimmer 1.6s infinite;\n    height: 0.8em;'), loadingSource);
  mutation('loading', 'the ring turning under reduced motion', src, (s) => s.replace('.ld__arc {\n      animation: ld-breathe', '.ld__arc {\n      animation: ld-spin'), loadingSource);
  mutation('loading', 'the overlay shown without JavaScript', src, (s) => s.replace('.ld--busy.ld--live[data-busy] > .ld__overlay {\n    position', '.ld--busy[data-busy] > .ld__overlay {\n    position'), loadingSource);
  mutation('loading', 'a faint slow message', src, (s) => s.replace('--ld-msg-fg, #1e283c', '--ld-msg-fg, #a0a6b0'), loadingSource);
  finish('loading mutations');
  summary.push('loading: spinner, skeleton and busy no-JS render on 2 pages; busy runtime on a DOM stand-in; motion only where allowed');
}

console.log(`check-feedback ok: ${summary.join('; ')}; ${mutants.length} planted faults caught.`);
