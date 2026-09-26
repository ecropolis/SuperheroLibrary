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
 * Mutation tests: every section re-runs its own rules on copies of the page or source with one
 * known fault planted (a warning given role="status", a close button shown without JavaScript,
 * a text colour too light…) and fails if a rule no longer notices it. A rule that cannot fail
 * is not a rule.
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

console.log(`check-feedback ok: ${summary.join('; ')}; ${mutants.length} planted faults caught.`);
