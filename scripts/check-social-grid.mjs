#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the social-grid element's
 * accessibility contract and the demo's neutrality.
 *
 * 1. The fixture, public/demo/social-feed.json: the SocialFeedHandler shape; every image is a
 *    file in public/demo/ and none is an Instagram URL; the media types are mixed; some posts
 *    have no caption, so the fallback alt is exercised.
 * 2. The built demo page, dist/social-grid/index.html:
 *    - three grids (six columns, captions below, disconnected) and the empty feed renders
 *      nothing at all;
 *    - every tile is one link (permalink, rel=noopener, target=_blank) around an <img> with a
 *      non-empty alt, numeric width and height, loading=lazy, decoding=async;
 *    - every tile's accessible name is distinct within its grid;
 *    - VIDEO and CAROUSEL_ALBUM tiles carry a decorative mark with the hidden word, IMAGE none;
 *    - hover captions are aria-hidden; captions below are text outside the link;
 *    - no image anywhere on the page comes from Instagram's CDN;
 *    - the header says "@neutralgrounds on Instagram" when connected and "Recent posts",
 *      without "on Instagram", when disconnected;
 *    - the element ships no <script>.
 *
 * Exits 1 with one line per failed rule.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-social-grid failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};
const INSTAGRAM_IMAGE = /(^|[/.])(cdninstagram\.com|fbcdn\.net|instagram\.com)(\/|$|:)/i;

// ------------------------------------------------------------------ 1. fixture
const fixturePath = join(root, 'public/demo/social-feed.json');
if (!existsSync(fixturePath)) {
  fail('public/demo/social-feed.json is missing.');
  finish('fixture');
}
const feed = JSON.parse(readFileSync(fixturePath, 'utf8'));
const src = feed.source ?? {};
for (const k of ['username', 'profile_url', 'connected', 'last_pulled_at']) if (!(k in src)) fail(`the fixture's source has no \`${k}\`.`);
if (src.username !== 'neutralgrounds') fail(`the fixture's account is "${src.username}"; the demo account is @neutralgrounds, never a real client's.`);
if (!Array.isArray(feed.posts) || feed.posts.length !== 12) fail(`the fixture should hold 12 posts; it holds ${feed.posts?.length}.`);
const byPermalink = new Map();
for (const p of feed.posts ?? []) {
  for (const k of ['id', 'permalink', 'media_type', 'taken_at', 'image', 'alt', 'caption']) if (!(k in p)) fail(`fixture post ${p.id}: no \`${k}\`.`);
  if (!['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'].includes(p.media_type)) fail(`fixture post ${p.id}: media_type "${p.media_type}".`);
  if (Number.isNaN(new Date(p.taken_at).getTime())) fail(`fixture post ${p.id}: taken_at "${p.taken_at}" is not a date.`);
  if (!Number.isInteger(p.image?.width) || !Number.isInteger(p.image?.height)) fail(`fixture post ${p.id}: image needs integer width and height.`);
  if (INSTAGRAM_IMAGE.test(p.image?.url ?? '')) fail(`fixture post ${p.id}: image ${p.image.url} is an Instagram URL; the demo uses its own tiles.`);
  else if (!existsSync(join(root, 'public/demo', p.image?.url ?? ''))) fail(`fixture post ${p.id}: image ${p.image?.url} is not a file in public/demo/.`);
  byPermalink.set(p.permalink, p);
}
const types = new Set((feed.posts ?? []).map((p) => p.media_type));
if (types.size !== 3) fail(`the fixture should mix IMAGE, VIDEO and CAROUSEL_ALBUM; it has ${[...types].join(', ')}.`);
if (!(feed.posts ?? []).some((p) => !p.caption && !p.alt)) fail('the fixture needs a post with neither caption nor alt, to show the fallback alt.');
finish('fixture');

// ---------------------------------------------------------------- 2. the page
const pagePath = join(root, 'dist/social-grid/index.html');
if (!existsSync(pagePath)) {
  fail(`${pagePath} is missing; run astro build (check-catalog.mjs does) first.`);
  finish('render');
}
const html = readFileSync(pagePath, 'utf8');

