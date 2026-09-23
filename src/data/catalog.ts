/**
 * The catalogue. One entry per element; `id` is the name everyone uses for it — in a
 * brief, in a ticket, in a client's email ("the before-after thing on the home page").
 * `aka` holds every other name we have heard, so a search for the WordPress term lands
 * here. Keep entries in the order they were added.
 */
export interface Prop {
  name: string;
  type: string;
  default?: string;
  note: string;
}
export interface ThemeVar {
  name: string;
  fallback: string;
  note: string;
}
/**
 * The one search the element's page on superherotech.ai/elements/<id>/ targets. The page's
 * title and h1 are composed from `query`. Two of our pages in one auction is how both lose, so
 * `npm run check` refuses a query another entry already claims, as its query or in `alsoRanks`.
 */
export interface Search {
  /** The query the page is written for (SE Ranking, US). */
  query: string;
  /** Close variants the same page should rank for without targeting them. */
  alsoRanks?: string[];
}
export interface Element {
  id: string;
  name: string;
  aka: string[];
  /** The gallery's technical line: what it is and how it behaves. */
  summary: string;
  /** One sentence in the client's words, for the lead of the marketing page. */
  pitch: string;
  search: Search;
  /** What it stands in for on a WordPress / page-builder site. */
  replaces: string[];
  goodFor: string;
  notFor: string;
  props: Prop[];
  theming: ThemeVar[];
  a11y: string[];
  usage: string;
  usedOn: { site: string; where: string }[];
  /** Path of the component in this repo — the file to copy into a client build. */
  file: string;
  added: string;
}

