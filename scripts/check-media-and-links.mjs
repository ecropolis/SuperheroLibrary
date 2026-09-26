#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins video-gallery, map and
 * link-effects on the built pages, i.e. what a visitor without JavaScript gets.
 *
 * 0. Every built page: nothing is fetched from Google, YouTube or Vimeo at load. No iframe,
 *    script, link, img, source, video poster, embed or object points at google.com,
 *    googleapis.com, gstatic.com, youtube(-nocookie).com, youtu.be, ytimg.com, vimeo.com or
 *    vimeocdn.com. <noscript> is NOT exempt: its markup loads for a visitor without JavaScript.
 *    Links (<a href>) fetch nothing and are allowed; they are the no-JavaScript render.
 *
 * video-gallery
 * 1. Its URL parser is byte-for-byte video-player's (the two `*-parse` blocks); a handful of
 *    golden cases run against the copy.
 * 2. Each gallery on the demo page and the index: every tile is a link to the video's own
 *    page named "Watch “<title>”…", plus a hidden <button type="button"> named
 *    "Play: <title>" whose data matches the tile, with a youtube-nocookie / vimeo dnt=1 embed
 *    or file sources with a captions track that exists; no <iframe> or <video> at load; chips
 *    (if any) are a named, hidden group of <button aria-pressed>, "All" first and pressed, with
 *    a polite live region; a lightbox gallery has one closed, named <dialog> with a named close
 *    button, an inline one none; the one-line mount script comes straight after the gallery;
 *    the runtime is on the page once.
 * 3. Motion (animation, transition, scale on hover) sits only inside
 *    `@media (prefers-reduced-motion: no-preference)`.
 *
 * map
 * 4. The URL builders (`<map-urls>` block): search, directions and embed URLs with the query
 *    encoded, zoom rounded, tel: digits.
 * 5. On the demo page and the index: every card has an <address>, an "Open in Google Maps" and a
 *    "Directions" link to Google's keyless Maps URLs, named with the place; a facade, when
 *    there is one, is hidden until the script runs, is a <button type="button"> named
 *    "Show the map of <name>" and described by a notice that names Google, and carries a
 *    www.google.com/maps?…&output=embed URL; no iframe at load; the runtime creates the iframe
 *    with loading="lazy" and the title; the mount script is straight after each map; the pin
 *    is Font Awesome Free's location-dot, path for path.
 * 6. The fallback colours pass 4.5:1 (text, links, notice on the card; the button's text on
 *    its fill); motion only under no-preference.
 *
 * Mutation tests: each element's checks are also run against deliberately broken copies of its
 * input (an iframe injected, a name removed, a colour darkened, …). A mutation the checks do
 * not catch fails the run: a check that cannot fail is not a check.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-media-and-links failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const decode = (s) => s?.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const src = (rel) => readFileSync(join(root, rel), 'utf8');
