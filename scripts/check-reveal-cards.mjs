#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the reveal cards: the
 * elements that hide a little text behind a pin, an item or a panel and show it on request.
 * For each one it checks the geometry against golden cases, the static render (what a visitor
 * without JavaScript gets, and what the script starts from) and the ARIA contract, on the
 * built demo page and on the gallery index (where every element's script shares one page).
 *
 * Then it breaks each element on purpose. Every mutation below is applied to a copy of the
 * source or the built HTML and run through the same validator, which must refuse it; a check
 * that still passes a broken element is itself broken, and this says so.
 *
 * hotspot
 * 1. Placement: the `<hs-place>` block of Hotspot.astro (types stripped, the same function the
 *    build runs) against golden (x, y) → above/below, start/center/end cases.
 * 2. The built page, per figure, against the demo's fixture (public/demo/hotspot-points.json):
 *    - no-JS: each point has an <a href="#…"> pin at its --hs-x/--hs-y, pointing at an item
 *      of a numbered list (role="list") that holds its title, text and image, none of it hidden;
 *    - each point has a <button type="button" aria-expanded="false" hidden> pin at the same
 *      spot, named by the title, aria-controls → its item, aria-describedby → the item's text;
 *    - each item's data-v / data-h are what the placement function says for its x, y;
 *    - tour: a hidden Start tour button; each item a hidden group labelled "i of n" + title, with
 *      Previous except on the first and Next except on the last unless `repeat`, and End tour;
 *      no tour markup on a figure without `tour`;
 *    - the script once per page, and one boot call per later figure.
 * 3. The pin's hit area is 44px in the component's CSS; the fallback colours clear 4.5:1.
 *
 * Exits 1 with one line per failure.
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
  console.error(`check-reveal-cards failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};
const summary = [];

// ------------------------------------------------------------------ helpers
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const decode = (s) =>
  String(s ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const text = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/** An attribute's value; '' for a bare attribute; undefined when absent. */
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? decode(m[1] ?? '') : undefined;
};
const openTag = (el) => el.match(/^<[^>]+>/)[0];
/** The element that starts at `index`, up to its matching close tag (same tag name). */
const elementAt = (src, index) => {
  const name = src.slice(index + 1).match(/^[a-z0-9]+/i)[0];
  const re = new RegExp(`<\\/?${name}\\b[^>]*>`, 'gi');
  re.lastIndex = index;
  let depth = 0;
  for (let t; (t = re.exec(src)); ) {
    depth += t[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return src.slice(index, re.lastIndex);
  }
  return src.slice(index);
};
/** Every element whose opening tag matches `re` (a regex on the opening tag). */
const all = (src, re) => [...src.matchAll(new RegExp(re.source, 'g'))].map((m) => elementAt(src, m.index));
/** A `// <name>` … `// </name>` block of a component, imported as a module exporting `fn`. */
const block = async (src, name, fn) => {
  const m = src.match(new RegExp(`// <${name}>\\n([\\s\\S]*?)// </${name}>`));
  if (!m) return null;
  const js = stripTypeScriptTypes(m[1], { mode: 'strip' });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(`${js}\nexport default ${fn};`).toString('base64')}`);
  return mod.default;
};
const lum = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
/** The literal fallback of `var(--name, #hex)` in a component's CSS. */
const fallback = (src, name) => src.match(new RegExp(`var\\(${name}, (#[0-9a-f]{3,6})\\)`, 'i'))?.[1];
const pages = (id) => [`dist/${id}/index.html`, 'dist/index.html'].filter((rel) => {
  if (existsSync(join(root, rel))) return true;
  fail(`${rel} is missing; run astro build (check-catalog.mjs does) first.`);
  return false;
});
/** A mutation must make `validate` report at least one failure. */
const mutations = [];
const mustFail = (element, label, problems) => {
  mutations.push(`${element}: ${label}`);
  if (!problems.length) fail(`${element}: the check passed a broken element (${label}); it no longer pins that.`);
};
/** Apply `from` → `to` once; fail loudly if the anchor is gone, so a mutation never tests nothing. */
const mutate = (element, label, src, from, to) => {
  const out = src.replace(from, to);
  if (out === src) fail(`${element}: mutation "${label}" found nothing to change; update the mutation.`);
  return out;
};

// ================================================================== hotspot
const hsFile = 'src/library/hotspot/Hotspot.astro';
const hsSrc = read(hsFile);

// 1. Placement.
const hotspotPlace = await block(hsSrc, 'hs-place', 'hotspotPlace');
if (!hotspotPlace) {
  fail(`${hsFile} has no \`// <hs-place>\` … \`// </hs-place>\` block.`);
  finish('hotspot placement');
}
const PLACES = [
  // [x, y, v, h]
  [0, 0, 'below', 'start'],
  [10, 10, 'below', 'start'],
  [24.9, 80, 'above', 'start'],
  [25, 0, 'below', 'center'],
  [50, 49.9, 'below', 'center'],
  [50, 50, 'above', 'center'],
  [75, 100, 'above', 'center'],
  [75.1, 20, 'below', 'end'],
  [100, 100, 'above', 'end'],
];
const checkPlace = (place) =>
  PLACES.flatMap(([x, y, v, h]) => {
    const got = place(x, y);
    return got.v === v && got.h === h ? [] : [`hotspot placement (${x}, ${y}): got ${got.v}/${got.h}, expected ${v}/${h}.`];
  });
checkPlace(hotspotPlace).forEach(fail);
finish('hotspot placement');

// 2. The built page.
const hsFixture = JSON.parse(read('public/demo/hotspot-points.json'));
const hsExpected = [
  { name: 'room', ...hsFixture.room, tour: true, repeat: true, autoplay: 5000 },
  { name: 'hills', ...hsFixture.hills, tour: false, repeat: false, autoplay: 0 },
];
for (const e of hsExpected) {
  for (const p of e.points) if (p.image && !existsSync(join(root, 'public/demo', p.image))) fail(`hotspot fixture: ${e.name} "${p.title}" names image ${p.image}, not in public/demo/.`);
}

const pos = (tag) => {
  const m = (attr(tag, 'style') ?? '').match(/^--hs-x:([\d.]+)%;--hs-y:([\d.]+)%$/);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
};
/** Everything wrong with the built hotspot figures in `html`, against `expected`. */
const validateHotspot = (html, expected, place, where) => {
  const out = [];
  const bad = (m) => out.push(`${where}: ${m}`);
  const figures = all(html, /<figure\b[^>]*\sdata-hs=/);
  if (figures.length !== expected.length) bad(`expected ${expected.length} hotspot figures, found ${figures.length}.`);
  figures.forEach((fig, f) => {
    const e = expected[f];
    if (!e) return;
    const n = e.points.length;
    const at = `figure ${f + 1} (${e.name})`;
    const top = openTag(fig);
    if (/\sdata-(ready|open|touring)\b/.test(top)) bad(`${at}: the static figure carries a runtime state attribute.`);
    let cfg = {};
    try {
      cfg = JSON.parse(attr(top, 'data-hs'));
    } catch {
      bad(`${at}: data-hs is not JSON.`);
    }
    for (const k of ['tour', 'repeat', 'autoplay']) if (cfg[k] !== e[k]) bad(`${at}: config ${k} is ${cfg[k]}, the demo sets ${e[k]}.`);
    const img = fig.match(/<img\b[^>]*class="hs__img"[^>]*>/)?.[0];
    if (!img || attr(img, 'alt') !== e.alt) bad(`${at}: the image's alt is not the fixture's.`);

    const legend = all(fig, /<ol\b[^>]*class="hs__legend"/)[0];
    if (!legend) {
      bad(`${at}: no numbered legend (<ol class="hs__legend">).`);
      return;
    }
    if (attr(openTag(legend), 'role') !== 'list') bad(`${at}: the legend needs role="list" (list-style: none drops list semantics in Safari).`);
    const items = all(legend, /<li\b/);
    const links = all(fig, /<a\b[^>]*\sdata-hs-link/);
    const pins = all(fig, /<button\b[^>]*\sdata-hs-pin=/);
    if (items.length !== n) bad(`${at}: ${items.length} legend items for ${n} points.`);
    if (links.length !== n) bad(`${at}: ${links.length} link pins for ${n} points.`);
    if (pins.length !== n) bad(`${at}: ${pins.length} button pins for ${n} points.`);
    const lastPin = Math.max(...[...links, ...pins].map((el) => fig.indexOf(el)));
    if (fig.indexOf(legend) < lastPin) bad(`${at}: the legend must come after the pins, under the image.`);

    e.points.forEach((p, i) => {
      const pt = `${at}, point ${i + 1} ("${p.title}")`;
      const item = items[i];
      const link = links[i];
      const pin = pins[i];
      if (!item || !link || !pin) return;
      const itag = openTag(item);
      const id = attr(itag, 'id');
      // The legend item: the no-JS text, and the panel.
      if (attr(itag, 'hidden') !== undefined) bad(`${pt}: its legend item is hidden in the static HTML.`);
      const ip = pos(itag);
      if (!ip || ip.x !== p.x || ip.y !== p.y) bad(`${pt}: legend item at ${JSON.stringify(ip)}, fixture says (${p.x}, ${p.y}).`);
      const want = place(p.x, p.y);
      if (attr(itag, 'data-v') !== want.v || attr(itag, 'data-h') !== want.h) bad(`${pt}: panel placed ${attr(itag, 'data-v')}/${attr(itag, 'data-h')}, placement says ${want.v}/${want.h}.`);
      if (attr(itag, 'data-n') !== String(i + 1)) bad(`${pt}: legend number is ${attr(itag, 'data-n')}.`);
      const title = item.match(/<p\b[^>]*class="hs__title"[^>]*>([\s\S]*?)<\/p>/);
      const body = item.match(/<p\b([^>]*)class="hs__text"([^>]*)>([\s\S]*?)<\/p>/);
      if (!title || text(title[1]) !== p.title) bad(`${pt}: legend item title is not "${p.title}".`);
      if (!body || text(body[3]) !== p.text) bad(`${pt}: legend item text is not the fixture's.`);
      const textId = body && attr(`<p${body[1]}${body[2]}>`, 'id');
      if (p.image) {
        const pimg = item.match(/<img\b[^>]*>/)?.[0];
        if (!pimg || !attr(pimg, 'src')?.endsWith(p.image) || attr(pimg, 'alt') !== p.imageAlt) bad(`${pt}: legend item lacks its image ${p.image} with alt "${p.imageAlt}".`);
      }
      // The no-JS pin: a link into the legend.
      const ltag = openTag(link);
      if (attr(ltag, 'href') !== `#${id}`) bad(`${pt}: link pin points at ${attr(ltag, 'href')}, its legend item is #${id}.`);
      if (attr(ltag, 'hidden') !== undefined) bad(`${pt}: the link pin is hidden in the static HTML; without JavaScript it is the pin.`);
      const lp = pos(ltag);
      if (!lp || lp.x !== p.x || lp.y !== p.y) bad(`${pt}: link pin at ${JSON.stringify(lp)}, fixture says (${p.x}, ${p.y}).`);
      if (!text(link).includes(p.title)) bad(`${pt}: the link pin's text does not include the title.`);
      // The scripted pin.
      const btag = openTag(pin);
      if (attr(btag, 'type') !== 'button') bad(`${pt}: the pin button needs type="button".`);
      if (attr(btag, 'aria-expanded') !== 'false') bad(`${pt}: the pin button needs aria-expanded="false" in the static HTML.`);
      if (attr(btag, 'hidden') === undefined) bad(`${pt}: the pin button must render hidden, or a visitor without JavaScript meets a button that does nothing.`);
      if (attr(btag, 'aria-controls') !== id) bad(`${pt}: aria-controls="${attr(btag, 'aria-controls')}" is not its legend item #${id}.`);
      if (!textId || attr(btag, 'aria-describedby') !== textId) bad(`${pt}: aria-describedby="${attr(btag, 'aria-describedby')}" is not its text (#${textId}).`);
      const bp = pos(btag);
      if (!bp || bp.x !== p.x || bp.y !== p.y) bad(`${pt}: pin button at ${JSON.stringify(bp)}, fixture says (${p.x}, ${p.y}).`);
      const name = text(pin.replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, ''));
      if (name !== p.title) bad(`${pt}: the pin button is named "${name}", expected "${p.title}".`);

      // The tour controls.
      const group = all(item, /<div\b[^>]*\sdata-hs-tour/)[0];
      if (!e.tour) {
        if (group) bad(`${pt}: tour controls on a figure without \`tour\`.`);
        return;
      }
      if (!group) return bad(`${pt}: no tour controls.`);
      const gtag = openTag(group);
      if (attr(gtag, 'role') !== 'group' || attr(gtag, 'hidden') === undefined) bad(`${pt}: the tour controls must be a hidden role="group".`);
      const [countId, titleId] = (attr(gtag, 'aria-labelledby') ?? '').split(' ');
      const count = group.match(new RegExp(`<span\\b[^>]*id="${countId}"[^>]*>([\\s\\S]*?)</span>`));
      if (!count || text(count[1]) !== `${i + 1} of ${n}`) bad(`${pt}: the tour group is not labelled "${i + 1} of ${n}".`);
      if (!title || !title[0].includes(`id="${titleId}"`)) bad(`${pt}: the tour group's label does not include the title.`);
      const navs = [...group.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((m) => [attr(`<b${m[1]}>`, 'data-hs-nav'), text(m[2]), attr(`<b${m[1]}>`, 'type')]);
      const roles = navs.map((x) => x[0]).join(',');
      const wantRoles = [e.repeat || i > 0 ? 'prev' : null, e.repeat || i < n - 1 ? 'next' : null, 'end'].filter(Boolean).join(',');
      if (roles !== wantRoles) bad(`${pt}: tour buttons are [${roles}], expected [${wantRoles}].`);
      if (navs.some((x) => x[2] !== 'button' || !x[1])) bad(`${pt}: every tour button needs type="button" and a name.`);
    });

    const start = fig.match(/<button\b[^>]*\sdata-hs-start[^>]*>([\s\S]*?)<\/button>/);
    if (e.tour && (!start || attr(start[0], 'hidden') === undefined || attr(start[0], 'type') !== 'button' || !text(start[1]))) bad(`${at}: the tour needs a named, hidden Start tour button.`);
    if (!e.tour && start) bad(`${at}: a Start tour button on a figure without \`tour\`.`);
    if (/<script\b/.test(fig)) bad(`${at}: a script inside the figure.`);
  });
  const defs = (html.match(/window\.__superheroHotspot \|\|=/g) || []).length;
  const calls = (html.match(/window\.__superheroHotspot && window\.__superheroHotspot\(\);/g) || []).length;
  if (defs !== 1) bad(`the hotspot script is on the page ${defs} times; it must be once.`);
  if (calls !== Math.max(0, figures.length - 1)) bad(`expected ${figures.length - 1} one-line boot calls for later figures, found ${calls}.`);
  return out;
};

const hsPages = pages('hotspot');
const hsHtml = {};
for (const rel of hsPages) {
  hsHtml[rel] = readFileSync(join(root, rel), 'utf8');
  validateHotspot(hsHtml[rel], hsExpected, hotspotPlace, rel).forEach(fail);
}
finish('hotspot page');

// 3. The hit area and the colours.
const pinRule = hsSrc.match(/\n {2}\.hs__pin \{([\s\S]*?)\n {2}\}/)?.[1] ?? '';
if (!/\n\s+width: 44px;/.test(pinRule) || !/\n\s+height: 44px;/.test(pinRule)) fail(`${hsFile}: the .hs__pin rule must set width and height to 44px (the hit area, whatever the image size).`);
const hsColours = [
  ['panel text', '--hs-panel-fg', '--hs-panel-bg'],
  ['tour counter', '--hs-muted', '--hs-panel-bg'],
  ['pin number', '--hs-pin-fg', '--hs-accent'],
];
const hsRatios = [];
for (const [label, fg, bg] of hsColours) {
  const a = fallback(hsSrc, fg);
  const b = fallback(hsSrc, bg);
  if (!a || !b) {
    fail(`${hsFile}: no literal fallback for ${fg} or ${bg} to measure.`);
    continue;
  }
  const r = contrast(a, b);
  hsRatios.push(`${label} ${r.toFixed(2)}:1`);
  if (r < 4.5) fail(`hotspot ${label}: ${a} on ${b} is ${r.toFixed(2)}:1, under 4.5:1.`);
}
finish('hotspot hit area and colours');

// Mutations.
{
  const src = hsHtml[hsPages[0]];
  const v = (html) => validateHotspot(html, hsExpected, hotspotPlace, 'mutant');
  mustFail('hotspot', 'placement flips at y > 50 instead of y >= 50', checkPlace(await block(mutate('hotspot', 'placement', hsSrc, 'y >= 50', 'y > 50'), 'hs-place', 'hotspotPlace')));
  mustFail('hotspot', 'a pin button without aria-expanded', v(mutate('hotspot', 'aria-expanded', src, ' aria-expanded="false"', '')));
  mustFail('hotspot', 'a pin button shown without JavaScript', v(mutate('hotspot', 'hidden pin', src, /(<button type="button" class="hs__pin"[^>]*?) hidden/, '$1')));
  mustFail('hotspot', 'a link pin moved 1% right', v(mutate('hotspot', 'moved pin', src, `--hs-x:${hsFixture.room.points[0].x}%`, `--hs-x:${hsFixture.room.points[0].x + 1}%`)));
  mustFail('hotspot', "a legend item's text dropped", v(mutate('hotspot', 'text dropped', src, `>${hsFixture.room.points[1].text}</p>`, '></p>')));
  mustFail('hotspot', 'a panel placed below where it should open above', v(mutate('hotspot', 'placed', src, 'data-v="above"', 'data-v="below"')));
  mustFail('hotspot', 'a repeating tour step without Previous', v(mutate('hotspot', 'no prev', src, /<button type="button" class="hs__navbtn" data-hs-nav="prev"[^>]*>[^<]*<\/button>/, '')));
}
finish('hotspot mutations');
summary.push(`hotspot: ${PLACES.length} placement cases, ${hsExpected.length} figures on ${hsPages.length} pages, 44px pins, ${hsRatios.join(', ')}`);

console.log(`check-reveal-cards ok: ${summary.join('; ')}; ${mutations.length} mutations refused.`);
