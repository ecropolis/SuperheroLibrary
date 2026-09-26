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
 * info-circle
 * 4. Geometry: the `<inc-geometry>` block of InfoCircle.astro against golden positions (n = 2 to
 *    6, clockwise from the top, three decimals, never -0).
 * 5. The built page, per circle, against public/demo/info-circle-items.json:
 *    - no-JS: the circle is `hidden`; a numbered list (role="list") holds every item's title
 *      (a heading), text and link, none of it hidden;
 *    - the centre is aria-live="polite" and empty (the script copies the chosen entry in);
 *    - each item is a <button type="button"> named by its title, aria-controls → the centre,
 *      aria-pressed, exactly one "true" and it is `startAt`; --inc-x/--inc-y are the geometry's;
 *      its icon is the named Font Awesome Free icon, or its image with alt="";
 *    - a hidden, named pause button exactly when the circle autoplays; the script once a page.
 * 6. Items keep a 44px minimum; the fallback colours clear 4.5:1; every icon the demo pastes is
 *    Font Awesome Free, byte for byte the package's path, with its attribution comment.
 *
 * slide-box
 * 7. Geometry: each `direction` parks the back one card-size off the matching edge in the
 *    component's CSS (up: translateY(100%), down: translateY(-100%), left: translateX(100%),
 *    right: translateX(-100%)), and an open card brings it to `transform: none`.
 * 8. The built page, per card, against public/demo/slide-box-cards.json:
 *    - the control is a <button type="button" aria-expanded="false" hidden> named by the title,
 *      aria-controls → the back;
 *    - no-JS: both panels, the back after the front, neither inert nor aria-hidden; the front
 *      has the title, the text and the icon (Font Awesome Free) or image, and no link; the back
 *      has the title, the back text and the CTA as a real link;
 *    - data-direction and data-trigger are the fixture's; the script once a page.
 * 9. The fallback colours clear 4.5:1; the demo's icons are Font Awesome Free.
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

// ============================================================== info-circle
const icFile = 'src/library/info-circle/InfoCircle.astro';
const icSrc = read(icFile);

// 4. Geometry.
const circlePositions = await block(icSrc, 'inc-geometry', 'circlePositions');
if (!circlePositions) {
  fail(`${icFile} has no \`// <inc-geometry>\` … \`// </inc-geometry>\` block.`);
  finish('info-circle geometry');
}
const RING = {
  2: [[50, 0], [50, 100]],
  3: [[50, 0], [93.301, 75], [6.699, 75]],
  4: [[50, 0], [100, 50], [50, 100], [0, 50]],
  5: [[50, 0], [97.553, 34.549], [79.389, 90.451], [20.611, 90.451], [2.447, 34.549]],
  6: [[50, 0], [93.301, 25], [93.301, 75], [50, 100], [6.699, 75], [6.699, 25]],
};
const checkRing = (fn) =>
  Object.entries(RING).flatMap(([n, want]) => {
    const got = fn(Number(n));
    if (got.length !== want.length) return [`info-circle geometry n=${n}: ${got.length} positions.`];
    return got.flatMap((g, i) =>
      g.x === want[i][0] && g.y === want[i][1] && !Object.is(g.x, -0) && !Object.is(g.y, -0)
        ? []
        : [`info-circle geometry n=${n}, item ${i + 1}: (${g.x}, ${g.y}), expected (${want[i][0]}, ${want[i][1]}).`],
    );
  });
checkRing(circlePositions).forEach(fail);
finish('info-circle geometry');