const built = (rel) => {
  const path = join(root, rel);
  if (!existsSync(path)) {
    fail(`${rel} is missing; run astro build (check-catalog.mjs does).`);
    return '';
  }
  return readFileSync(path, 'utf8');
};
/** Runs `check(input, fail)` and returns what it reported. */
const run = (check, input) => {
  const got = [];
  check(input, (m) => got.push(m));
  return got;
};
let mutations = 0;
/** Each mutation must make `check` report at least one failure. */
const mutate = (label, check, input, change) => {
  mutations++;
  const broken = change(structuredClone(input));
  if (JSON.stringify(broken) === JSON.stringify(input)) fail(`mutation "${label}" changed nothing; its pattern no longer matches the input.`);
  else if (!run(check, broken).length) fail(`mutation "${label}" was not caught: the check passes a broken input.`);
};
/** `css` with every `@media (prefers-reduced-motion: no-preference) { … }` block removed. */
const outsideNoPreference = (css) => {
  let out = '';
  let i = 0;
  const open = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{/g;
  for (let m; (m = open.exec(css)); ) {
    out += css.slice(i, m.index);
    let depth = 1;
    let j = open.lastIndex;
    for (; j < css.length && depth; j++) depth += css[j] === '{' ? 1 : css[j] === '}' ? -1 : 0;
    i = open.lastIndex = j;
  }
  return out + css.slice(i);
};
const styleOf = (component) => (component.match(/<style>([\s\S]*?)<\/style>/) || [])[1] ?? '';

// ------------------------------------------------- 0. no third party at load
const THIRD = /(?:^|\/\/|\.)(?:google\.com|googleapis\.com|gstatic\.com|youtube\.com|youtube-nocookie\.com|youtu\.be|ytimg\.com|vimeo\.com|vimeocdn\.com)(?=[/:?#]|$)/i;
const checkNoThirdParty = ({ rel, html }, fail) => {
  for (const t of html.match(/<(?:iframe|frame|script|link|img|source|video|audio|embed|object|track)\b[^>]*>/gi) || []) {
    const refs = ['src', 'href', 'srcset', 'data', 'poster'].map((n) => decode(attr(t, n))).filter(Boolean);
    const urls = refs.flatMap((r) => r.split(',').map((u) => u.trim().split(/\s+/)[0]));
    if (urls.some((u) => THIRD.test(u))) fail(`${rel}: fetches from Google, YouTube or Vimeo at load: ${t.slice(0, 160)}`);
  }
  if (/url\(\s*['"]?https?:\/\/[^)]*(?:google|gstatic|youtube|ytimg|vimeo)/i.test(html)) fail(`${rel}: a CSS url() from Google, YouTube or Vimeo.`);
};
const pages = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) pages.push(relative(root, p));
  }
};
if (existsSync(join(root, 'dist'))) walk(join(root, 'dist'));
if (!pages.length) fail('dist/ has no HTML; run astro build (check-catalog.mjs does).');
for (const rel of pages) for (const m of run(checkNoThirdParty, { rel, html: built(rel) })) fail(m);
{
  const input = { rel: 'dist/video-gallery/index.html', html: built('dist/video-gallery/index.html') };
  mutate('a YouTube iframe at load', checkNoThirdParty, input, (x) => ({ ...x, html: x.html.replace('</body>', '<iframe src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"></iframe></body>') }));
  mutate('a Google Maps iframe inside <noscript>', checkNoThirdParty, input, (x) => ({ ...x, html: x.html.replace('</body>', '<noscript><iframe src="https://www.google.com/maps?q=x&amp;output=embed"></iframe></noscript></body>') }));
  mutate('a YouTube thumbnail', checkNoThirdParty, input, (x) => ({ ...x, html: x.html.replace('</body>', '<img src="https://i.ytimg.com/vi/x/hqdefault.jpg" alt=""></body>') }));
  mutate('a preconnect to Vimeo', checkNoThirdParty, input, (x) => ({ ...x, html: x.html.replace('</head>', '<link rel="preconnect" href="https://player.vimeo.com"></head>') }));
}
finish('third parties at load');

// ------------------------------------------------------------ video-gallery
const VG = 'src/library/video-gallery/VideoGallery.astro';
const block = (s, name) => (s.match(new RegExp(`\\/\\/ <${name}>\\n([\\s\\S]*?)\\/\\/ <\\/${name}>`)) || [])[1];
const checkParserCopy = ({ gallery, player }, fail) => {
  const g = block(gallery, 'video-gallery-parse');
  const p = block(player, 'video-player-parse');
  if (!g) fail(`${VG} has no \`// <video-gallery-parse>\` … \`// </video-gallery-parse>\` block.`);
  else if (!p) fail('VideoPlayer.astro has no `// <video-player-parse>` block to compare with.');
  else if (g !== p) fail(`${VG}: its parser is no longer a copy of video-player's. Change both, identically, or neither.`);
};
const vgSources = { gallery: src(VG), player: src('src/library/video-player/VideoPlayer.astro') };
for (const m of run(checkParserCopy, vgSources)) fail(m);
mutate('the parser copy drifts', checkParserCopy, vgSources, (x) => ({ ...x, gallery: x.gallery.replace("'youtube.com' || host", "'youtube.com' ||host") }));
finish('video-gallery parser copy');

const parse = block(vgSources.gallery, 'video-gallery-parse');
const { parseVideoSrc, embedUrl, watchUrl } = await import(
  `data:text/javascript;base64,${Buffer.from(`${stripTypeScriptTypes(parse, { mode: 'strip' })}\nexport { parseVideoSrc, embedUrl, watchUrl };`).toString('base64')}`
);
const cases = [
  ['https://youtu.be/eRsGyueVLvQ', { kind: 'youtube', id: 'eRsGyueVLvQ' }],
  ['https://vimeo.com/1084537', { kind: 'vimeo', id: '1084537' }],
  ['/demo/drift.mp4', { kind: 'file', sources: [{ src: '/demo/drift.mp4', type: 'video/mp4' }] }],
  ['https://example.com/watch?v=aqz-KE-bpKQ', null],
];
for (const [s, want] of cases) if (JSON.stringify(parseVideoSrc(s)) !== JSON.stringify(want)) fail(`parseVideoSrc(${JSON.stringify(s)}) = ${JSON.stringify(parseVideoSrc(s))}, expected ${JSON.stringify(want)}.`);
if (embedUrl({ kind: 'vimeo', id: '1084537' }) !== 'https://player.vimeo.com/video/1084537?dnt=1&autoplay=1') fail('embedUrl for Vimeo lost dnt=1 or autoplay.');
if (watchUrl({ kind: 'youtube', id: 'eRsGyueVLvQ' }) !== 'https://www.youtube.com/watch?v=eRsGyueVLvQ') fail('watchUrl for YouTube changed.');
finish('video-gallery parser');

const MOUNT_VG = '<script>window.__superheroVideoGallery.mount(document.currentScript.previousElementSibling);</script>';
const checkGalleryPage = ({ rel, html, demo }, fail) => {
  const roots = [...html.matchAll(/<div\b[^>]*\sdata-vg="(lightbox|inline)"[^>]*>/g)];
  if (demo && roots.length !== 2) fail(`${rel}: expected the demo's 2 galleries, found ${roots.length}.`);
  const kinds = new Set();
  let filtered = 0;
  roots.forEach((r, gi) => {
    const mode = r[1];
    const where = `${rel}, gallery ${gi + 1} (${mode})`;
    const end = html.indexOf(MOUNT_VG, r.index);
    if (end < 0) {
      fail(`${where}: no mount script after it.`);
      return;
    }
    const chunk = html.slice(r.index, end);
    if (!/<\/div>\s*$/.test(chunk) || (roots[gi + 1] && roots[gi + 1].index < end)) fail(`${where}: the mount script must come straight after the gallery, or links turn into buttons after the first paint.`);
    if (/<iframe\b/i.test(chunk)) fail(`${where}: an <iframe> at load; the player is created on a click.`);
    if (/<video\b/i.test(chunk)) fail(`${where}: a <video> at load; the player is created on a click.`);

    const items = chunk.split(/(?=<li\b[^>]*\sdata-vg-item)/).slice(1);
    if (!items.length) fail(`${where}: no tiles.`);
    items.forEach((li, i) => {
      const titleEl = li.match(/<(h2|h3|h4|p)\b[^>]*class="vg__title"[^>]*>([\s\S]*?)<\/\1>/);
      const title = titleEl ? text(titleEl[2]) : '';
      const w = `${where}, tile ${i + 1} ("${title}")`;
      if (!title) fail(`${w}: no title under the tile.`);
      const link = li.match(/<a\b[^>]*\sdata-vg-link[^>]*>([\s\S]*?)<\/a>/);
      if (!link) fail(`${w}: no link; without JavaScript the tile must link to the video.`);
      else {
        const href = decode(attr(link[0], 'href')) || '';
        if (!href) fail(`${w}: the link has no href.`);
        if (!text(link[1]).startsWith(`Watch “${title}”`)) fail(`${w}: the link is named "${text(link[1])}", expected "Watch “${title}”…".`);
      }
      const btn = li.match(/<button\b[^>]*\sdata-vg-play=[^>]*>/);
      if (!btn) {
        fail(`${w}: no play button.`);
        return;
      }
      if (attr(btn[0], 'type') !== 'button') fail(`${w}: the play button needs type="button".`);
      if (attr(btn[0], 'hidden') === undefined) fail(`${w}: the play button must be hidden until the script can make it work.`);
      if (decode(attr(btn[0], 'aria-label')) !== `Play: ${title}`) fail(`${w}: the play button is named "${decode(attr(btn[0], 'aria-label'))}", expected "Play: ${title}".`);
      if (mode === 'lightbox' && attr(btn[0], 'aria-haspopup') !== 'dialog') fail(`${w}: a lightbox button needs aria-haspopup="dialog".`);
      let d = {};
      try {
        d = JSON.parse(decode(attr(btn[0], 'data-vg-play')));
      } catch {
        fail(`${w}: data-vg-play is not JSON.`);
      }
      kinds.add(d.k);
      if (d.t !== title) fail(`${w}: the player would be titled "${d.t}", not "${title}".`);
      if (d.k === 'youtube' && !String(d.e).startsWith('https://www.youtube-nocookie.com/embed/')) fail(`${w}: embed ${d.e} is not youtube-nocookie.com.`);
      if (d.k === 'vimeo' && !(String(d.e).startsWith('https://player.vimeo.com/video/') && /[?&]dnt=1/.test(d.e))) fail(`${w}: embed ${d.e} is not player.vimeo.com with dnt=1.`);
      if (d.k === 'file') {
        if (!d.s?.length) fail(`${w}: a file with no sources.`);
        const cap = (d.tr || []).find((t) => t.kind === 'captions');
        if (!cap) fail(`${w}: a self-hosted video without a captions track.`);
        else if (!cap.src.startsWith('/demo/') || !existsSync(join(root, 'public', cap.src))) fail(`${w}: captions track ${cap.src} is not in public/demo/.`);
      }
      const img = li.match(/<img\b[^>]*class="vg__poster"[^>]*>/);
      if (img && attr(img[0], 'alt') !== '') fail(`${w}: the poster sits inside a named control and repeats the title; it must be alt="".`);
    });

    const bar = chunk.match(/<div\b[^>]*\sdata-vg-filters[^>]*>([\s\S]*?)<\/div>/);
    if (bar) {
      filtered++;
      if (attr(bar[0], 'role') !== 'group' || !attr(bar[0], 'aria-label')) fail(`${where}: the chips must be a role="group" with an aria-label.`);
      if (attr(bar[0], 'hidden') === undefined) fail(`${where}: the chips must be hidden until the script can make them work.`);
      const chips = [...bar[1].matchAll(/<button\b[^>]*>/g)].map((c) => c[0]);
      if (chips.length < 3) fail(`${where}: fewer than "All" and two categories.`);
      chips.forEach((c, i) => {
        if (attr(c, 'type') !== 'button') fail(`${where}, chip ${i + 1}: needs type="button".`);
        const pressed = attr(c, 'aria-pressed');
        if (pressed !== (i === 0 ? 'true' : 'false')) fail(`${where}, chip ${i + 1}: aria-pressed="${pressed}", expected "${i === 0}" ("All" first and pressed).`);
      });
      if (chips[0] && attr(chips[0], 'data-vg-filter') !== '') fail(`${where}: the first chip must be "All" (data-vg-filter="").`);
      if (!/<p\b[^>]*aria-live="polite"[^>]*data-vg-status/.test(chunk)) fail(`${where}: no polite live region to say how many are shown.`);
    }

    const dialogs = [...chunk.matchAll(/<dialog\b[^>]*>/g)].map((m) => m[0]);
    if (mode === 'lightbox') {
      if (dialogs.length !== 1) fail(`${where}: a lightbox gallery needs exactly one <dialog>, found ${dialogs.length}.`);
      for (const dl of dialogs) {
        if (attr(dl, 'open') !== undefined) fail(`${where}: the <dialog> is rendered open.`);
        if (!attr(dl, 'aria-label')) fail(`${where}: the <dialog> has no name.`);
      }
      const close = chunk.match(/<button\b[^>]*\sdata-vg-close[^>]*>/);
      if (!close || attr(close[0], 'type') !== 'button' || !attr(close[0], 'aria-label')) fail(`${where}: the lightbox needs a named close <button type="button">.`);
    } else if (dialogs.length) fail(`${where}: an inline gallery has a <dialog>.`);
  });
  if (demo) {
    for (const k of ['youtube', 'vimeo', 'file']) if (!kinds.has(k)) fail(`${rel}: the demo needs a ${k} tile.`);
    if (!filtered) fail(`${rel}: the demo needs a gallery with filter chips.`);
  }
  const runtimes = (html.match(/window\.__superheroVideoGallery = \{/g) || []).length;
  if (roots.length && runtimes !== 1) fail(`${rel}: the gallery runtime is on the page ${runtimes} times; it must be once.`);
};
const vgPages = [
  { rel: 'dist/video-gallery/index.html', html: built('dist/video-gallery/index.html'), demo: true },
  { rel: 'dist/index.html', html: built('dist/index.html'), demo: false },
];
for (const p of vgPages) for (const m of run(checkGalleryPage, p)) fail(m);
const checkGalleryMotion = (component, fail) => {
  const rest = outsideNoPreference(styleOf(component));
  if (/\b(?:animation|transition)\s*:/.test(rest)) fail(`${VG}: an animation or transition outside @media (prefers-reduced-motion: no-preference).`);
  if (/(?<![-\w])scale\s*:/.test(rest)) fail(`${VG}: the hover growth must sit inside @media (prefers-reduced-motion: no-preference).`);
};
for (const m of run(checkGalleryMotion, vgSources.gallery)) fail(m);
{
  const demo = vgPages[0];
  const re = (a, b) => (x) => ({ ...x, html: x.html.replace(a, b) });
  mutate('a play button loses its name', checkGalleryPage, demo, re(/aria-label="Play: Sintel"/, 'aria-label="Play"'));
  mutate('a play button shows without JavaScript', checkGalleryPage, demo, re(/(<button class="vg__hit[^"]*" type="button") hidden/, '$1'));
  mutate('a tile loses its no-JavaScript link', checkGalleryPage, demo, re(/<a class="vg__hit"[^>]*data-vg-link[^>]*>[\s\S]*?<\/a>/, ''));
  mutate('a chip loses aria-pressed', checkGalleryPage, demo, re(/(data-vg-filter="loops"[^>]*?) ?aria-pressed="false"|aria-pressed="false"( [^>]*data-vg-filter="loops")/, '$1$2'));
  mutate('"All" is not pressed', checkGalleryPage, demo, re('aria-pressed="true" data-vg-filter=""', 'aria-pressed="false" data-vg-filter=""'));
  mutate('the dialog renders open', checkGalleryPage, demo, re('<dialog class="vg__dialog"', '<dialog open class="vg__dialog"'));
  mutate('a YouTube embed off nocookie', checkGalleryPage, demo, re('youtube-nocookie.com/embed/', 'youtube.com/embed/'));
  mutate('the mount script moves away', checkGalleryPage, demo, re(MOUNT_VG, '<p></p>' + MOUNT_VG));
  mutate('the runtime twice', checkGalleryPage, demo, re('</body>', '<script>window.__superheroVideoGallery = {};</script></body>'));
  mutate('a fade outside reduced motion', checkGalleryMotion, vgSources.gallery, (s) => s.replace('.vg__item {\n    min-width: 0;', '.vg__item {\n    animation: vg-in 1s;\n    min-width: 0;'));
}
finish('video-gallery');

// ---------------------------------------------------------------- contrast
const hexOf = (c) => {
  let h = c.replace('#', '');
  if (h.length === 3) h = [...h].map((x) => x + x).join('');
  return h;
};
const lum = (c) =>
  [0, 2, 4]
    .map((i) => parseInt(hexOf(c).slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
/** Every `var(--name, #hex)` fallback in `css`, which must agree wherever the token is used. */
const fallbacks = (css, file, fail) => {
  const seen = {};
  for (const [, name, value] of css.matchAll(/var\((--[\w-]+),\s*(#[0-9a-f]{3,6})\s*\)/gi)) {
    if (seen[name] && seen[name] !== value.toLowerCase()) fail(`${file}: ${name} falls back to ${seen[name]} in one place and ${value} in another.`);
    seen[name] = value.toLowerCase();
  }
  return seen;
};
const pairs = (tokens, list, file, fail, report) => {
  for (const [fg, bg, min, what] of list) {
    if (!tokens[fg] || !tokens[bg]) {
      fail(`${file}: no hex fallback for ${!tokens[fg] ? fg : bg}, so ${what} cannot be measured.`);
      continue;
    }
    const r = contrast(tokens[fg], tokens[bg]);
    report?.push(`${what} ${r.toFixed(2)}:1`);
    if (r < min) fail(`${file}: ${what} is ${tokens[fg]} on ${tokens[bg]}, ${r.toFixed(2)}:1, under ${min}:1.`);
  }
};

// ---------------------------------------------------------------------- map
const MAP = 'src/library/map/LocationMap.astro';
const mapSrc = src(MAP);
const mapBlock = block(mapSrc, 'map-urls');
if (!mapBlock) {
  fail(`${MAP} has no \`// <map-urls>\` … \`// </map-urls>\` block.`);
  finish('map urls');
}
const { mapUrls, telHref } = await import(
  `data:text/javascript;base64,${Buffer.from(`${stripTypeScriptTypes(mapBlock, { mode: 'strip' })}\nexport { mapUrls, telHref };`).toString('base64')}`
);
{
  const u = mapUrls('Joe’s Café & Bar, 1 Main St,  Springfield, IL', 15.4);
  const q = 'Joe%E2%80%99s%20Caf%C3%A9%20%26%20Bar%2C%201%20Main%20St%2C%20Springfield%2C%20IL';
  const want = {
    open: `https://www.google.com/maps/search/?api=1&query=${q}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    embed: `https://www.google.com/maps?q=${q}&z=15&output=embed`,
  };
  for (const k of Object.keys(want)) if (u[k] !== want[k]) fail(`mapUrls ${k}: ${u[k]}, expected ${want[k]}.`);
  if (mapUrls('x').embed !== 'https://www.google.com/maps?q=x&output=embed') fail('mapUrls without zoom must not add &z=.');
  for (const [p, want] of [['(312) 555-0142', 'tel:3125550142'], ['+44 20 7946 0958', 'tel:+442079460958'], ['+1-312-555-0142 ext', 'tel:+13125550142']]) {
    if (telHref(p) !== want) fail(`telHref("${p}") = ${telHref(p)}, expected ${want}.`);
  }
}
finish('map urls');

const MOUNT_MAP = '<script>window.__superheroMap.mount(document.currentScript.previousElementSibling);</script>';
const faPin = readFileSync(join(root, 'node_modules/@fortawesome/fontawesome-free/svgs/solid/location-dot.svg'), 'utf8').match(/<path[^>]*\sd="([^"]+)"/)[1];
const checkMapPage = ({ rel, html, demo }, fail) => {
  const roots = [...html.matchAll(/<div\b[^>]*\sdata-map(?=[\s>])[^>]*>/g)];
  if (demo && roots.length !== 2) fail(`${rel}: expected the demo's 2 maps, found ${roots.length}.`);
  let facades = 0;
  let photos = 0;
  let panels = 0;
  roots.forEach((r, mi) => {
    const where = `${rel}, map ${mi + 1}`;
    const end = html.indexOf(MOUNT_MAP, r.index);
    if (end < 0) {
      fail(`${where}: no mount script after it.`);
      return;
    }
    const chunk = html.slice(r.index, end);
    if (!/<\/div>\s*$/.test(chunk) || (roots[mi + 1] && roots[mi + 1].index < end)) fail(`${where}: the mount script must come straight after the map, or the facades appear after the first paint.`);
    if (/<iframe\b/i.test(chunk)) fail(`${where}: an <iframe> at load; the map loads on a click.`);
    const cards = chunk.split(/(?=<(?:li|div)\b[^>]*class="map__card)/).slice(1);
    if (!cards.length) fail(`${where}: no cards.`);
    cards.forEach((card, ci) => {
      const nameEl = card.match(/<(h2|h3|h4)\b[^>]*class="map__name"[^>]*>([\s\S]*?)<\/\1>/);
      const name = nameEl ? text(nameEl[2]) : '';
      const w = `${where}, card ${ci + 1} ("${name}")`;
      if (!name) fail(`${w}: no heading with the place's name.`);
      const addr = card.match(/<address\b[^>]*>([\s\S]*?)<\/address>/);
      if (!addr || !text(addr[1])) fail(`${w}: no <address>.`);
      const tel = addr && addr[1].match(/<a\b[^>]*href="([^"]*)"/);
      if (tel && !/^tel:\+?\d{7,}$/.test(tel[1])) fail(`${w}: the phone link ${tel[1]} is not tel:<digits>.`);
      const open = card.match(/<a\b[^>]*\sdata-map-open[^>]*>([\s\S]*?)<\/a>/);
      const dir = card.match(/<a\b[^>]*\sdata-map-directions[^>]*>([\s\S]*?)<\/a>/);
      for (const [a, base, label] of [
        [open, 'https://www.google.com/maps/search/?api=1&query=', 'Open in Google Maps'],
        [dir, 'https://www.google.com/maps/dir/?api=1&destination=', 'Directions'],
      ]) {
        if (!a) {
          fail(`${w}: no "${label}" link.`);
          continue;
        }
        const href = decode(attr(a[0], 'href')) || '';
        if (!href.startsWith(base) || href.length === base.length) fail(`${w}: "${label}" goes to ${href}, not ${base}<query>.`);
        if (/[?&]key=/.test(href)) fail(`${w}: "${label}" carries an API key.`);
        const nameAttr = decode(attr(a[0], 'aria-label')) || '';
        if (!nameAttr.startsWith(text(a[1])) || !nameAttr.includes(name)) fail(`${w}: "${label}" is named "${nameAttr}"; it must start with its visible words and name the place.`);
      }
      const media = card.match(/<div\b[^>]*\sdata-map-media[^>]*>/);
      if (!media) return;
      facades++;
      if (attr(media[0], 'hidden') === undefined) fail(`${w}: the facade must be hidden until the script can make it work.`);
      const btn = card.match(/<button\b[^>]*\sdata-map-load=[^>]*>/);
      if (!btn) {
        fail(`${w}: a facade without its button.`);
        return;
      }
      if (attr(btn[0], 'type') !== 'button') fail(`${w}: the facade button needs type="button".`);
      if (decode(attr(btn[0], 'aria-label')) !== `Show the map of ${name}`) fail(`${w}: the facade button is named "${decode(attr(btn[0], 'aria-label'))}", expected "Show the map of ${name}".`);
      const desc = attr(btn[0], 'aria-describedby');
      const note = desc && card.match(new RegExp(`<p\\b[^>]*\\sid="${desc}"[^>]*>([\\s\\S]*?)</p>`));
      if (!note || !/Google/.test(text(note[1]))) fail(`${w}: the facade button must be described by a visible notice that the map loads from Google.`);
      const load = decode(attr(btn[0], 'data-map-load')) || '';
      if (!/^https:\/\/www\.google\.com\/maps\?q=[^&]+(?:&z=\d+)?&output=embed$/.test(load)) fail(`${w}: the embed URL ${load} is not www.google.com/maps?q=…&output=embed.`);
      if (decode(attr(btn[0], 'data-map-title')) !== `Map of ${name}`) fail(`${w}: the map would be titled "${decode(attr(btn[0], 'data-map-title'))}", expected "Map of ${name}".`);
      if (/<img\b[^>]*class="map__photo"/.test(card)) {
        photos++;
        const img = card.match(/<img\b[^>]*class="map__photo"[^>]*>/)[0];
        if (attr(img, 'alt') !== '') fail(`${w}: the facade photo sits inside a named button; it must be alt="".`);
      } else {
        panels++;
        const d = (card.match(/<svg\b[^>]*class="map__pin"[\s\S]*?<path\b[^>]*\sd="([^"]+)"/) || [])[1];
        if (d !== faPin) fail(`${w}: the pin is not Font Awesome Free's location-dot.`);
      }
    });
  });
  if (demo && !(photos && panels)) fail(`${rel}: the demo needs a photo facade and a neutral one.`);
  if (demo && !facades) fail(`${rel}: the demo has no facade.`);
  const runtimes = (html.match(/window\.__superheroMap = \{/g) || []).length;
  if (roots.length && runtimes !== 1) fail(`${rel}: the map runtime is on the page ${runtimes} times; it must be once.`);
  if (roots.length && !(/f\.loading = 'lazy'/.test(html) && /f\.title = btn\.dataset\.mapTitle/.test(html))) fail(`${rel}: the runtime must create the iframe with loading="lazy" and its title.`);
};
const mapPages = [
  { rel: 'dist/map/index.html', html: built('dist/map/index.html'), demo: true },
  { rel: 'dist/index.html', html: built('dist/index.html'), demo: false },
];
for (const p of mapPages) for (const m of run(checkMapPage, p)) fail(m);
const mapContrast = [];
const checkMapStyle = (component, fail, report) => {
  const css = styleOf(component);
  const t = fallbacks(css, MAP, fail);
  pairs(
    t,
    [
      ['--map-text', '--map-surface', 4.5, 'card text'],
      ['--map-link', '--map-surface', 4.5, 'links'],
      ['--map-notice', '--map-surface', 4.5, 'notice'],
      ['--map-on-accent', '--map-accent', 4.5, 'button text'],
    ],
    MAP,
    fail,
    report,
  );
  if (/\b(?:animation|transition)\s*:/.test(outsideNoPreference(css))) fail(`${MAP}: an animation or transition outside @media (prefers-reduced-motion: no-preference).`);
};
checkMapStyle(mapSrc, fail, mapContrast);
{
  const demo = mapPages[0];
  const re = (a, b) => (x) => ({ ...x, html: x.html.replace(a, b) });
  mutate('a facade shows without JavaScript', checkMapPage, demo, re(/(class="map__media") hidden/, '$1'));
  mutate('the facade button loses its name', checkMapPage, demo, re(/aria-label="Show the map of Navy Pier"/, ''));
  mutate('the Google notice is gone', checkMapPage, demo, re(/Loads a map from Google\./, 'Loads a map.'));
  mutate('a map iframe at load', checkMapPage, demo, re('<address', '<iframe src="https://www.google.com/maps?q=x&amp;output=embed"></iframe><address'));
  mutate('the JavaScript API instead of the embed URL', checkMapPage, demo, re(/data-map-load="https:\/\/www\.google\.com\/maps\?q=/, 'data-map-load="https://www.google.com/maps/embed/v1/place?key=K&amp;q='));
  mutate('"Directions" loses the place in its name', checkMapPage, demo, re(/aria-label="Directions to Navy Pier"/, 'aria-label="Directions"'));
  mutate('a card without <address>', checkMapPage, demo, re(/<address\b([^>]*)>([\s\S]*?)<\/address>/, '<div$1>$2</div>'));
  mutate('a pin that is not Font Awesome Free', checkMapPage, demo, re(/(class="map__pin"[\s\S]*?<path\b[^>]*\sd=")M0/, '$1M1'));
  mutate('the lazy iframe dropped from the runtime', checkMapPage, demo, re("f.loading = 'lazy';", ''));
  mutate('a pale button fill', (s, f) => checkMapStyle(s, f), mapSrc, (s) => s.replaceAll('var(--map-accent, #5933d8)', 'var(--map-accent, #a894f0)'));
}
finish('map');

console.log(`check-media-and-links ok: ${pages.length} built pages load nothing from Google, YouTube or Vimeo; video-gallery parser is video-player's, its no-JS render and ARIA hold on 2 pages; map URLs, facades and links hold on 2 pages, contrast ${mapContrast.join(', ')}; ${mutations} mutations caught.`);
