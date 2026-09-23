#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the video-player element.
 *
 * 1. The parser: the source between the `<video-player-parse>` markers in
 *    src/library/video-player/VideoPlayer.astro, types stripped by Node, imported as a module.
 *    It is what turns `src` into a YouTube id, a Vimeo id or file sources, and builds the
 *    iframe URL, so a golden table of URLs pins it.
 * 2. The facade contract, on the built demo page and on the gallery index (which renders every
 *    demo): at load there is no iframe, script, link or image from YouTube, Vimeo or ytimg;
 *    every player has a button named "Play: <title>"; the embeds that will be created are
 *    youtube-nocookie.com or player.vimeo.com with dnt=1; the self-hosted player has
 *    <video preload="none" controls> with a <track kind="captions"> whose file exists.
 *
 * Exits 1 with one line per failed case.
 */
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-video-player failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};

// -------------------------------------------------------------------- 1. parser
const component = readFileSync(join(root, 'src/library/video-player/VideoPlayer.astro'), 'utf8');
const m = component.match(/\/\/ <video-player-parse>\n([\s\S]*?)\/\/ <\/video-player-parse>/);
if (!m) {
  fail('VideoPlayer.astro has no `// <video-player-parse>` … `// </video-player-parse>` block.');
  finish('parser');
}
const js = stripTypeScriptTypes(m[1], { mode: 'strip' });
const { parseVideoSrc, embedUrl, watchUrl, aspectRatio } = await import(
  `data:text/javascript;base64,${Buffer.from(`${js}\nexport { parseVideoSrc, embedUrl, watchUrl, aspectRatio };`).toString('base64')}`
);

const BB = 'aqz-KE-bpKQ';
/** [src, expected parse (null = must be refused)] */
const parses = [
  [BB, { kind: 'youtube', id: BB }],
  [`https://www.youtube.com/watch?v=${BB}`, { kind: 'youtube', id: BB }],
  [`https://www.youtube.com/watch?feature=share&v=${BB}&t=42`, { kind: 'youtube', id: BB }],
  [`https://m.youtube.com/watch?v=${BB}`, { kind: 'youtube', id: BB }],
  [`https://youtu.be/${BB}?si=abc`, { kind: 'youtube', id: BB }],
  [`youtu.be/${BB}`, { kind: 'youtube', id: BB }],
  [`https://www.youtube.com/shorts/${BB}`, { kind: 'youtube', id: BB }],
  [`https://www.youtube.com/embed/${BB}?rel=0`, { kind: 'youtube', id: BB }],
  [`https://www.youtube-nocookie.com/embed/${BB}`, { kind: 'youtube', id: BB }],
  [`https://www.youtube.com/live/${BB}`, { kind: 'youtube', id: BB }],
  ['https://www.youtube.com/@BlenderOfficial', null],
  ['https://www.youtube.com/watch?v=tooshort', null],
  ['76979871', { kind: 'vimeo', id: '76979871' }],
  ['https://vimeo.com/76979871', { kind: 'vimeo', id: '76979871' }],
  ['https://vimeo.com/76979871/8272103f6e', { kind: 'vimeo', id: '76979871', hash: '8272103f6e' }],
  ['https://vimeo.com/channels/staffpicks/76979871', { kind: 'vimeo', id: '76979871' }],
  ['https://player.vimeo.com/video/76979871?h=8272103f6e&badge=0', { kind: 'vimeo', id: '76979871', hash: '8272103f6e' }],
  ['https://vimeo.com/about', null],
  ['/video/tour.mp4', { kind: 'file', sources: [{ src: '/video/tour.mp4', type: 'video/mp4' }] }],
  ['/video/tour.webm?v=2', { kind: 'file', sources: [{ src: '/video/tour.webm?v=2', type: 'video/webm' }] }],
  [[{ src: '/a.webm' }, { src: '/a.mp4', type: 'video/mp4' }], { kind: 'file', sources: [{ src: '/a.webm', type: 'video/webm' }, { src: '/a.mp4', type: 'video/mp4' }] }],
  [[], null],
  ['', null],
  ['https://example.com/video', null],
  ['/images/poster.jpg', null],
];
for (const [src, want] of parses) {
  const got = parseVideoSrc(src);
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    fail(`parseVideoSrc(${JSON.stringify(src)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(want)}.`);
  }
}

const yt = { kind: 'youtube', id: BB };
const vm = { kind: 'vimeo', id: '76979871', hash: '8272103f6e' };
const urls = [
  ['youtube, defaults', embedUrl(yt), `https://www.youtube-nocookie.com/embed/${BB}?autoplay=1&rel=0&playsinline=1`],
  ['youtube, muted loop start', embedUrl(yt, { muted: true, loop: true, start: 30.7 }), `https://www.youtube-nocookie.com/embed/${BB}?autoplay=1&rel=0&playsinline=1&mute=1&loop=1&playlist=${BB}&start=30`],
  ['youtube, no autoplay', embedUrl(yt, { autoplay: false }), `https://www.youtube-nocookie.com/embed/${BB}?autoplay=0&rel=0&playsinline=1`],
  ['vimeo, unlisted, start', embedUrl(vm, { start: 12 }), 'https://player.vimeo.com/video/76979871?dnt=1&autoplay=1&h=8272103f6e#t=12s'],
  ['vimeo, muted loop', embedUrl({ kind: 'vimeo', id: '1' }, { muted: true, loop: true }), 'https://player.vimeo.com/video/1?dnt=1&autoplay=1&muted=1&loop=1'],
  ['file has no embed', embedUrl({ kind: 'file', sources: [{ src: '/a.mp4' }] }), null],
  ['watch, youtube', watchUrl(yt), `https://www.youtube.com/watch?v=${BB}`],
  ['watch, vimeo unlisted', watchUrl(vm), 'https://vimeo.com/76979871/8272103f6e'],
];
for (const [label, got, want] of urls) if (got !== want) fail(`${label}: ${got}, expected ${want}.`);

