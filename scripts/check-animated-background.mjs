#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the animated-background
 * element.
 *
 * 1. Presets agree in three places: the frontmatter's PRESETS list, the `preset` prop's type in
 *    the catalogue, and the script's preset map (canvas presets) plus the CSS keyframes
 *    (scroll-x, scroll-y). A preset named in one and missing from another fails.
 * 2. Every canvas preset draws its still frame. The source between the `// <ab-presets>`
 *    markers is evaluated in Node against a small 2D-context shim (records calls, hands back
 *    gradients and image data), and each preset's init + draw(T0) must run without throwing
 *    and paint something. That is the element's own still path, executed, not a marker.
 * 3. The file imports nothing and loads nothing: no import, no <script src>, no fetch, no
 *    external URL in the script; and it never names the libraries it stands in for (three.js,
 *    THREE, vanta, particles).
 * 4. No vendored library anywhere in the repo: no file named for three, vanta or particles,
 *    and no file calling their APIs (THREE., VANTA., particlesJS). The words themselves are
 *    allowed in catalogue copy and comments: the page says what it replaces.
 * 5. The built demo page has exactly one live instance (not motion="off"); the still one is
 *    there too, and both are aria-hidden. Its props table lists `pointer`.
 * 6. The pointer never lands on the canvas: the style keeps `pointer-events: none`, and no
 *    move listener is attached to the canvas itself (the host gets it).
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-animated-background failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

const file = 'src/library/animated-background/AnimatedBackground.astro';
const src = readFileSync(join(root, file), 'utf8');
const catalog = readFileSync(join(root, 'src/data/catalog.ts'), 'utf8');

// ------------------------------------------------------------ 1. preset names agree
const listed = src.match(/^const PRESETS = \[([^\]]+)\] as const;/m);
if (!listed) fail(`${file}: no \`const PRESETS = [...] as const\` in the frontmatter.`);
const fromList = listed ? [...listed[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]) : [];

const entry = catalog.slice(catalog.indexOf("id: 'animated-background'"));
const propType = entry.match(/name: 'preset', type: "([^"]+)"/);
if (!propType) fail("catalog.ts: the animated-background entry has no `preset` prop with a quoted union type.");
const fromProps = propType ? [...propType[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]) : [];