// Font Awesome Free: every icon the demo pastes is the package's, attribution included.
const faRoot = join(root, 'node_modules/@fortawesome/fontawesome-free/svgs');
const faPath = (svg) => svg.match(/<path[^>]*\sd="([^"]+)"/)?.[1];
/** Everything wrong with the `fa` map of a demo's source: `'name': \`<svg…>\`` entries. */
const validateFa = (demoSrc, where) => {
  const out = [];
  const entries = [...demoSrc.matchAll(/'([a-z0-9-]+)': `(<svg[\s\S]*?<\/svg>)`/g)];
  if (!entries.length) out.push(`${where}: no Font Awesome icons found in its \`fa\` map.`);
  for (const [, name, svg] of entries) {
    const file = join(faRoot, 'solid', `${name}.svg`);
    if (!existsSync(file)) {
      out.push(`${where}: "${name}" is not a Font Awesome Free solid icon.`);
      continue;
    }
    if (faPath(svg) !== faPath(readFileSync(file, 'utf8'))) out.push(`${where}: "${name}" is not Font Awesome Free's path for it.`);
    if (!svg.includes('<!--! Font Awesome Free')) out.push(`${where}: "${name}" lost Font Awesome's attribution comment (CC BY 4.0 needs it).`);
  }
  return out;
};
if (!existsSync(faRoot)) fail('@fortawesome/fontawesome-free is not installed; `npm i` first.');
finish('font awesome');
const icDemoSrc = read('src/components/demos/InfoCircleDemo.astro');
const icFa = Object.fromEntries([...icDemoSrc.matchAll(/'([a-z0-9-]+)': `(<svg[\s\S]*?<\/svg>)`/g)].map((m) => [m[1], faPath(m[2])]));
validateFa(icDemoSrc, 'InfoCircleDemo.astro').forEach(fail);
finish('info-circle icons');

