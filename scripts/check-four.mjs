#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the static render of
 * the four elements added together: accordion, card-slider, tabs and info-list. Each reads its
 * built demo page, which is exactly what a visitor without JavaScript gets.
 *
 * accordion    every answer is in the DOM; FAQPage JSON-LD only on the instance that asked
 *              for it, right after it, and its questions (and answers) equal what is rendered.
 * card-slider  a pause button exactly when autoplay is on; the track is a labelled carousel
 *              region; arrows and dots are hidden until the script runs.
 * tabs         no-JS: the tab strip is hidden, every panel is visible, each with its label as
 *              a heading, one panel per tab.
 * info-list    <ol> when connector or numbers, <ul> otherwise; one link per linked item and
 *              none in the others.
 *
 * A check runs when its element is in the catalogue. Exits 1 with one line per failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);

// Node strips the catalogue's types (check-catalog.mjs is run the same way).
let ids;
try {
  const { catalog } = await import(pathToFileURL(join(root, 'src/data/catalog.ts')).href);
  ids = new Set(catalog.map((e) => e.id));
} catch {
  // Without type stripping, read the ids as text.
  ids = new Set([...readFileSync(join(root, 'src/data/catalog.ts'), 'utf8').matchAll(/^\s{4}id: '([a-z0-9-]+)'/gm)].map((m) => m[1]));
}

const page = (id) => {
  const file = join(root, 'dist', id, 'index.html');
  if (!existsSync(file)) {
    fail(`${id}: ${file} is missing; run astro build (check-catalog.mjs does) first.`);
    return '';
  }
  return readFileSync(file, 'utf8');
};
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

// ------------------------------------------------------------------ accordion
if (ids.has('accordion')) {
  const html = page('accordion');
  const acs = roots(html, 'div', 'data-ac');
  if (acs.length < 2) fail(`accordion: the demo should render two accordions (the FAQ and the services); found ${acs.length}.`);
  const withLd = acs.filter((a) => /\sdata-ac-jsonld[\s>=]/.test(a.open));
  if (withLd.length !== 1 || acs.length - withLd.length < 1) fail('accordion: the demo needs one accordion with jsonLd and at least one without.');
  for (const [n, a] of acs.entries()) {
    const items = [...a.html.matchAll(/<details\b[^>]*>/g)].map((m) => block(a.html, m.index, 'details'));
    if (!items.length) fail(`accordion #${n + 1}: no <details> items.`);
    for (const it of items) {
      const title = text(it.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? '');
      const body = it.match(/<div class="ac__body[^"]*"[^>]*>([\s\S]*)<\/div>\s*<\/details>$/)?.[1] ?? '';
      if (!/<h[2-4]\b[^>]*class="ac__title/.test(it)) fail(`accordion: "${title}" has no h2–h4 title inside its summary.`);
      if (!text(body)) fail(`accordion: the answer to "${title}" is not in the static HTML; every answer must be in the DOM even when closed.`);
      if (!/\sid="[^"]+"/.test(it.slice(0, it.indexOf('>')))) fail(`accordion: "${title}" has no id to deep-link to.`);
    }
  }
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => ({ index: m.index, data: JSON.parse(m[1]) }))
    .filter((l) => l.data['@type'] === 'FAQPage');
  if (lds.length !== withLd.length) fail(`accordion: ${lds.length} FAQPage JSON-LD blocks for ${withLd.length} accordion(s) that asked for one; it must be emitted only when asked.`);
  for (const a of withLd) {
    const ld = lds.find((l) => l.index >= a.index + a.html.length && !/<(div|details|section)\b/.test(html.slice(a.index + a.html.length, l.index)));
    if (!ld) {
      fail('accordion: the FAQPage JSON-LD does not follow the accordion that asked for it.');
      continue;
    }
    const items = [...a.html.matchAll(/<details\b[^>]*>/g)].map((m) => block(a.html, m.index, 'details'));
    const rendered = items.map((it) => text(it.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/)[1]));
    const questions = (ld.data.mainEntity ?? []).map((q) => q.name);
    if (JSON.stringify(rendered) !== JSON.stringify(questions)) {
      fail(`accordion: the JSON-LD questions ${JSON.stringify(questions)} differ from the rendered summaries ${JSON.stringify(rendered)}.`);
    }
    const bodies = items.map((it) => it.match(/<div class="ac__body[^"]*"[^>]*>([\s\S]*)<\/div>\s*<\/details>$/)[1].trim());
    (ld.data.mainEntity ?? []).forEach((q, i) => {
      if (q['@type'] !== 'Question' || q.acceptedAnswer?.['@type'] !== 'Answer') fail(`accordion: JSON-LD entry ${i + 1} is not a Question with an Answer.`);
      if (text(q.acceptedAnswer?.text ?? '') !== text(bodies[i] ?? '')) fail(`accordion: the JSON-LD answer to "${q.name}" differs from the rendered answer.`);
    });
  }
}