const ratios = [[undefined, 16 / 9], [4 / 3, 4 / 3], ['16/9', 16 / 9], ['4 / 3', 4 / 3], ['9:16', 9 / 16], ['2.35', 2.35], ['nonsense', 16 / 9], [0, 16 / 9]];
for (const [a, want] of ratios) {
  const got = aspectRatio(a);
  if (Math.abs(got - want) > 1e-9) fail(`aspectRatio(${JSON.stringify(a)}) = ${got}, expected ${want}.`);
}
finish('parser');

// ------------------------------------------------------------ 2. built pages
const pages = ['dist/video-player/index.html', 'dist/index.html'];
const third = /(?:youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|ytimg\.com|vimeocdn\.com)/i;
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

for (const rel of pages) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    fail(`${rel} is missing; run astro build (check-catalog.mjs does).`);
    continue;
  }
  // What the browser fetches at load. <noscript> content is not parsed as markup with
  // scripting on, and its link is an <a>, which fetches nothing.
  const html = readFileSync(path, 'utf8').replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
  for (const t of html.match(/<(?:iframe|script|link|img|source|embed|object)\b[^>]*>/gi) || []) {
    const refs = [attr(t, 'src'), attr(t, 'href'), attr(t, 'srcset'), attr(t, 'data')].filter(Boolean);
    if (refs.some((r) => third.test(r))) fail(`${rel}: requests a third party at load: ${t.slice(0, 160)}`);
  }
  if (/<iframe\b/i.test(html)) fail(`${rel}: has an <iframe> at load; the player creates it on play.`);

  const roots = [...html.matchAll(/<(div|figure)\b[^>]*\sdata-vp(?=[\s>=])[^>]*>/g)];
  if (rel.startsWith('dist/video-player') && roots.length !== 3) fail(`${rel}: expected the demo's 3 players, found ${roots.length}.`);
  roots.forEach((r, i) => {
    const tag = r[0];
    const chunk = html.slice(r.index, roots[i + 1]?.index ?? html.length);
    const title = decode(attr(tag, 'data-vp-title'));
    const kind = attr(tag, 'data-vp-kind');
    const where = `${rel}, player ${i + 1} (${kind}, "${title}")`;
    if (!title) fail(`${where}: no data-vp-title, which names the iframe.`);
    const btn = chunk.match(/<button\b[^>]*\sdata-vp-play[^>]*>/);
    const name = btn && decode(attr(btn[0], 'aria-label'));
    if (!btn) fail(`${where}: no play button.`);
    else if (!name || name !== `Play: ${title}`) fail(`${where}: the play button is named "${name}", expected "Play: ${title}".`);
    if (btn && !/\stype="button"/.test(btn[0])) fail(`${where}: the play button needs type="button".`);
    if (kind === 'youtube' || kind === 'vimeo') {
      const embed = decode(attr(tag, 'data-vp-embed')) || '';
      if (kind === 'youtube' && !embed.startsWith('https://www.youtube-nocookie.com/embed/')) fail(`${where}: embed ${embed} is not youtube-nocookie.com.`);
      if (kind === 'vimeo' && !(embed.startsWith('https://player.vimeo.com/video/') && /[?&]dnt=1/.test(embed))) fail(`${where}: embed ${embed} is not player.vimeo.com with dnt=1.`);
      const img = chunk.match(/<img\b[^>]*class="vp__poster[^>]*>/);
      if (!img) fail(`${where}: no poster <img>.`);
      else if (!attr(img[0], 'alt')) fail(`${where}: the poster has no alt text.`);
    }
    if (kind === 'file') {
      const video = chunk.match(/<video\b[^>]*>/);
      if (!video) fail(`${where}: no <video>.`);
      else {
        if (!/\scontrols(?=[\s=>])/.test(video[0])) fail(`${where}: the <video> has no native controls.`);
        if (attr(video[0], 'preload') !== 'none') fail(`${where}: the <video> must be preload="none".`);
        if (/\sautoplay(?=[\s=>])/.test(video[0])) fail(`${where}: the <video> must not autoplay.`);
      }
      const track = chunk.match(/<track\b[^>]*\skind="captions"[^>]*>/);
      if (!track) fail(`${where}: no <track kind="captions">.`);
      else {
        const src = attr(track[0], 'src') || '';
        const file = src.replace(/^\/demo\//, 'public/demo/');
        if (!src.startsWith('/demo/') || !existsSync(join(root, file))) fail(`${where}: captions track ${src} does not exist in public/demo/.`);
      }
    }
  });
  if (rel.startsWith('dist/video-player')) {
    const kinds = roots.map((r) => attr(r[0], 'data-vp-kind'));
    if (!kinds.includes('file')) fail(`${rel}: the demo needs a self-hosted player.`);
    if (!roots.some((r) => /\sdata-vp-lightbox/.test(r[0]))) fail(`${rel}: the demo needs a lightbox player.`);
    if (!/<dialog\b[^>]*aria-label="[^"]+"/.test(html)) fail(`${rel}: the lightbox <dialog> has no aria-label.`);
    if (!/<button\b[^>]*aria-label="[^"]+"[^>]*data-vp-close/.test(html)) fail(`${rel}: the lightbox close button has no name.`);
  }
}
finish('built pages');

console.log(`check-video-player ok: ${parses.length + urls.length + ratios.length} parser cases, facade contract holds on ${pages.length} pages.`);
