#!/usr/bin/env node
/**
 * npm run check — pins the one category every element is listed under. superherotech.ai's
 * /elements/ hub sections and its mega-menu columns are built from `category` and `CATEGORIES`
 * in src/data/catalog.ts, and the `superhero-ui-library` skill mirrors them, so a change here is
 * a change in three places and must be deliberate.
 *
 * - CATEGORIES: exactly the seven ids below, in this order (display order), with these labels;
 *   every blurb one non-empty sentence that does not say "component". The `CategoryId` type in
 *   the source lists the same ids in the same order (Node strips types, so it is read as text).
 * - Every element has a `category`, and it is one of CATEGORIES.
 * - Every category has at least 3 elements.
 * - The full id -> category assignment equals GOLDEN. A new element fails here until it is
 *   placed in GOLDEN, which is the point: someone has to choose its category.
 *
 * Mutation tests: the rules run again on deliberately broken copies (see `mutants`); every
 * mutant must be caught, or the check itself is broken.
 *
 * Exits 1 with one line per failure.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src/data/catalog.ts');
const { catalog, CATEGORIES } = await import(pathToFileURL(catalogPath).href);

/** Display order and labels, as agreed in the hub redesign. */
const ORDER = [
  ['motion', 'Hero & motion'],
  ['navigation', 'Navigation & layout'],
  ['content', 'Content blocks'],
  ['media', 'Media & showcase'],
  ['conversion', 'Offers & conversion'],
  ['feedback', 'Feedback & states'],
  ['controls', 'Controls & details'],
];

/** Every element's category. Add a new element here, in the category you chose for it. */
const GOLDEN = {
  'particle-field': 'motion',
  'video-background': 'motion',
  'parallax-band': 'motion',
  'scroll-reveal': 'motion',
  'animated-background': 'motion',
  'animated-text': 'motion',

  'mega-menu': 'navigation',
  'off-canvas': 'navigation',
  tabs: 'navigation',
  tabcordion: 'navigation',
  accordion: 'navigation',
  scrollbox: 'navigation',

  'info-list': 'content',
  'flip-box': 'content',
  'slide-box': 'content',
  hotspot: 'content',
  'info-circle': 'content',
  'business-hours': 'content',
  map: 'content',
  'responsive-table': 'content',

  'before-after': 'media',
  'video-player': 'media',
  'video-gallery': 'media',
  'social-grid': 'media',
  'card-slider': 'media',
  'testimonial-carousel': 'media',
  icon: 'media',

  countdown: 'conversion',
  'announcement-bar': 'conversion',
  modal: 'conversion',
  'content-toggle': 'conversion',
  'news-ticker': 'conversion',
  sticker: 'conversion',
  cart: 'conversion',
  'product-list': 'conversion',
  'product-page': 'conversion',

  notice: 'feedback',
  toast: 'feedback',
  loading: 'feedback',
  tooltip: 'feedback',
  stepper: 'feedback',

  'radio-group': 'controls',
  'menu-button': 'controls',
  tags: 'controls',
  'link-effects': 'controls',
  'cookie-consent': 'controls',
};

const MIN_PER_CATEGORY = 3;

/** The rules, as a pure function so the mutants can run them. Returns one sentence per failure. */
function categoryFailures(elements, categories, typeIds) {
  const out = [];
  const fail = (m) => out.push(m);

  // CATEGORIES: order, labels, blurbs.
  if (!Array.isArray(categories)) {
    fail('src/data/catalog.ts does not export a `CATEGORIES` array.');
    return out;
  }
  const gotOrder = categories.map((c) => c?.id).join(', ');
  const wantOrder = ORDER.map(([id]) => id).join(', ');
  if (gotOrder !== wantOrder) fail(`CATEGORIES is in the order [${gotOrder}]; the hub and the mega-menu expect [${wantOrder}].`);
  for (const [id, label] of ORDER) {
    const c = categories.find((x) => x?.id === id);
    if (!c) continue; // reported by the order rule
    if (c.label !== label) fail(`Category "${id}" is labelled "${c.label}"; the agreed label is "${label}".`);
    const blurb = typeof c.blurb === 'string' ? c.blurb.trim() : '';
    if (!blurb) fail(`Category "${id}" has no blurb, the sentence shown under its heading.`);
    else {
      if (!/[.!?]$/.test(blurb) || /[.!?]\s+[A-Z]/.test(blurb)) fail(`Category "${id}" has a blurb that is not one sentence.`);
      if (/\bcomponents?\b/i.test(blurb)) fail(`Category "${id}" says "component" in its blurb; write what a visitor gets.`);
    }
  }
  if (typeIds !== undefined && typeIds.join(', ') !== wantOrder) {
    fail(`The CategoryId type lists [${typeIds.join(', ')}]; it must list [${wantOrder}], the same ids in the same order as CATEGORIES.`);
  }

  // Every element has a known category; tally per category.
  const known = new Set(categories.map((c) => c?.id));
  const counts = new Map(ORDER.map(([id]) => [id, 0]));
  for (const [i, e] of elements.entries()) {
    const name = e?.id ? `"${e.id}"` : `entry #${i + 1}`;
    if (e.category === undefined || e.category === null || e.category === '') {
      fail(`Element ${name} has no \`category\`; every element is listed under exactly one.`);
      continue;
    }
    if (!known.has(e.category)) {
      fail(`Element ${name} has category "${e.category}", which is not in CATEGORIES.`);
      continue;
    }
    counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  }
  for (const [id, n] of counts) {
    if (known.has(id) && n < MIN_PER_CATEGORY) {
      fail(`Category "${id}" has ${n} element${n === 1 ? '' : 's'}; a category needs at least ${MIN_PER_CATEGORY} to earn its section and menu column.`);
    }
  }

  // The golden assignment, both ways.
  const seen = new Set();
  for (const e of elements) {
    if (!e?.id) continue;
    seen.add(e.id);
    if (!(e.id in GOLDEN)) {
      fail(`Element "${e.id}" is not in GOLDEN in scripts/check-categories.mjs; choose its category and add it there.`);
    } else if (e.category !== undefined && e.category !== GOLDEN[e.id]) {
      fail(`Element "${e.id}" has category "${e.category}"; GOLDEN places it in "${GOLDEN[e.id]}". Move it in both places, deliberately.`);
    }
  }
  for (const id of Object.keys(GOLDEN)) {
    if (!seen.has(id)) fail(`GOLDEN places "${id}", which is not in the catalogue; remove it from scripts/check-categories.mjs.`);
  }
  return out;
}