// 5. The built page.
const icFixture = JSON.parse(read('public/demo/info-circle-items.json'));
const icExpected = [
  { name: 'process', ...icFixture.process, startAt: 0, autoplay: 5000 },
  { name: 'cafes', ...icFixture.cafes, autoplay: 0 },
];
for (const e of icExpected) {
  for (const it of e.items) {
    if (it.image && !existsSync(join(root, 'public/demo', it.image))) fail(`info-circle fixture: ${e.name} "${it.title}" names image ${it.image}, not in public/demo/.`);
    if (it.icon && !icFa[it.icon]) fail(`info-circle fixture: ${e.name} "${it.title}" names icon ${it.icon}, which the demo's \`fa\` map lacks.`);
  }
}
const icPos = (tag) => {
  const m = (attr(tag, 'style') ?? '').match(/^--inc-x:(-?[\d.]+)%;--inc-y:(-?[\d.]+)%$/);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
};
const validateInfoCircle = (html, expected, ring, where) => {
  const out = [];
  const bad = (m) => out.push(`${where}: ${m}`);
  const roots = all(html, /<div\b[^>]*\sdata-inc=/);
  if (roots.length !== expected.length) bad(`expected ${expected.length} info circles, found ${roots.length}.`);
  roots.forEach((el, r) => {
    const e = expected[r];
    if (!e) return;
    const n = e.items.length;
    const at = `circle ${r + 1} (${e.name})`;
    const top = openTag(el);
    if (/\sdata-ready\b/.test(top)) bad(`${at}: the static root carries data-ready.`);
    if (attr(top, 'role') !== 'group' || attr(top, 'aria-label') !== e.label) bad(`${at}: the root should be role="group" named "${e.label}".`);
    let cfg = {};
    try {
      cfg = JSON.parse(attr(top, 'data-inc'));
    } catch {
      bad(`${at}: data-inc is not JSON.`);
    }
    if (cfg.autoplay !== e.autoplay) bad(`${at}: autoplay is ${cfg.autoplay}, the demo sets ${e.autoplay}.`);

    const circle = all(el, /<div\b[^>]*\sdata-inc-circle/)[0];
    if (!circle) return bad(`${at}: no circle.`);
    if (attr(openTag(circle), 'hidden') === undefined) bad(`${at}: the circle must render hidden; without JavaScript the list is the element.`);
    const centre = all(circle, /<div\b[^>]*\sdata-inc-centre/)[0];
    const centreId = centre && attr(openTag(centre), 'id');
    if (!centre || attr(openTag(centre), 'aria-live') !== 'polite') bad(`${at}: the centre must be aria-live="polite".`);
    else if (text(centre)) bad(`${at}: the centre holds text in the static HTML; it would be a second copy of an entry.`);
    const buttons = all(circle, /<button\b[^>]*\sdata-inc-item=/);
    if (buttons.length !== n) bad(`${at}: ${buttons.length} item buttons for ${n} items.`);
    const want = ring(n);
    const pressed = buttons.map((b) => attr(openTag(b), 'aria-pressed'));
    if (pressed.filter((v) => v === 'true').length !== 1 || pressed[e.startAt] !== 'true') bad(`${at}: aria-pressed is [${pressed}]; exactly item ${e.startAt + 1} should be "true".`);
    if (pressed.some((v) => v !== 'true' && v !== 'false')) bad(`${at}: every item needs aria-pressed "true" or "false".`);

    const list = all(el, /<ol\b[^>]*class="inc__list"/)[0];
    if (!list) return bad(`${at}: no list.`);
    if (attr(openTag(list), 'role') !== 'list') bad(`${at}: the list needs role="list".`);
    const entries = all(list, /<li\b/);
    if (entries.length !== n) bad(`${at}: ${entries.length} list entries for ${n} items.`);

    e.items.forEach((it, i) => {
      const pt = `${at}, item ${i + 1} ("${it.title}")`;
      const b = buttons[i];
      if (b) {
        const bt = openTag(b);
        if (attr(bt, 'type') !== 'button') bad(`${pt}: the item needs type="button".`);
        if (!centreId || attr(bt, 'aria-controls') !== centreId) bad(`${pt}: aria-controls should name the centre (#${centreId}).`);
        const p = icPos(bt);
        if (!p || p.x !== want[i].x || p.y !== want[i].y) bad(`${pt}: at ${JSON.stringify(p)}, the geometry says (${want[i].x}, ${want[i].y}).`);
        const name = text(b.replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, ''));
        if (name !== it.title) bad(`${pt}: the button is named "${name}".`);
        if (it.icon && faPath(b) !== icFa[it.icon]) bad(`${pt}: the button's icon is not Font Awesome Free "${it.icon}".`);
        if (it.image) {
          const img = b.match(/<img\b[^>]*>/)?.[0];
          if (!img || !attr(img, 'src')?.endsWith(it.image) || attr(img, 'alt') !== '') bad(`${pt}: the button needs its image with alt="" (the title names it).`);
        }
      }
      const li = entries[i];
      if (!li) return;
      if (attr(openTag(li), 'hidden') !== undefined) bad(`${pt}: its list entry is hidden.`);
      const h = li.match(/<h([2-6])\b[^>]*class="inc__title"[^>]*>([\s\S]*?)<\/h\1>/);
      if (!h || text(h[2]) !== it.title) bad(`${pt}: the list entry's heading is not "${it.title}".`);
      const t = li.match(/<p\b[^>]*class="inc__text"[^>]*>([\s\S]*?)<\/p>/);
      if (!t || text(t[1]) !== it.text) bad(`${pt}: the list entry's text is not the fixture's.`);
      if (it.link) {
        const a = li.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/);
        if (!a || attr(`<a${a[1]}>`, 'href') !== it.link.href || text(a[2]) !== it.link.text) bad(`${pt}: the list entry lacks its link "${it.link.text}".`);
      }
    });

    const play = el.match(/<button\b[^>]*\sdata-inc-play[^>]*>([\s\S]*?)<\/button>/);
    if (e.autoplay) {
      if (!play || attr(play[0], 'hidden') === undefined || attr(play[0], 'type') !== 'button' || !text(play[1])) bad(`${at}: autoplay needs a named, hidden pause button (WCAG 2.2.2).`);
    } else if (play) bad(`${at}: a pause button without autoplay.`);
  });
  const defs = (html.match(/window\.__superheroInfoCircle \|\|=/g) || []).length;
  const calls = (html.match(/window\.__superheroInfoCircle && window\.__superheroInfoCircle\(\);/g) || []).length;
  if (defs !== 1) bad(`the info-circle script is on the page ${defs} times; it must be once.`);
  if (calls !== Math.max(0, roots.length - 1)) bad(`expected ${roots.length - 1} one-line boot calls for later circles, found ${calls}.`);
  return out;
};

const icPages = pages('info-circle');
const icHtml = {};
for (const rel of icPages) {
  icHtml[rel] = readFileSync(join(root, rel), 'utf8');
  validateInfoCircle(icHtml[rel], icExpected, circlePositions, rel).forEach(fail);
}
finish('info-circle page');