export const catalog: Element[] = [
  {
    id: 'before-after',
    name: 'Before / After',
    aka: ['TwentyTwenty', 'image comparison slider', 'compare slider', 'UABB Before After', 'reveal slider'],
    summary: 'Two images in one frame. Drag the handle, or use the arrow keys, to reveal one over the other.',
    pitch: 'Show the old and the new in one frame, and let visitors drag to compare.',
    // 170/mo, difficulty 10; variants 140/29 and 110/10 (SE Ranking US, 2026-09-23).
    search: { query: 'before after slider', alsoRanks: ['image comparison slider', 'before and after image slider'] },
    replaces: ['UABB "Before After" module (Beaver Builder)', 'TwentyTwenty jQuery plugin', 'most "image compare" WordPress plugins'],
    goodFor: 'Problem-and-solution illustrations, renovations, retouching, redesigns: anything where the two states share a frame.',
    notFor: 'Two unrelated images. If they do not line up, use a two-column layout instead.',
    props: [
      { name: 'before', type: 'string', note: 'URL of the image that is revealed from the left.' },
      { name: 'after', type: 'string', note: 'URL of the image underneath.' },
      { name: 'beforeAlt', type: 'string', note: 'Describe what the before image shows. Required.' },
      { name: 'afterAlt', type: 'string', note: 'Describe what the after image shows, including any caption baked into it. Required.' },
      { name: 'width', type: 'number', note: 'Intrinsic width shared by both images.' },
      { name: 'height', type: 'number', note: 'Intrinsic height shared by both images.' },
      { name: 'label', type: 'string', default: '“Reveal the second image”', note: 'Accessible name of the slider control.' },
    ],
    theming: [
      { name: '--ba-handle', fallback: '#fff', note: 'Handle line and ring.' },
      { name: '--ba-handle-bg', fallback: 'rgb(0 0 0 / 0.35)', note: 'Fill behind the ‹ › glyph.' },
      { name: '--ba-focus', fallback: 'currentColor', note: 'Keyboard focus ring around the frame.' },
    ],
    a11y: [
      'The control is a native range input: arrow keys move the split, screen readers announce it as a slider with the given label.',
      'Both images carry real alt text; the before image is not decorative.',
      'No motion, so nothing to reduce.',
    ],
    usage: `<BeforeAfter
  before="/images/before.webp"
  after="/images/after.webp"
  beforeAlt="A desk buried in paper"
  afterAlt="The same desk cleared, captioned “Contexture is the Solution”"
  width={1920}
  height={1357}
  label="Compare the desk before and after"
/>`,
    usedOn: [{ site: 'contexture.ai', where: 'Home, “The Contexture Difference” section' }],
    file: 'src/library/before-after/BeforeAfter.astro',
    added: '2026-09-22',
  },
  {
    id: 'particle-field',
    name: 'Particle field',
    aka: ['particles.js', 'animated particle background', 'constellation background', 'network dots', 'Smart Slider particle effect', 'UABB Particle Background', 'animated material background'],
    summary: 'Slow-drifting dots that join up with fine lines when they come near each other, drawn on a canvas behind a hero or band.',
    pitch: 'Give your hero quiet, constant movement, like a network coming alive, without the weight of a video.',
    // 590/mo, difficulty 18; variants 390/15 and 260/23 (SE Ranking US, 2026-09-23).
    search: { query: 'particles js', alsoRanks: ['constellation background', 'animated background for website'] },
    replaces: ['Smart Slider 3 Pro “Particle” slider effect', 'UABB “Particle Background” row setting (Beaver Builder)', 'particles.js / tsParticles embeds'],
    goodFor: 'Technology, data and network brands; a hero that needs quiet movement without a video.',
    notFor: 'Sitting under body text, or on pages that already have a moving hero. One per page.',
    props: [
      { name: 'count', type: 'number', default: '44', note: 'Dots per `area`, as in particles.js. A 1200×500 hero at the defaults gets about 33.' },
      { name: 'area', type: 'number', default: '800', note: 'The density reference area (particles.js value_area).' },
      { name: 'size', type: 'number', default: '3', note: 'Maximum dot radius in px; each dot is a random size up to this.' },
      { name: 'opacity', type: 'number', default: '0.48', note: 'Dot opacity.' },
      { name: 'linkDistance', type: 'number', default: '150', note: 'Dots closer than this (px) are joined. 0 turns lines off.' },
      { name: 'linkOpacity', type: 'number', default: '0.48', note: 'Line opacity at zero distance; fades to nothing at linkDistance.' },
      { name: 'linkWidth', type: 'number', default: '1', note: 'Line width in px.' },
      { name: 'speed', type: 'number', default: '2', note: 'Drift speed, particles.js units.' },
      { name: 'minWidth', type: 'number', default: '700', note: 'Draw nothing below this viewport width. 0 draws everywhere. Tracked live, not decided once.' },
      { name: 'class', type: 'string', note: 'Class for the host to position and stack it with.' },
    ],
    theming: [{ name: '--pf-color', fallback: '#fff', note: 'Dot and line colour. Also settable as plain `color` on the canvas.' }],
    a11y: [
      'Decorative: aria-hidden, no pointer events.',
      'prefers-reduced-motion: one still frame is drawn, so the look survives without the movement.',
      'Pauses while off screen and while the tab is hidden.',
    ],
    usage: `<section class="hero">          <!-- position: relative; isolation: isolate -->
  <img class="hero__bg" … />        <!-- z-index: -1 -->
  <ParticleField class="hero__particles" />   <!-- z-index: 1, via :global() if the host scopes styles -->
  <div class="hero__copy">…</div>   <!-- position: relative; z-index: 2 -->
</section>`,
    usedOn: [{ site: 'contexture.ai', where: 'Home hero, one layer over the whole slider' }],
    file: 'src/library/particle-field/ParticleField.astro',
    added: '2026-09-22',
  },
  {
    id: 'mega-menu',
    name: 'Mega menu',
    aka: ['Max Mega Menu', 'UberMenu', 'mega dropdown', 'Elementor mega menu', 'WP Mega Menu', 'mega navigation'],
    summary: 'A header nav where a top item opens a full-width panel of grouped links, with column headings and an optional promo. Click or Enter opens it; on small screens it folds into an accordion behind a Menu button.',
    pitch: 'Put every page a visitor might want one click from the header, grouped the way your customers think about them.',
    // 990/mo, difficulty 35 (SE Ranking US, 2026-09-23).
    search: { query: 'mega menu', alsoRanks: ['mega menu design', 'mega menu examples'] },
    replaces: ['Max Mega Menu', 'UberMenu', 'WP Mega Menu', 'Elementor Pro’s mega menu (Menu widget)', 'Divi and Astra “mega menu” header options'],
    goodFor: 'Sites with more pages than a header row can hold that people still go to directly: product ranges, services by industry, a shop’s categories.',
    notFor: 'Small sites. If a panel would hold three links, use plain header links; a mega menu that is mostly empty space is slower than no menu.',
    props: [
      { name: 'items', type: 'Item[]', note: '`{ label, href, columns?, promo?, overview? }`. An item with `columns` (each `{ heading, links: [{ label, href, note? }] }`) or a `promo` gets a panel; one without is a plain link.' },
      { name: 'items[].promo', type: 'string', note: 'Name of a slot that fills the panel’s promo area: `promo: \'promo-products\'` plus `<div slot="promo-products">…</div>`.' },
      { name: 'items[].overview', type: 'string', default: '“<label> overview”', note: 'Text of the link to the item’s own `href`, first in its panel. The top item is a button once scripted, so this keeps its page reachable.' },
      { name: 'breakpoint', type: 'number', default: '960', note: 'Viewport width (px) below which the menu collapses behind the Menu button and panels become an accordion. Tracked live. 0 never collapses.' },
      { name: 'label', type: 'string', default: '“Main”', note: 'Accessible name of the nav landmark.' },
      { name: 'menuLabel', type: 'string', default: '“Menu”', note: 'Text of the mobile disclosure button.' },
      { name: 'current', type: 'string', note: 'The current page’s href; matching links get `aria-current="page"`.' },
      { name: 'class', type: 'string', note: 'Class on the nav, for the host to theme and place it.' },
    ],
    theming: [
      { name: '--mm-fg', fallback: 'currentColor', note: 'Top bar text.' },
      { name: '--mm-accent', fallback: 'currentColor', note: 'Hover, open and current item; the overview link.' },
      { name: '--mm-panel-bg', fallback: '#fff', note: 'Panel and mobile list background.' },
      { name: '--mm-panel-fg', fallback: '#1b1c22', note: 'Panel text.' },
      { name: '--mm-muted', fallback: '#5d6072', note: 'Column headings and link notes.' },
      { name: '--mm-border', fallback: '#e2e3ea', note: 'Rule along the panel’s top edge.' },
      { name: '--mm-focus', fallback: 'currentColor', note: 'Keyboard focus ring.' },
      { name: '--mm-shadow', fallback: '0 18px 40px rgb(0 0 0 / 0.14)', note: 'Panel shadow.' },
      { name: '--mm-z', fallback: '50', note: 'Stacking level of the panel and mobile list.' },
      { name: '--mm-max', fallback: '72rem', note: 'Width of the panel’s content inside the full-width panel.' },
      { name: '--mm-anchor', fallback: 'relative', note: 'Position of the nav. Set `static` so the panel spans the header (which then needs `position: relative`) instead of the nav.' },
    ],
    a11y: [
      'Click is the contract, not hover: a top item with a panel is a button with `aria-expanded` and `aria-controls`, toggled by click, Enter or Space. Hover opens it after 150 ms as a courtesy, and a click on a hover-opened panel keeps it open.',
      'Escape closes the panel and returns focus to its button; focus leaving the panel closes it; a click outside closes it. One panel is open at a time.',
      '← → move across the top items (↑ ↓ in the mobile list), Home and End jump to the ends, ↓ on a top button opens its panel and moves into it.',
      'Without JavaScript every top item is a plain link and a panel shows on hover or when focus is inside it, so every link is reachable.',
      'Below `breakpoint` the list sits behind a “Menu” disclosure button (`aria-expanded`), and panels become an accordion in the same order.',
      'Column headings label their lists (`aria-labelledby`) rather than adding headings to the page outline. prefers-reduced-motion removes the panel’s fade.',
    ],
    usage: `<header class="site-header">   <!-- position: relative; no overflow: hidden -->
  <a href="/">Logo</a>
  <MegaMenu class="site-nav" current={Astro.url.pathname} items={[
    { label: 'Services', href: '/services/', promo: 'promo-services', columns: [
      { heading: 'Homes', links: [{ label: 'Kitchens', href: '/services/kitchens/', note: 'Design and fit' }] },
      { heading: 'Businesses', links: [{ label: 'Offices', href: '/services/offices/' }] },
    ] },
    { label: 'Pricing', href: '/pricing/' },
  ]}>
    <div slot="promo-services">…</div>
  </MegaMenu>
</header>
<!-- .site-nav { --mm-anchor: static; --mm-accent: var(--blue); } spans the header -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/mega-menu/ (demo)' }],
    file: 'src/library/mega-menu/MegaMenu.astro',
    added: '2026-09-23',
  },
];

export const byId = (id: string) => catalog.find((e) => e.id === id);