/** The CategoryId union, read from the source (Node strips types before import). */
function typeIdsFrom(src) {
  const m = src.match(/export type CategoryId\s*=\s*([^;]+);/);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
}

const typeIds = typeIdsFrom(readFileSync(catalogPath, 'utf8'));
const failures = categoryFailures(catalog, CATEGORIES, typeIds);
if (failures.length) {
  console.error('check-categories failed (catalogue):');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

// ---------------------------------------------------------------- mutation tests
const clone = () => catalog.map((e) => ({ ...e }));
const cats = () => CATEGORIES.map((c) => ({ ...c }));
const at = (list, id) => list.find((e) => e.id === id);
const mutants = [
  {
    name: 'one element with an unknown category',
    expect: /"tabs" has category "widgets", which is not in CATEGORIES/,
    run: () => { const c = clone(); at(c, 'tabs').category = 'widgets'; return categoryFailures(c, CATEGORIES, typeIds); },
  },
  {
    name: 'one element with no category',
    expect: /"toast" has no `category`/,
    run: () => { const c = clone(); delete at(c, 'toast').category; return categoryFailures(c, CATEGORIES, typeIds); },
  },
  {
    name: 'one element moved to another real category',
    expect: /"map" has category "media"; GOLDEN places it in "content"/,
    run: () => { const c = clone(); at(c, 'map').category = 'media'; return categoryFailures(c, CATEGORIES, typeIds); },
  },
  {
    name: 'a new element nobody placed',
    expect: /"brand-new" is not in GOLDEN/,
    run: () => categoryFailures([...clone(), { id: 'brand-new', category: 'content' }], CATEGORIES, typeIds),
  },
  {
    name: 'a category left with two elements',
    expect: /Category "feedback" has 2 elements/,
    run: () => categoryFailures(clone().filter((e) => !['notice', 'toast', 'loading'].includes(e.id)), CATEGORIES, typeIds),
  },
  {
    name: 'two categories swapped in order',
    expect: /CATEGORIES is in the order \[navigation, motion/,
    run: () => { const c = cats(); [c[0], c[1]] = [c[1], c[0]]; return categoryFailures(catalog, c, typeIds); },
  },
  {
    name: 'a relabelled category',
    expect: /"media" is labelled "Gallery"/,
    run: () => { const c = cats(); at(c, 'media').label = 'Gallery'; return categoryFailures(catalog, c, typeIds); },
  },
  {
    name: 'a blurb that says component',
    expect: /"controls" says "component"/,
    run: () => { const c = cats(); at(c, 'controls').blurb = 'Every small component you need.'; return categoryFailures(catalog, c, typeIds); },
  },
  {
    name: 'a CategoryId type that drifted from CATEGORIES',
    expect: /The CategoryId type lists/,
    run: () => categoryFailures(catalog, CATEGORIES, typeIdsFrom("export type CategoryId = 'motion' | 'navigation';")),
  },
];
const missed = [];
for (const m of mutants) {
  const got = m.run();
  if (!got.some((f) => m.expect.test(f))) missed.push(`mutant "${m.name}" was not caught${got.length ? ` (got: ${got[0]})` : ''}.`);
}
if (missed.length) {
  console.error('check-categories failed (mutation tests):');
  for (const f of missed) console.error(`  - ${f}`);
  process.exit(1);
}

const summary = ORDER.map(([id]) => `${id} ${catalog.filter((e) => e.category === id).length}`).join(', ');
console.log(`check-categories ok: ${catalog.length} elements in ${ORDER.length} categories (${summary}); ${mutants.length} mutants caught.`);