// ------------------------------------------------------------------ card-slider
if (ids.has('card-slider')) {
  const html = page('card-slider');
  const sliders = roots(html, 'div', 'data-cs');
  const on = sliders.filter((s) => /\sdata-autoplay[\s>=]/.test(s.open));
  if (!on.length || on.length === sliders.length) fail('card-slider: the demo needs one slider with autoplay and one without.');
  for (const [n, s] of sliders.entries()) {
    const auto = /\sdata-autoplay[\s>=]/.test(s.open);
    const buttons = (s.html.match(/\sdata-cs-play[\s>=]/g) ?? []).length;
    if (auto && buttons !== 1) fail(`card-slider #${n + 1}: autoplay is on but it has ${buttons} pause buttons; it needs exactly one (WCAG 2.2.2).`);
    if (!auto && buttons) fail(`card-slider #${n + 1}: autoplay is off but it renders a pause button.`);
    const track = s.html.match(/<div class="cs__track[^"]*"[^>]*>/)?.[0] ?? '';
    if (!/role="region"/.test(track) || !/aria-roledescription="carousel"/.test(track) || !/aria-label="[^"]+"/.test(track)) {
      fail(`card-slider #${n + 1}: the track must be a region with aria-roledescription="carousel" and a label.`);
    }
    if (!/tabindex="0"/.test(track)) fail(`card-slider #${n + 1}: the track must be focusable so the keyboard can scroll it.`);
    const controls = s.html.match(/<div class="cs__controls[^"]*"[^>]*>/)?.[0];
    if (controls && !/\shidden[\s>=]/.test(controls)) fail(`card-slider #${n + 1}: arrows and dots must be hidden until the script runs (no-JS shows the scrollbar instead).`);
    if (/aria-live/.test(s.html)) fail(`card-slider #${n + 1}: no aria-live; the slider announces nothing on its own.`);
  }
}

// ------------------------------------------------------------------ tabs
if (ids.has('tabs')) {
  const html = page('tabs');
  const sets = roots(html, 'div', 'data-tb');
  if (!sets.length) fail('tabs: the demo renders no tabs.');
  for (const [n, t] of sets.entries()) {
    const list = t.html.match(/<div class="tb__list[^"]*"[^>]*>/)?.[0] ?? '';
    if (!/role="tablist"/.test(list) || !/\shidden[\s>=]/.test(list)) fail(`tabs #${n + 1}: the tablist must be in the HTML and hidden until the script runs.`);
    const labels = [...t.html.matchAll(/<button\b[^>]*role="tab"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => text(m[1]));
    const panels = [...t.html.matchAll(/<section\b[^>]*class="tb__panel[^"]*"[^>]*>/g)].map((m) => ({ open: m[0], html: block(t.html, m.index, 'section') }));
    if (!labels.length || labels.length !== panels.length) fail(`tabs #${n + 1}: ${labels.length} tabs but ${panels.length} panels; one panel per tab.`);
    panels.forEach((p, i) => {
      if (/\shidden[\s>=]/.test(p.open)) fail(`tabs #${n + 1}: panel ${i + 1} is hidden in the static HTML; without JavaScript every panel shows.`);
      const heading = p.html.match(/<(h[2-4])\b[^>]*class="tb__heading[^"]*"[^>]*>([\s\S]*?)<\/\1>/);
      if (!heading) fail(`tabs #${n + 1}: panel ${i + 1} has no h2–h4 heading.`);
      else if (text(heading[2]) !== labels[i]) fail(`tabs #${n + 1}: panel ${i + 1}'s heading "${text(heading[2])}" is not its tab's label "${labels[i]}".`);
      const body = p.html.match(/<div class="tb__body[^"]*"[^>]*>([\s\S]*)<\/div>\s*<\/section>$/)?.[1] ?? '';
      if (!text(body)) fail(`tabs #${n + 1}: panel ${i + 1} is empty in the static HTML.`);
    });
  }
}

// ------------------------------------------------------------------ info-list
if (ids.has('info-list')) {
  const html = page('info-list');
  const lists = [...html.matchAll(/<(ol|ul)\b[^>]*class="il\b([^"]*)"[^>]*>/g)].map((m) => ({ tag: m[1], cls: m[2], open: m[0], html: block(html, m.index, m[1]) }));
  if (!lists.some((l) => l.tag === 'ol') || !lists.some((l) => l.tag === 'ul')) fail('info-list: the demo needs both an ordered and an unordered list.');
  let linked = 0;
  for (const [n, l] of lists.entries()) {
    const ordered = /\bil--connector\b/.test(l.cls) || /\bil--number\b/.test(l.cls);
    if ((l.tag === 'ol') !== ordered) fail(`info-list #${n + 1}: rendered <${l.tag}> with classes "${l.cls.trim()}"; connector or numbers mean <ol>, otherwise <ul>.`);
    if (!/role="list"/.test(l.open)) fail(`info-list #${n + 1}: needs role="list" (Safari drops list semantics with list-style: none).`);
    for (const m of l.html.matchAll(/<li\b[^>]*>/g)) {
      const li = block(l.html, m.index, 'li');
      const links = (li.match(/<a\b/g) ?? []).length;
      const isLinked = /il__item--link/.test(m[0]);
      if (isLinked) linked++;
      if (links !== (isLinked ? 1 : 0)) fail(`info-list #${n + 1}: an item has ${links} links; a linked item has exactly one (its title), others none.`);
      if (isLinked && !/<h[2-5]\b[^>]*class="il__title[^"]*"[^>]*>\s*<a\b/.test(li)) fail(`info-list #${n + 1}: a linked item's one link must be inside its title heading.`);
      if (/il--number/.test(l.cls) && !text(li.match(/<span class="il__marker[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '')) fail(`info-list #${n + 1}: a number marker must be real text.`);
    }
    if (/<script\b/.test(l.html)) fail(`info-list #${n + 1}: an info list has no script.`);
  }
  if (!linked) fail('info-list: the demo should have at least one linked item.');
}

if (failures.length) {
  console.error('check-four failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`check-four ok: ${['accordion', 'card-slider', 'tabs', 'info-list'].filter((i) => ids.has(i)).join(', ')}.`);