// 6. Size and colours.
const itemRule = icSrc.match(/\n {2}\.inc__item \{([\s\S]*?)\n {2}\}/)?.[1] ?? '';
if (!/\n\s+min-width: 44px;/.test(itemRule) || !/\n\s+min-height: 44px;/.test(itemRule)) fail(`${icFile}: the .inc__item rule must keep min-width and min-height at 44px.`);
const icRatios = [];
for (const [label, fg, bg] of [
  ['centre text', '--inc-fg', '--inc-centre-bg'],
  ['chosen icon', '--inc-active-fg', '--inc-accent'],
  ['link on the disc', '--inc-accent', '--inc-centre-bg'],
]) {
  const a = fallback(icSrc, fg);
  const b = fallback(icSrc, bg);
  if (!a || !b) {
    fail(`${icFile}: no literal fallback for ${fg} or ${bg} to measure.`);
    continue;
  }
  const r = contrast(a, b);
  icRatios.push(`${label} ${r.toFixed(2)}:1`);
  if (r < 4.5) fail(`info-circle ${label}: ${a} on ${b} is ${r.toFixed(2)}:1, under 4.5:1.`);
}
finish('info-circle size and colours');

// Mutations.
{
  const src = icHtml[icPages[0]];
  const v = (html) => validateInfoCircle(html, icExpected, circlePositions, 'mutant');
  mustFail('info-circle', 'the ring starts at 3 o’clock, not the top', checkRing(await block(mutate('info-circle', 'start angle', icSrc, 'startDeg = -90', 'startDeg = 0'), 'inc-geometry', 'circlePositions')));
  mustFail('info-circle', 'two items pressed', v(mutate('info-circle', 'pressed', src, 'aria-pressed="false"', 'aria-pressed="true"')));
  mustFail('info-circle', 'the circle shown without JavaScript', v(mutate('info-circle', 'circle hidden', src, /(class="inc__circle") hidden/, '$1')));
  mustFail('info-circle', 'the centre not a live region', v(mutate('info-circle', 'live', src, 'aria-live="polite"', '')));
  mustFail('info-circle', 'an item moved off the ring', v(mutate('info-circle', 'moved', src, '--inc-x:50%;--inc-y:0%', '--inc-x:50%;--inc-y:3%')));
  mustFail('info-circle', "a list entry's text dropped", v(mutate('info-circle', 'text', src, `>${icFixture.process.items[2].text}</p>`, '></p>')));
  mustFail('info-circle', 'autoplay without its pause button', v(mutate('info-circle', 'pause', src, /<button type="button" class="inc__play"[\s\S]*?<\/button>/, '')));
  mustFail('info-circle', 'a demo icon that is not Font Awesome Free', validateFa(mutate('info-circle', 'fa', icDemoSrc, /(<path fill="currentColor" d="M)(\d)/, '$19'), 'mutant'));
}
finish('info-circle mutations');
summary.push(`info-circle: ${Object.keys(RING).length} ring sizes, ${icExpected.length} circles on ${icPages.length} pages, ${Object.keys(icFa).length} Font Awesome Free icons, ${icRatios.join(', ')}`);

// ================================================================ slide-box
const sbFile = 'src/library/slide-box/SlideBox.astro';
const sbSrc = read(sbFile);

// 7. Geometry.
const WAITING = { up: 'translateY(100%)', down: 'translateY(-100%)', left: 'translateX(100%)', right: 'translateX(-100%)' };
const checkSlides = (src) => {
  const out = [];
  for (const [dir, want] of Object.entries(WAITING)) {
    const got = src.match(new RegExp(`\\.slb\\[data-direction='${dir}'\\] \\{\\s*--slb-waiting: ([^;]+);`))?.[1];
    if (got !== want) out.push(`slide-box direction "${dir}": the back waits at ${got ?? 'nothing'}, expected ${want}.`);
  }
  if (!/\.slb\[data-ready\] \.slb__back \{\s*transform: var\(--slb-waiting\);/.test(src)) out.push('slide-box: the back does not wait at --slb-waiting once the script runs.');
  if (!/\.slb\[data-ready\]\[data-open\] \.slb__back \{\s*transform: none;/.test(src)) out.push('slide-box: an open card does not bring the back to transform: none.');
  if (!/\.slb\[data-ready\] \.slb__card \{[^}]*overflow: hidden;/.test(src)) out.push('slide-box: the card must clip (overflow: hidden) so the waiting back is out of view.');
  return out;
};
checkSlides(sbSrc).forEach(fail);
finish('slide-box geometry');

const sbDemoSrc = read('src/components/demos/SlideBoxDemo.astro');
const sbFa = Object.fromEntries([...sbDemoSrc.matchAll(/'([a-z0-9-]+)': `(<svg[\s\S]*?<\/svg>)`/g)].map((m) => [m[1], faPath(m[2])]));
validateFa(sbDemoSrc, 'SlideBoxDemo.astro').forEach(fail);
finish('slide-box icons');

// 8. The built page.
const sbExpected = JSON.parse(read('public/demo/slide-box-cards.json')).cards;
for (const c of sbExpected) {
  if (c.image && !existsSync(join(root, 'public/demo', c.image))) fail(`slide-box fixture: "${c.title}" names image ${c.image}, not in public/demo/.`);
  if (c.icon && !sbFa[c.icon]) fail(`slide-box fixture: "${c.title}" names icon ${c.icon}, which the demo's \`fa\` map lacks.`);
}
const validateSlideBox = (html, expected, where) => {
  const out = [];
  const bad = (m) => out.push(`${where}: ${m}`);
  const cards = all(html, /<div\b[^>]*\sdata-slb(?=[\s>])/);
  if (cards.length !== expected.length) bad(`expected ${expected.length} slide boxes, found ${cards.length}.`);
  cards.forEach((card, i) => {
    const e = expected[i];
    if (!e) return;
    const at = `card ${i + 1} ("${e.title}")`;
    const top = openTag(card);
    if (/\sdata-(ready|open|armed)\b/.test(top)) bad(`${at}: the static root carries a runtime state attribute.`);
    if (attr(top, 'data-direction') !== e.direction) bad(`${at}: data-direction is ${attr(top, 'data-direction')}, the fixture says ${e.direction}.`);
    if (attr(top, 'data-trigger') !== (e.trigger ?? 'both')) bad(`${at}: data-trigger is ${attr(top, 'data-trigger')}, the fixture says ${e.trigger ?? 'both'}.`);

    const control = all(card, /<button\b[^>]*\sdata-slb-control/)[0];
    if (!control) return bad(`${at}: no <button data-slb-control>.`);
    const ct = openTag(control);
    if (attr(ct, 'type') !== 'button') bad(`${at}: the control needs type="button".`);
    if (attr(ct, 'aria-expanded') !== 'false') bad(`${at}: the control needs aria-expanded="false" in the static HTML.`);
    if (attr(ct, 'hidden') === undefined) bad(`${at}: the control must render hidden, or a visitor without JavaScript meets a button that does nothing.`);
    if (text(control) !== e.title) bad(`${at}: the control is named "${text(control)}", expected "${e.title}".`);

    const front = all(card, /<div\b[^>]*\sdata-slb-front(?=[\s>])/)[0];
    const back = all(card, /<div\b[^>]*\sdata-slb-back(?=[\s>])/)[0];
    if (!front || !back) return bad(`${at}: missing a panel.`);
    if (card.indexOf(back) < card.indexOf(front)) bad(`${at}: the back comes before the front; without JavaScript they stack in source order.`);
    if (attr(ct, 'aria-controls') !== attr(openTag(back), 'id')) bad(`${at}: aria-controls does not name the back.`);
    for (const [name, panel] of [['front', front], ['back', back]]) {
      const tag = openTag(panel);
      if (attr(tag, 'inert') !== undefined || attr(tag, 'aria-hidden') !== undefined) bad(`${at}: the ${name} is inert or aria-hidden in the static HTML; without JavaScript it must be readable.`);
    }
    const ft = text(front);
    const bt = text(back);
    if (!ft.includes(e.title) || !ft.includes(e.text)) bad(`${at}: the front lacks its title or text.`);
    if (/<a\b[^>]*\shref=/.test(front)) bad(`${at}: a link on the front; the whole front is the button, so it cannot be clicked.`);
    if (e.icon && faPath(front) !== sbFa[e.icon]) bad(`${at}: the front's icon is not Font Awesome Free "${e.icon}".`);
    if (e.image) {
      const img = front.match(/<img\b[^>]*>/)?.[0];
      if (!img || !attr(img, 'src')?.endsWith(e.image) || attr(img, 'alt') !== e.imageAlt) bad(`${at}: the front lacks its image with alt "${e.imageAlt}".`);
    }
    if (!bt.includes(e.title) || !bt.includes(e.backText)) bad(`${at}: the back lacks its title or text.`);
    const link = [...back.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].find((l) => text(l[2]) === e.cta.text);
    if (!link) bad(`${at}: the back has no link "${e.cta.text}".`);
    else if (attr(`<a${link[1]}>`, 'href') !== e.cta.href) bad(`${at}: the back link points at ${attr(`<a${link[1]}>`, 'href')}.`);
  });
  const defs = (html.match(/window\.__superheroSlideBox \|\|=/g) || []).length;
  const calls = (html.match(/window\.__superheroSlideBox && window\.__superheroSlideBox\(\);/g) || []).length;
  if (defs !== 1) bad(`the slide-box script is on the page ${defs} times; it must be once.`);
  if (calls !== Math.max(0, cards.length - 1)) bad(`expected ${cards.length - 1} one-line boot calls for later cards, found ${calls}.`);
  return out;
};
const sbPages = pages('slide-box');
const sbHtml = {};
for (const rel of sbPages) {
  sbHtml[rel] = readFileSync(join(root, rel), 'utf8');
  validateSlideBox(sbHtml[rel], sbExpected, rel).forEach(fail);
}
finish('slide-box page');

// 9. Colours.
const sbRatios = [];
for (const [label, fg, bg] of [
  ['front text', '--slb-front-fg', '--slb-front-bg'],
  ['back text', '--slb-back-fg', '--slb-accent'],
  ['back link', '--slb-accent', '--slb-cta-bg'],
]) {
  const a = fallback(sbSrc, fg);
  const b = fallback(sbSrc, bg);
  if (!a || !b) {
    fail(`${sbFile}: no literal fallback for ${fg} or ${bg} to measure.`);
    continue;
  }
  const r = contrast(a, b);
  sbRatios.push(`${label} ${r.toFixed(2)}:1`);
  if (r < 4.5) fail(`slide-box ${label}: ${a} on ${b} is ${r.toFixed(2)}:1, under 4.5:1.`);
}
finish('slide-box colours');

// Mutations.
{
  const src = sbHtml[sbPages[0]];
  const v = (html) => validateSlideBox(html, sbExpected, 'mutant');
  mustFail('slide-box', '"up" parks the back above instead of below', checkSlides(mutate('slide-box', 'up', sbSrc, "--slb-waiting: translateY(100%);", '--slb-waiting: translateY(-100%);')));
  mustFail('slide-box', 'the card no longer clips', checkSlides(mutate('slide-box', 'clip', sbSrc, /(\.slb\[data-ready\] \.slb__card \{[^}]*)overflow: hidden;/, '$1')));
  mustFail('slide-box', 'the control without aria-expanded', v(mutate('slide-box', 'expanded', src, ' aria-expanded="false"', '')));
  mustFail('slide-box', 'the control shown without JavaScript', v(mutate('slide-box', 'hidden', src, /(<button type="button" class="slb__control"[^>]*?) hidden/, '$1')));
  mustFail('slide-box', 'the back inert without JavaScript', v(mutate('slide-box', 'inert', src, /(<div class="slb__panel slb__back")/, '$1 inert')));
  mustFail('slide-box', 'a link on the front', v(mutate('slide-box', 'front link', src, /(<p class="slb__text"[^>]*>)/, '$1<a href="/x/">x</a>')));
  mustFail('slide-box', 'a card that slides from the wrong side', v(mutate('slide-box', 'direction', src, 'data-direction="left"', 'data-direction="right"')));
  mustFail('slide-box', 'a demo icon that is not Font Awesome Free', validateFa(mutate('slide-box', 'fa', sbDemoSrc, "'mug-hot'", "'mug-saucer'"), 'mutant'));
}
finish('slide-box mutations');
summary.push(`slide-box: 4 directions, ${sbExpected.length} cards on ${sbPages.length} pages, ${Object.keys(sbFa).length} Font Awesome Free icons, ${sbRatios.join(', ')}`);

console.log(`check-reveal-cards ok: ${summary.join('; ')}; ${mutations.length} mutations refused.`);