/** The markup of each element from its opening tag to the matching close. */
function blocks(re, tag) {
  return [...html.matchAll(re)].map((m) => {
    let depth = 0;
    const t = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g');
    t.lastIndex = m.index;
    for (let x; (x = t.exec(html)); ) {
      depth += x[0].startsWith('</') ? -1 : 1;
      if (depth === 0) return html.slice(m.index, t.lastIndex);
    }
    return html.slice(m.index);
  });
}
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
/** Accessible name of a tile link: img alt plus text, skipping aria-hidden subtrees. */
function nameOf(link) {
  let s = link.replace(/<(\w+)[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/\1>/g, '');
  s = s.replace(/<img\b[^>]*>/g, (img) => ` ${attr(img, 'alt') ?? ''} `);
  return s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const grids = blocks(/<div[^>]*\sdata-sg(?=[\s>])[^>]*>/g, 'div');
if (grids.length !== 3) fail(`the demo page should render three grids (six columns, captions below, disconnected) and nothing for the empty feed; found ${grids.length}.`);

const empty = html.match(/<div[^>]*data-sg-demo-empty[^>]*>([\s\S]*?)<\/div>/);
if (!empty) fail('the demo has no data-sg-demo-empty wrapper around the empty-feed instance.');
else if (empty[1].trim()) fail(`an empty feed must render nothing; it rendered "${empty[1].trim().slice(0, 80)}".`);

for (const [gi, grid] of grids.entries()) {
  const label = `grid ${gi + 1}`;
  if (/<script\b/.test(grid)) fail(`${label}: the element ships a <script>; it has no JavaScript.`);
  const links = [...grid.matchAll(/<a class="sg__tile"[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);
  if (!links.length) fail(`${label}: no tiles.`);
  const names = new Map();
  for (const link of links) {
    const open = link.match(/^<a[^>]*>/)[0];
    const href = attr(open, 'href');
    const post = byPermalink.get(href);
    const who = `${label}, tile ${href}`;
    if (!post) fail(`${who}: the link is not a fixture permalink.`);
    if (!/\bnoopener\b/.test(attr(open, 'rel') ?? '')) fail(`${who}: rel lacks noopener.`);
    if (attr(open, 'target') !== '_blank') fail(`${who}: target is not _blank.`);
    const imgs = link.match(/<img\b[^>]*>/g) ?? [];
    if (imgs.length !== 1) fail(`${who}: expected one <img>, found ${imgs.length}.`);
    const img = imgs[0] ?? '';
    if (!(attr(img, 'alt') ?? '').trim()) fail(`${who}: the image has no alt, so the link has no name.`);
    for (const k of ['width', 'height']) if (!/^\d+$/.test(attr(img, k) ?? '')) fail(`${who}: the image has no numeric ${k}.`);
    if (attr(img, 'loading') !== 'lazy') fail(`${who}: the image is not loading="lazy".`);
    if (attr(img, 'decoding') !== 'async') fail(`${who}: the image is not decoding="async".`);
    const name = nameOf(link);
    if (names.has(name)) fail(`${label}: two tiles are both named "${name}".`);
    names.set(name, href);
    const mark = link.match(/<span class="sg__mark"[^>]*data-sg-mark="(\w+)"[^>]*>([\s\S]*?<\/span>)\s*<\/span>/);
    const want = post?.media_type === 'VIDEO' ? 'video' : post?.media_type === 'CAROUSEL_ALBUM' ? 'album' : null;
    if (want && !mark) fail(`${who}: a ${post.media_type} tile has no mark.`);
    if (!want && mark) fail(`${who}: an IMAGE tile carries a ${mark[1]} mark.`);
    if (want && mark) {
      if (mark[1] !== want) fail(`${who}: ${post.media_type} tile marked "${mark[1]}".`);
      if (!/<svg[^>]*aria-hidden="true"/.test(mark[2])) fail(`${who}: the mark's glyph is not aria-hidden.`);
      if (!new RegExp(`<span class="sg-vh"[^>]*>[^<]*\\b${want}\\b`).test(mark[2])) fail(`${who}: the mark has no visually hidden "${want}".`);
      if (!name.endsWith(`(${want})`)) fail(`${who}: the accessible name "${name}" does not end with "(${want})".`);
    }
    if (post && !post.alt && !post.caption && !/^Instagram post from \w+ \d{1,2}, \d{4}/.test(name)) fail(`${who}: a post with no alt and no caption should be named "Instagram post from <date>", not "${name}".`);
    if (/class="sg__overlay"(?![^>]*aria-hidden="true")/.test(link)) fail(`${who}: the hover caption is not aria-hidden.`);
  }
  if (/class="sg__below"/.test(grid) && /<a class="sg__tile"[^>]*>(?:(?!<\/a>)[\s\S])*class="sg__below"/.test(grid)) fail(`${label}: a caption below sits inside the link, doubling its name.`);
}
if (grids.length === 3) {
  if (!/class="sg__overlay"/.test(grids[0])) fail('grid 1 (default captions) has no hover captions.');
  if (!/class="sg__below"/.test(grids[1]) || /class="sg__overlay"/.test(grids[1])) fail('grid 2 should have captions below and no overlay.');
  const title = (g) => (g.match(/<p class="sg__title"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '').replace(/<[^>]+>/g, '').trim();
  if (title(grids[0]) !== '@neutralgrounds on Instagram') fail(`the connected header reads "${title(grids[0])}", not "@neutralgrounds on Instagram".`);
  if (attr(grids[2].match(/^<div[^>]*>/)[0], 'data-connected') !== 'false') fail('grid 3 should be the disconnected feed.');
  if (title(grids[2]) !== 'Recent posts') fail(`the disconnected header reads "${title(grids[2])}", not "Recent posts".`);
  if (/on Instagram/.test(title(grids[2]))) fail('the disconnected header still claims a live "on Instagram" feed.');
  if (/<p class="sg__title"[^>]*>\s*<a\b/.test(grids[2])) fail('the disconnected header line should be text, not a live profile link.');
}
for (const m of html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)) {
  if (INSTAGRAM_IMAGE.test(m[1])) fail(`the demo page shows an Instagram image, ${m[1]}.`);
}
finish('render');

console.log(`check-social-grid ok: fixture of ${feed.posts.length} posts, ${grids.length} grids, empty feed renders nothing.`);