const block = src.match(/\/\/ <ab-presets>\n([\s\S]*?)\/\/ <\/ab-presets>/);
if (!block) fail(`${file}: no \`// <ab-presets>\` … \`// </ab-presets>\` block in the script.`);
const map = block ? block[1].match(/const PRESETS = \{([\s\S]*)\};\s*$/) : null;
if (block && !map) fail(`${file}: the presets block does not end with the \`const PRESETS = { … };\` map.`);
const fromMap = map ? [...map[1].matchAll(/^ {6}([a-z]+): \{$/gm)].map((m) => m[1]) : [];
const fromCss = [...src.matchAll(/@keyframes ab-(scroll-[xy]) /g)].map((m) => m[1]);
const implemented = [...fromMap, ...fromCss];

const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
if (!same(fromList, fromProps)) fail(`presets differ: frontmatter [${fromList}] vs catalogue props [${fromProps}].`);
if (!same(fromList, implemented)) fail(`presets differ: frontmatter [${fromList}] vs implemented [${implemented}] (script map + CSS keyframes).`);
if (!fromMap.length) fail(`${file}: no canvas presets found in the map (expected \`      name: {\` lines).`);
finish('preset names');

// ------------------------------------------------------------ 2. still frames draw
// A 2D context that accepts everything and counts what paints.
const shim = () => {
  const paints = { n: 0 };
  const grad = () => ({ addColorStop() {} });
  const ctx = {
    paints,
    canvas: { width: 0, height: 0 },
    createLinearGradient: grad,
    createRadialGradient: grad,
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() { paints.n++; },
    drawImage() { paints.n++; },
    fill() { paints.n++; },
    stroke() { paints.n++; },
    fillRect() { paints.n++; },
  };
  for (const m of ['clearRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'arc', 'setTransform']) ctx[m] = () => {};
  return ctx;
};
const document = {
  createElement: (tag) => {
    if (tag !== 'canvas') throw new Error(`presets may only create canvases, not <${tag}>`);
    const c = { width: 0, height: 0 };
    c.getContext = () => shim();
    return c;
  },
};
let presets, T0;
try {
  const fn = new Function('document', `${block[1]}\nreturn { PRESETS, T0 };`);
  ({ PRESETS: presets, T0 } = fn(document));
} catch (e) {
  fail(`the presets block does not evaluate on its own: ${e.message}. It must use only Math, its own helpers and document.createElement('canvas').`);
  finish('still frames');
}
if (typeof T0 !== 'number') fail('the presets block must define T0, the time the still frame is drawn at.');
const o = { w: 1280, h: 600, level: 1, pace: 1, a: [89, 51, 216], b: [30, 40, 60], c: [255, 255, 255], px: 0.5, py: 0.5, pm: 0, pvx: 0 };
for (const name of fromMap) {
  const p = presets[name];
  if (!p || typeof p.init !== 'function' || typeof p.draw !== 'function') {
    fail(`${name}: not an { init, draw } preset.`);
    continue;
  }
  for (const level of [0.6, 1, 1.6]) {
    const ctx = shim();
    try {
      const opts = { ...o, level };
      const state = p.init(opts);
      p.draw(ctx, T0, 0, state, opts); // the still: fresh state, T0, no elapsed time
      p.draw(ctx, T0 + 1 / 60, 1 / 60, state, opts); // and one animated step after it
      p.draw(ctx, T0 + 2 / 60, 1 / 60, state, { ...opts, px: 0.2, py: 0.7, pm: 1, pvx: 0.1 }); // and one with the pointer in play
      p.draw(ctx, T0 + 3 / 60, 1 / 60, state, { ...opts, px: 0.8, py: 0.3, pm: -1, pvx: -0.1 });
    } catch (e) {
      fail(`${name} at level ${level}: draw threw: ${e.message}`);
      continue;
    }
    if (!ctx.paints.n) fail(`${name} at level ${level}: the still frame painted nothing.`);
  }
}
finish('still frames');

// ------------------------------------------------------------ 3. self-contained
if (/^\s*import\s/m.test(src)) fail(`${file}: imports something; the element is one file with no dependency.`);
const script = src.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1] ?? '';
if (!script) fail(`${file}: no inline script.`);
if (/<script\b[^>]*\ssrc=/.test(src)) fail(`${file}: has a <script src>; nothing may be loaded.`);
if (/\bfetch\(|https?:\/\//.test(script)) fail(`${file}: the script fetches or names a URL; it must run from the page alone.`);
for (const [word, re] of [['three.js', /three\.js|\bTHREE\b/], ['vanta', /vanta/i], ['particles', /particles/i]]) {
  if (re.test(src)) fail(`${file}: mentions "${word}". The element is not a wrapper for those libraries; leave that to the catalogue copy.`);
}

// ------------------------------------------------------------ 4. nothing vendored
const skip = new Set(['node_modules', 'dist', '.git', '.astro', '.claude']);
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
for (const p of walk(root)) {
  const r = relative(root, p);
  if (/(^|\/)(three|vanta|particles)[^/]*\.(m?js|ts)$/i.test(r)) fail(`${r}: a vendored library file; the repo carries no dependencies.`);
  if (/\.(m?js|ts|astro|html)$/.test(r) && r !== relative(root, fileURLToPath(import.meta.url))) {
    const text = readFileSync(p, 'utf8');
    if (/\bTHREE\.|\bVANTA\.|\bparticlesJS\b/.test(text)) fail(`${r}: calls a WebGL or particle library API; the repo carries none.`);
  }
}
// Runtime dependencies only. Build-time devDependencies are allowed when the README
// documents them as a build source that never reaches the emitted file -- the icon
// element reads Font Awesome Free's SVGs at build and emits plain inline SVG -- and
// the rule that matters for THIS element is the one above: its file imports nothing.
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const deps = Object.keys({ ...pkg.dependencies }).filter((d) => d !== 'astro');
if (deps.length) fail(`package.json: has runtime dependencies beyond astro (${deps.join(', ')}); elements carry none.`);
for (const d of Object.keys({ ...pkg.devDependencies })) {
  if (/three|vanta|particles/i.test(d)) fail(`package.json: devDependency ${d} is a WebGL or particle library; the repo carries none.`);
}
finish('self-contained');

// ------------------------------------------------------------ 5. built demo page
const page = join(root, 'dist/animated-background/index.html');
if (!existsSync(page)) {
  fail(`${relative(root, page)} is missing; run astro build (check-catalog.mjs does) first.`);
  finish('built page');
}
const html = readFileSync(page, 'utf8');
const tags = html.match(/<animated-background\b[^>]*>/g) ?? [];
const liveTags = tags.filter((t) => !/\sdata-motion="off"/.test(t));
if (liveTags.length !== 1) fail(`dist/animated-background/index.html: ${liveTags.length} live instances (without motion="off"); the demo has exactly one, the element is one per page.`);
if (tags.length - liveTags.length < 1) fail('dist/animated-background/index.html: the demo should also show the still frame (an instance with motion="off").');
for (const t of tags) {
  if (!/\saria-hidden="true"/.test(t)) fail(`dist/animated-background/index.html: an instance is not aria-hidden: ${t.slice(0, 120)}`);
  if (/\sdata-motion="off"/.test(t) && !/\sdata-still(?=[\s>=])/.test(t)) fail('dist/animated-background/index.html: the motion="off" instance must render with data-still, so the CSS presets hold without JavaScript.');
}
if (!/<button type="button" data-preset="/.test(html)) fail('dist/animated-background/index.html: the demo has no preset picker.');
if (!/<button type="button" data-pointer="/.test(html)) fail('dist/animated-background/index.html: the demo has no pointer toggle.');
if (!/<td[^>]*><code[^>]*>pointer<\/code><\/td>/.test(html)) fail('dist/animated-background/index.html: the props table does not list `pointer`.');
finish('built page');

// ------------------------------------------------------------ 6. pointer stays off the canvas
const style = src.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
if (!/\.ab\s*\{[^}]*pointer-events:\s*none/.test(style)) fail(`${file}: the element must keep pointer-events: none; the pointer is read from the host.`);
if (/canvas\.addEventListener\(\s*['"](?:mouse|pointer)/.test(script) || /\.ab__canvas[^}]*pointer-events:\s*(?!none)/.test(style)) fail(`${file}: a mouse or pointer listener is attached to the canvas itself; listen on the host.`);
if (!/addEventListener\('pointermove'/.test(script)) fail(`${file}: no pointermove listener at all; the pointer prop does nothing.`);
if (!/\(hover: hover\) and \(pointer: fine\)/.test(script)) fail(`${file}: the pointer reaction must be gated on a fine pointer (hover: hover and pointer: fine).`);
finish('pointer');

console.log(`check-animated-background ok: ${fromList.length} presets agree, ${fromMap.length} canvas stills drawn at 3 intensities (and with the pointer in play), one live instance on the demo page, pointer off the canvas.`);
