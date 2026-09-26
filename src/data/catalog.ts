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
  /** A licensing note for the element's page, in the client's words. Only elements that draw on
   * licensed third-party material (so far: `icon`, on Font Awesome) carry one. */
  license?: string;
  usedOn: { site: string; where: string }[];
  /** Path of the component in this repo — the file to copy into a client build. */
  /** Where the file is really maintained, when this repo only holds a synced copy. */
  source?: { repo: string; sync: string };
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
      { name: 'current', type: 'string', note: 'The current page’s href; matching links get `aria-current="page"`, and so does the top button of an item whose own `href` matches.' },
      { name: 'slot end', type: 'slot', note: 'Placed after the top items: at the right end of the bar, and at the foot of the list behind the Menu button. For a call to action that must stay reachable on a phone. Arrow keys skip it; Tab reaches it.' },
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
      'The current page is marked on the top item as well as in its panel: once the item is a button, the button carries `aria-current="page"`.',
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
    <a slot="end" href="/quote/" class="button">Get a quote</a>
  </MegaMenu>
</header>
<!-- .site-nav { --mm-anchor: static; --mm-accent: var(--blue); } spans the header -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/mega-menu/ (demo)' }],
    file: 'src/library/mega-menu/MegaMenu.astro',
    added: '2026-09-23',
  },
  {
    id: 'video-background',
    name: 'Video background',
    aka: ['video hero', 'background video', 'Elementor video background', 'autoplay muted loop video', 'Beaver Builder video row', 'hero video'],
    summary: 'A muted, looping video behind a hero, over a poster, with an optional tint and a visible pause button. Only the poster loads on small screens, under reduced motion and without JavaScript.',
    pitch: 'Open your home page with moving footage of your work, without making visitors wait for it or wrestle with it.',
    // 320/mo, difficulty 21 (SE Ranking US, 2026-09-23).
    search: { query: 'video background website', alsoRanks: ['background video website', 'hero video background'] },
    replaces: ['Elementor section “Background type: Video”', 'Beaver Builder row video background', 'Divi video background', 'hand-rolled `<video autoplay muted loop>` embeds'],
    goodFor: 'A hero where the footage is the argument: a venue, a kitchen at work, a site being built. Short, quiet, loopable clips of 10–20 s.',
    notFor: 'Footage with a message, speech or captions (use a real player), or anything a visitor must see: on phones and under reduced motion they get the poster alone.',
    props: [
      { name: 'src', type: '{ src, type }[]', note: 'Sources in order of preference, WebM first then MP4. Keep each under ~2 MB; no audio track.' },
      { name: 'poster', type: 'string', note: 'Still shown before, instead of and under the video. Use the video’s first frame so the swap is invisible.' },
      { name: 'overlay', type: 'number', note: 'Tint strength over the video, 0–1. Overrides `--vb-overlay-opacity` (fallback 0.4).' },
      { name: 'label', type: 'string', default: '“Pause background video”', note: 'Accessible name of the button while the video plays.' },
      { name: 'playLabel', type: 'string', default: '“Play background video”', note: 'Its name while the video is paused.' },
      { name: 'minWidth', type: 'number', default: '768', note: 'Viewport width (px) below which only the poster is shown and no video is downloaded. Tracked live. 0 plays everywhere.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme and size it.' },
    ],
    theming: [
      { name: '--vb-bg', fallback: '#111', note: 'Colour behind the poster while it loads.' },
      { name: '--vb-overlay', fallback: '#000', note: 'Tint colour.' },
      { name: '--vb-overlay-opacity', fallback: '0.4', note: 'Tint strength; the `overlay` prop overrides it.' },
      { name: '--vb-fg', fallback: '#fff', note: 'Content text colour.' },
      { name: '--vb-control-bg', fallback: 'rgb(0 0 0 / 0.55)', note: 'Pause button fill.' },
      { name: '--vb-control-fg', fallback: '#fff', note: 'Pause button icon and ring.' },
      { name: '--vb-focus', fallback: '#fff', note: 'Pause button focus ring.' },
      { name: '--vb-min-height', fallback: '60vh', note: 'Minimum height; content taller than this grows it.' },
      { name: '--vb-position', fallback: 'center', note: 'object-position of the video and poster.' },
    ],
    a11y: [
      'WCAG 2.2.2: a visible pause button (bottom right, 44 px) is shown whenever the video can play. Its name says what it will do, “Pause background video” or “Play background video”.',
      'prefers-reduced-motion (tracked live): poster only, nothing downloaded, no button because nothing moves.',
      'The video is muted, `aria-hidden` and out of the tab order; the slot content is the hero’s real content and carries its meaning.',
      'Pauses while scrolled out of view and while the tab is hidden, and resumes on return unless the visitor paused it. If autoplay is refused, the button offers Play.',
      'Without JavaScript the poster shows and no video is fetched, so there is no unpausable motion.',
    ],
    usage: `<VideoBackground
  class="hero"
  src={[
    { src: '/video/hero.webm', type: 'video/webm' },
    { src: '/video/hero.mp4', type: 'video/mp4' },
  ]}
  poster="/video/hero-poster.webp"
  overlay={0.45}
>
  <h1>Fresh bread, every morning</h1>
  <a class="button" href="/visit/">Visit the bakery</a>
</VideoBackground>
<!-- .hero { --vb-min-height: 80vh; --vb-overlay: var(--navy); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/video-background/ (demo)' }],
    file: 'src/library/video-background/VideoBackground.astro',
    added: '2026-09-23',
  },
  {
    id: 'parallax-band',
    name: 'Parallax band',
    aka: ['parallax section', 'parallax background row', 'Elementor motion effects', 'Beaver Builder parallax row', 'scroll-speed background', 'parallax background'],
    summary: 'A full-width band whose background image scrolls slower than the page, with a tint and content on top. A scroll-driven transform, not background-attachment: fixed, so it works on iOS.',
    pitch: 'Break up a long page with a wide photo that glides behind your words as visitors scroll.',
    // 260/mo, difficulty 28 (SE Ranking US, 2026-09-23).
    search: { query: 'parallax scrolling website', alsoRanks: ['parallax effect website', 'parallax background'] },
    replaces: ['Elementor “Motion effects → Scrolling effects” on a section background', 'Beaver Builder row background “Parallax”', 'Divi “Use parallax effect”', '`background-attachment: fixed` CSS parallax'],
    goodFor: 'A break between sections of a long page: a landscape, a workshop, a skyline behind one line of copy and a button.',
    notFor: 'Images that carry information (it is decorative, with empty alt text), portrait photos (the crop is wide), or more than two or three bands on one page.',
    props: [
      { name: 'image', type: 'string', note: 'Background image URL. Decorative, so it gets empty alt text. Use one at least 1.5× the band’s height at the widest viewport.' },
      { name: 'width', type: 'number', note: 'Intrinsic width of the image.' },
      { name: 'height', type: 'number', note: 'Intrinsic height of the image.' },
      { name: 'speed', type: 'number', default: '0.4', note: 'How much the image lags the page, 0–1: 0 scrolls with the page, 1 holds it still. 0.3–0.5 reads as depth.' },
      { name: 'overlay', type: 'number', note: 'Tint strength, 0–1. Overrides `--pb-overlay-opacity` (fallback 0.35).' },
      { name: 'minHeight', type: 'string', note: 'Minimum band height, any CSS length. Overrides `--pb-height` (fallback 60vh).' },
      { name: 'position', type: 'string', default: '“center”', note: 'object-position of the image, e.g. “center 30%”.' },
      { name: 'loading', type: '“lazy” | “eager”', default: '“lazy”', note: 'Use eager only if the band is in the first screen.' },
      { name: 'class', type: 'string', note: 'Class on the band, for the host to theme it.' },
    ],
    theming: [
      { name: '--pb-bg', fallback: '#222', note: 'Colour behind the image while it loads.' },
      { name: '--pb-overlay', fallback: '#000', note: 'Tint colour.' },
      { name: '--pb-overlay-opacity', fallback: '0.35', note: 'Tint strength; the `overlay` prop overrides it.' },
      { name: '--pb-fg', fallback: '#fff', note: 'Content text colour.' },
      { name: '--pb-height', fallback: '60vh', note: 'Minimum height; the `minHeight` prop overrides it.' },
    ],
    a11y: [
      'prefers-reduced-motion (tracked live): the image is a static cover background and nothing moves with the scroll.',
      'The image is decorative (empty alt); the slot content carries the meaning and sits above a tint for contrast.',
      'Without JavaScript the image is a static background, so the band still looks finished.',
      'Off screen the scroll handler does no work; on screen it does one transform per animation frame.',
    ],
    usage: `<ParallaxBand image="/images/workshop.webp" width={2400} height={1600} speed={0.4} overlay={0.45} minHeight="28rem">
  <h2>Built by hand in Asheville since 1998</h2>
  <a class="button" href="/about/">Our story</a>
</ParallaxBand>
<!-- :root { --pb-overlay: var(--navy); --pb-fg: var(--white); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/parallax-band/ (demo)' }],
    file: 'src/library/parallax-band/ParallaxBand.astro',
    added: '2026-09-23',
  },
  {
    id: 'scroll-reveal',
    name: 'Scroll reveal',
    aka: ['AOS', 'ScrollReveal.js', 'animate on scroll', 'Elementor entrance animations', 'WOW.js', 'fade in on scroll'],
    summary: 'A wrapper that reveals its children as they scroll into view: a fade with a small rise, a slide from a side, or a slight scale, staggered across a list. Content stays visible if the script never runs.',
    pitch: 'Let sections and cards arrive as visitors scroll to them, so a long page feels alive without anything getting in the way.',
    // 170/mo, difficulty 22 (SE Ranking US, 2026-09-23).
    search: { query: 'scroll animation website', alsoRanks: ['scroll reveal animation', 'fade in on scroll'] },
    replaces: ['AOS (Animate On Scroll)', 'ScrollReveal.js', 'WOW.js + animate.css', 'Elementor “Motion effects → Entrance animation”', 'Divi and Beaver Builder entrance animations'],
    goodFor: 'Card grids, feature lists, testimonials and section intros further down a page, where a small arrival draws the eye.',
    notFor: 'The hero or anything in the first screen (it costs Largest Contentful Paint and looks like a slow page), body text inside an article, or every section of a page.',
    props: [
      { name: 'effect', type: '“slide” | “fade” | “scale”', default: '“slide”', note: 'Slide moves `distance` in `direction`; fade is opacity only; scale grows from 94%.' },
      { name: 'direction', type: '“up” | “down” | “left” | “right”', default: '“up”', note: 'For slide, the way it moves: “up” rises into place, “left” slides in moving left.' },
      { name: 'stagger', type: 'number', default: '0', note: 'ms between direct children. 0 reveals the wrapper as one block.' },
      { name: 'once', type: 'boolean', default: 'true', note: '`false` hides it again once it scrolls away below, so it replays.' },
      { name: 'threshold', type: 'number', default: '0.15', note: 'Share of a target that must be on screen to reveal it, 0–1.' },
      { name: 'delay', type: 'number', default: '0', note: 'ms before the first target moves.' },
      { name: 'distance', type: 'string', note: 'How far a slide travels, any CSS length. Overrides `--sr-distance` (fallback 1.5rem).' },
      { name: 'as', type: 'string', default: '“div”', note: 'Tag of the wrapper, e.g. “ul” around list items.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper; make it the grid or flex row and the stagger runs across it.' },
    ],
    theming: [
      { name: '--sr-duration', fallback: '600ms', note: 'Length of each reveal.' },
      { name: '--sr-easing', fallback: 'cubic-bezier(0.2, 0.7, 0.2, 1)', note: 'Timing function.' },
      { name: '--sr-distance', fallback: '1.5rem', note: 'How far a slide travels; the `distance` prop overrides it.' },
    ],
    a11y: [
      'Nothing is hidden by the stylesheet: the script adds the hiding class, so if it fails or never loads every word is visible.',
      'prefers-reduced-motion (tracked live): everything is shown at once, with no transition.',
      'Keyboard focus landing inside a not-yet-revealed target reveals it immediately, so focus never sits on something invisible.',
      'Printing shows everything. Hidden content stays in the accessibility tree and in find-in-page, since it is only transparent.',
    ],
    usage: `<ScrollReveal as="ul" class="cards" stagger={100}>
  <li class="card">…</li>
  <li class="card">…</li>
  <li class="card">…</li>
</ScrollReveal>

<ScrollReveal direction="left" distance="2rem">
  <blockquote>…</blockquote>
</ScrollReveal>
<!-- :root { --sr-duration: 500ms; } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/scroll-reveal/ (demo)' }],
    file: 'src/library/scroll-reveal/ScrollReveal.astro',
    added: '2026-09-23',
  },
  {
    id: 'business-hours',
    name: 'Business hours',
    aka: ['Business Hours Indicator', 'opening hours widget', 'open now / closed now', 'store hours', 'hours of operation', 'WP Business Hours'],
    summary:
      'Open or closed right now, with the countdown ("closing in 40 minutes", "opens tomorrow at 8:00 AM"), the week’s hours, holiday hours and closures, computed in the business’s own time zone in the browser, on the minute. Also emits the LocalBusiness openingHoursSpecification from the same data.',
    pitch: 'Open now, closing in 40 minutes, back tomorrow at 8: always right, in the shop’s own time zone.',
    // 10/mo each (SE Ranking US, 2026-09-23); everything else 0 or no data. The page is for the
    // catalogue and the sales conversation; the element's search value is the client's JSON-LD.
    search: { query: 'opening hours widget', alsoRanks: ['business hours wordpress plugin', 'opening hours website'] },
    replaces: ['Mabel Business Hours Indicator (Pro)', 'WP Business Hours', 'Opening Hours by Wolfgang', 'hand-written hours in the footer'],
    goodFor: 'Any business with a door: shops, clinics, cafés, salons. Several locations in different time zones on one site, one element per location.',
    notFor: 'Booking availability or staff calendars; this states when the doors are open, not which slots are free.',
    props: [
      { name: 'hours', type: 'BusinessHoursData', note: 'The data: `timeZone` (IANA), `weekly`, and optional `exceptions`, `closures`, `seasons`, `alwaysOpen`, `byAppointment`, `note`. Import the type from the component. Priority: closure > exception > season > weekly.' },
      { name: 'variant', type: "'line' | 'badge' | 'table' | 'full'", default: "'full'", note: 'line: the sentence. badge: Open/Closed pill and the sentence. table: the week, today marked. full: badge, table, note and the coming exceptions.' },
      { name: 'soonMinutes', type: 'number', default: '60', note: 'Within this many minutes say "closing in 40 minutes" / "opening in 15 minutes" instead of a clock time. Relative words stop at 90 whatever this says.' },
      { name: 'showZone', type: "'auto' | 'always' | 'never'", default: "'auto'", note: 'Append the business’s zone ("Central Time") to times. auto: only when the visitor’s clock would read differently.' },
      { name: 'hourCycle', type: "'h12' | 'h23'", note: 'Default: the locale’s own (h12 for en-US).' },
      { name: 'locale', type: 'string', note: 'Day and time names. Default: the page’s `lang` in the browser, en-US for the server-rendered table. Set it on a non-English site.' },
      { name: 'label', type: 'string', note: 'Location name, for a site with several; shown above and in the table caption.' },
      { name: 'jsonLd', type: 'false | { id: string; type?: string }', note: 'Emit openingHoursSpecification for the page’s LocalBusiness node with this `@id` (and `@type`, default LocalBusiness). The id must be absolute (`https://example.com/#business`) and identical to the layout’s: it is emitted verbatim, and a bare `#business` resolves against each page’s own URL. Omit or false: none. One instance per location sets it; the layout stops hand-writing hours.' },
      { name: 'upcomingDays', type: 'number', default: '30', note: 'Exceptions and closures starting within this many days are listed (full).' },
      { name: 'words', type: 'Partial<Words>', note: 'Override any text: open, closed, closesAt, closingIn, opensAt, opensTomorrow, opensOn, reopens, openingIn, closedFor, closedUntil, exceptionHours, open24, byAppointment, the duration units, table headings. `{time}`, `{day}`, `{date}`, `{duration}`, `{name}` are filled in.' },
      { name: 'now', type: 'number | string', note: 'Freezes the clock. Demos and checks only; never on a real site.' },
      { name: 'slot open / slot closed', type: 'slot', note: 'Content shown only in that state (call now / leave a message). Both render server-side; the script hides one, so without JavaScript both show.' },
    ],
    theming: [
      { name: '--bh-open', fallback: '#1a7f37', note: 'Open state word and pill.' },
      { name: '--bh-closed', fallback: '#b42318', note: 'Closed state word and pill.' },
      { name: '--bh-badge-bg', fallback: 'transparent', note: 'Fill behind the pill.' },
      { name: '--bh-today-bg', fallback: 'rgb(0 0 0 / 0.05)', note: 'Today’s row in the table.' },
      { name: '--bh-line', fallback: 'rgb(0 0 0 / 0.15)', note: 'Table rules.' },
      { name: '--bh-text', fallback: 'inherit', note: 'Text colour.' },
    ],
    a11y: [
      'The week is a real table with a caption naming the time zone, and scoped column and row headers. Today’s row says "(today)" and carries aria-current="date"; the highlight is on top of the word.',
      'The sentence is in an aria-live="polite" region, rewritten only when its text changes, not every minute.',
      'Open and closed are words; colour and the dot are on top. Times are <time datetime> elements.',
      'The static HTML never claims a state, so a cached page is never wrong; with JavaScript off the table and both slots show.',
      'No motion, so nothing to reduce.',
    ],
    usage: `---
import BusinessHours, { type BusinessHoursData } from '../components/BusinessHours.astro';
import { hours } from '../data/hours';   // export const hours: BusinessHoursData = { timeZone: 'America/Chicago', weekly: { … } }
---
<!-- Contact page: the whole thing, and the JSON-LD for the layout's LocalBusiness @id -->
<BusinessHours hours={hours} variant="full" jsonLd={{ id: 'https://example.com/#business' }}>
  <p slot="open">Call now: …</p>
  <p slot="closed">Leave a message and we call back.</p>
</BusinessHours>

<!-- Footer: one line, no second JSON-LD -->
<BusinessHours hours={hours} variant="line" jsonLd={false} />`,
    usedOn: [{ site: 'wellnessondemand', where: '/contact-us/ (full, JSON-LD as MedicalBusiness) and the footer (line); ecropolis/WellnessOnDemand#1' }],
    file: 'src/library/business-hours/BusinessHours.astro',
    added: '2026-09-23',
  },
  {
    id: 'news-ticker',
    name: 'News ticker',
    aka: ['Content Ticker', 'PowerPack Content Ticker', 'marquee', 'scrolling headlines', 'trending bar', 'announcement bar', 'ticker tape', 'text ticker'],
    summary:
      'A one-line strip: a label chip, then headlines that take turns (slide up or left, or cross-fade) or scroll past as a seamless marquee. Links with optional thumbnails and a muted date. A visible pause button; hover and keyboard focus hold it. Without JavaScript, a plain list of links.',
    pitch: 'Keep your latest news, offers and events turning over in one slim strip, so visitors see what is new without a banner shouting at them.',
    // 880/mo, difficulty 18 and rising; website ticker 170/7, text ticker 170/15; css marquee
    // 260/20 is a developer query and stays unclaimed (SE Ranking US, 2026-09-23).
    search: { query: 'news ticker', alsoRanks: ['website ticker', 'text ticker', 'scrolling news ticker'] },
    replaces: ['PowerPack Content Ticker (Beaver Builder)', 'Elementor Pro Post Ticker / Nav Menu ticker', 'news ticker WordPress plugins', 'the HTML marquee tag'],
    goodFor: 'A strip under the header or above the footer: the latest posts, this week’s offers, the next few events, a “Trending” row on a blog. Five to eight short headlines.',
    notFor: 'A page that already has a moving hero or carousel; more than one per page; body copy, or anything a visitor must read to finish a task (it truncates and moves on).',
    props: [
      { name: 'items', type: '{ text, href?, image?, imageAlt?, meta? }[]', note: 'The headlines, passed in by the host (a content collection, a data file, the events or reviews JSON the site already builds from). `meta` is a short date or tag shown muted. `imageAlt` defaults to empty: the headline names the link.' },
      { name: 'label', type: 'string', note: 'The chip, e.g. “Trending”. Also the strip’s accessible name.' },
      { name: 'labelHref', type: 'string', note: 'Makes the chip a link, e.g. to the blog or offers page.' },
      { name: 'mode', type: '“slide” | “fade” | “marquee”', default: '“slide”', note: 'slide and fade show one item at a time; marquee scrolls the whole list sideways and has no arrows.' },
      { name: 'direction', type: '“up” | “left”', default: '“up”', note: 'For slide: rises into place, or comes in from the right.' },
      { name: 'interval', type: 'number', default: '4000', note: 'ms each item shows, for slide and fade.' },
      { name: 'speed', type: 'number', default: '50', note: 'Marquee speed in px/s, measured from the rendered list, so it never runs faster.' },
      { name: 'autoplay', type: 'boolean', default: 'true', note: '`false`: slide and fade move only with the arrows (always shown then) and there is no pause button; a marquee becomes a static list.' },
      { name: 'arrows', type: 'boolean', default: 'true', note: 'Prev/next buttons for slide and fade. Ignored for marquee.' },
      { name: 'pauseOnHover', type: 'boolean', default: 'true', note: 'Hold while the pointer is over the strip. Keyboard focus always holds it.' },
      { name: 'showImages', type: 'boolean', default: 'true when any item has an image', note: 'Show the thumbnails.' },
      { name: 'maxItems', type: 'number', note: 'Show only the first this many items.' },
      { name: 'reducedMotion', type: '“swap” | “list”', default: '“swap”', note: 'Under prefers-reduced-motion, slide and fade swap instantly on the interval, or show the static list. A marquee is always a static list then.' },
      { name: 'pauseLabel / playLabel', type: 'string', default: '“Pause ticker” / “Play ticker”', note: 'The pause button’s name in each state.' },
      { name: 'prevLabel / nextLabel', type: 'string', default: '“Previous item” / “Next item”', note: 'The arrows’ names.' },
      { name: 'countLabel', type: 'string', default: '“{n} of {total}: {text}”', note: 'What the arrows announce. Translate it on a non-English site.' },
      { name: 'class', type: 'string', note: 'Class on the strip, for the host to theme and place it.' },
    ],
    theming: [
      { name: '--nt-accent', fallback: '#3b2fc9', note: 'The host’s accent: the label chip, hover colour and focus ring all follow it.' },
      { name: '--nt-bg', fallback: '#f1f2f6', note: 'Strip background.' },
      { name: '--nt-fg', fallback: '#1b1c22', note: 'Strip text and button icons.' },
      { name: '--nt-label-bg', fallback: 'var(--nt-accent)', note: 'Label chip fill, if it should differ from the accent.' },
      { name: '--nt-label-fg', fallback: '#fff', note: 'Label chip text.' },
      { name: '--nt-link', fallback: 'inherit', note: 'Headline colour.' },
      { name: '--nt-link-hover', fallback: 'var(--nt-accent)', note: 'Headline colour on hover and focus.' },
      { name: '--nt-muted', fallback: '#585b6b', note: 'Meta text and the marquee’s dots. Keep 4.5:1 on --nt-bg.' },
      { name: '--nt-focus', fallback: 'var(--nt-accent)', note: 'Focus ring.' },
      { name: '--nt-control-line', fallback: 'rgb(0 0 0 / 0.25)', note: 'Button ring.' },
      { name: '--nt-control-hover', fallback: 'rgb(0 0 0 / 0.07)', note: 'Button fill on hover.' },
      { name: '--nt-height', fallback: '3rem', note: 'Strip height on desktop.' },
      { name: '--nt-thumb', fallback: '2.25rem', note: 'Thumbnail size (square).' },
      { name: '--nt-radius', fallback: '0.5rem', note: 'Strip and chip corners.' },
      { name: '--nt-gap', fallback: '2.5rem', note: 'Space between marquee items.' },
      { name: '--nt-duration', fallback: '450ms', note: 'Slide and fade transition length.' },
    ],
    a11y: [
      'WCAG 2.2.2: while anything moves by itself a visible Pause/Play button sits right after the label, first in the tab order; its name says what it will do. Nothing moves, and there is no button, without JavaScript or with autoplay off.',
      'Autoplay holds while the pointer is over the strip and while keyboard focus is inside it, and picks up on leave and blur unless the visitor pressed Pause. Pausing holds across hover; pressing Play starts it at once. It also holds in hidden tabs and off screen.',
      'The strip is a region named by its label, with aria-roledescription “ticker”. The headlines are not a live region, so automatic turns are never announced; the prev/next buttons write “3 of 7: <headline>” to a polite status line.',
      'Every headline link stays in the DOM and the tab order: tabbing to one that is not showing brings it in at once and holds the strip. The marquee’s second copy is inert and aria-hidden, so each link is reached once.',
      'prefers-reduced-motion (tracked live): no animation. Slide and fade swap instantly on the interval (or show the static list with reducedMotion="list"); a marquee is a static list.',
      'Without JavaScript every item is a visible list of links. Headlines are links, not headings, so the page outline stays clean.',
    ],
    usage: `---
import NewsTicker from '../components/NewsTicker.astro';
import { getCollection } from 'astro:content';
const posts = (await getCollection('blog')).sort((a, b) => +b.data.date - +a.data.date).slice(0, 6);
---
<NewsTicker
  label="Latest"
  labelHref="/blog/"
  items={posts.map((p) => ({
    text: p.data.title,
    href: \`/blog/\${p.id}/\`,
    meta: p.data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))}
/>
<!-- .nt { --nt-accent: var(--brand); --nt-bg: var(--tint); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/news-ticker/ (demo)' }],
    file: 'src/library/news-ticker/NewsTicker.astro',
    added: '2026-09-23',
  },
  {
    id: 'flip-box',
    name: 'Flip box',
    aka: ['PowerPack Flip Box', 'UABB Flip Box', 'Elementor Flip Box', 'flip card', 'info box with hover reveal', '3D card flip'],
    summary:
      'An info card with a front (icon or image, title, a line) and a back (longer text, a link) that turns over in 3D: on hover where there is a mouse, and on click, tap, Enter or Space everywhere. Both faces share one height; the hidden face is inert.',
    pitch: 'A card that turns over to say more — works on a phone, not just on hover.',
    // 480/mo, difficulty 8; card flip animation 170/16; flip card css 90/20 (SE Ranking US, 2026-09-23).
    search: { query: 'flip box', alsoRanks: ['card flip animation', 'flip card css'] },
    replaces: ['PowerPack / UABB / Elementor Pro Flip Box modules', 'hand-rolled CSS flip cards'],
    goodFor: 'Services grids, team members, features: three or four cards in a row, where the front names the thing and the back says a little more and links on.',
    notFor:
      'Content people must read without interacting. The back is optional detail, never the only place a price, a phone number or an opening time lives: put those on the front or on the page.',
    props: [
      { name: 'title', type: 'string', note: 'Front heading, and the accessible name of the card’s button.' },
      { name: 'text', type: 'string', note: 'The front’s short line.' },
      { name: 'icon', type: 'string', note: 'Inline SVG markup for the front; decorative (aria-hidden). The `icon` slot does the same.' },
      { name: 'image', type: 'string', note: 'Front background image, under a scrim. Selects variant `image` unless `variant` says otherwise.' },
      { name: 'imageAlt', type: 'string', note: 'Required with `image` (the build fails without it): describe the photo, or pass "" to mark it decorative on purpose.' },
      { name: 'backTitle', type: 'string', default: '`title`', note: 'Back heading.' },
      { name: 'backText', type: 'string', note: 'The back’s longer text.' },
      { name: 'cta', type: '{ text: string; href: string }', note: 'A link on the back. A real link: on a touch screen the first tap turns the card, the second follows it.' },
      { name: 'direction', type: '“left” | “right” | “up” | “down”', default: '“left”', note: 'The way the front turns. “left”: its right edge comes toward you and swings left, like a book page. (PowerPack’s Left is `right`, its Top is `down`.)' },
      { name: 'duration', type: 'number', note: 'ms for the turn. Overrides `--fb-duration` (fallback 600ms).' },
      { name: 'trigger', type: '“both” | “hover” | “click”', default: '“both”', note: 'Whether hover ALSO turns it. Click, tap, Enter and Space always do: the element refuses a hover-only flip, which locks out touch and keyboards, so “hover” behaves as “both”. “click”: hover never turns it.' },
      { name: 'variant', type: '“plain” | “tint” | “image”', default: '“image” with `image`, else “tint”', note: 'plain: white face, bordered. tint: tinted face, icon in a white circle. image: photo under a scrim, white text.' },
      { name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3', note: 'Level of the title headings; match the page outline.' },
      { name: 'label', type: 'string', note: 'Accessible name of the card’s button. Default: `title`, else the front’s first heading.' },
      { name: 'class', type: 'string', note: 'Class on the root, for theming one card.' },
      { name: 'slot front / slot back / slot icon', type: 'slot', note: 'Any HTML for a face or the icon. A slot wins over the props for that part; `front` replaces the whole front, icon included. Keep links off the front: the whole front is the button.' },
    ],
    theming: [
      { name: '--fb-accent', fallback: '#5933d8', note: 'Back face, icons and focus ring, unless set separately.' },
      { name: '--fb-back-bg', fallback: 'var(--fb-accent)', note: 'Back background.' },
      { name: '--fb-back-fg', fallback: '#fff', note: 'Back text, and the ring around a focused back link.' },
      { name: '--fb-front-bg', fallback: '#fff', note: 'Front background, variant plain.' },
      { name: '--fb-tint', fallback: '#f4f1fe', note: 'Front background, variant tint.' },
      { name: '--fb-front-fg', fallback: 'inherit', note: 'Front text, variants plain and tint.' },
      { name: '--fb-image-fg', fallback: '#fff', note: 'Front text, variant image.' },
      { name: '--fb-scrim', fallback: 'rgb(20 24 40 / 0.6)', note: 'Over the image, for the text. Keep white text at 4.5:1 against the brightest part.' },
      { name: '--fb-cta-bg', fallback: '#fff', note: 'Back link fill.' },
      { name: '--fb-cta-fg', fallback: 'var(--fb-back-bg)', note: 'Back link text.' },
      { name: '--fb-icon-color', fallback: 'var(--fb-accent)', note: 'Icon stroke (plain, tint).' },
      { name: '--fb-icon-bg', fallback: '#fff', note: 'Circle behind the icon, variant tint.' },
      { name: '--fb-icon-size', fallback: '2.5rem', note: 'Icon size; the tint circle is twice it.' },
      { name: '--fb-border', fallback: 'rgb(0 0 0 / 0.08)', note: 'Border, variant plain.' },
      { name: '--fb-radius', fallback: '14px', note: 'Corner radius.' },
      { name: '--fb-padding', fallback: '2rem 1.5rem', note: 'Inside each face.' },
      { name: '--fb-shadow', fallback: '0 1px 2px rgb(0 0 0 / 0.06), 0 10px 28px rgb(0 0 0 / 0.1)', note: 'box-shadow of each face.' },
      { name: '--fb-min-height', fallback: '16rem', note: 'A floor, not a height: the card grows with its taller face.' },
      { name: '--fb-title-size', fallback: '1.25rem', note: 'Title font size.' },
      { name: '--fb-focus', fallback: 'var(--fb-accent)', note: 'Focus ring around the card.' },
      { name: '--fb-duration', fallback: '600ms', note: 'The turn; the `duration` prop overrides it.' },
      { name: '--fb-easing', fallback: 'cubic-bezier(0.4, 0.2, 0.2, 1)', note: 'Timing of the turn.' },
      { name: '--fb-fade', fallback: '250ms', note: 'The crossfade under reduced motion.' },
      { name: '--fb-perspective', fallback: '1500px', note: 'Depth of the 3D turn; smaller is more dramatic.' },
    ],
    a11y: [
      'The card is a real button named from the title, with aria-expanded showing which face is up and aria-controls pointing at the back. Enter or Space turns it; Escape turns it back and returns focus to the button.',
      'Both faces are in the DOM. The face turned away is inert and aria-hidden, so its links are not tab stops and a screen reader reads only the face that shows. With the back up, Tab goes from the button to the back’s link.',
      'Focus inside the back keeps it shown. Focus leaving the card turns back a card opened from the keyboard; a card a pointer clicked open stays open until clicked again.',
      'Hover never works alone: on a touch screen the first tap turns the card and its link works on the second tap; a tap on the back away from the link turns it back.',
      'prefers-reduced-motion (tracked live): no rotation; the faces crossfade.',
      'Without JavaScript the button is never shown and both faces render stacked, front then back, with the link. Printing shows both faces.',
      'A front image carries real alt text, or imageAlt="" when it is decorative on purpose; the build fails if imageAlt is missing. Icons are decorative.',
    ],
    usage: `<div class="services">   <!-- grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)) -->
  <FlipBox
    icon={toothIcon}
    title="Cleanings"
    text="Every six months, about an hour."
    backText="A hygienist cleans, checks and polishes; the dentist looks in at the end."
    cta={{ text: 'Book a cleaning', href: '/book/' }}
  />
  <FlipBox image="/images/office.webp" imageAlt="" title="Our office" … />
  <FlipBox direction="up" trigger="click">
    <div slot="front">…</div>
    <div slot="back">…</div>
  </FlipBox>
</div>
<!-- :root { --fb-accent: var(--brand); --fb-radius: var(--radius); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/flip-box/ (demo)' }],
    file: 'src/library/flip-box/FlipBox.astro',
    added: '2026-09-23',
  },
  {
    id: 'social-grid',
    name: 'Instagram feed',
    aka: ['PowerPack Instagram Feed', 'Smash Balloon', 'Instagram feed widget', 'social feed', 'Elfsight Instagram', 'LightWidget'],
    summary:
      'A grid of an account’s recent Instagram posts, each tile a link to the post, with the handle and a Follow link above. Renders the SocialFeedHandler feed JSON (our mirrored copies of the images), read at build time. No JavaScript, no call to Instagram from the page.',
    pitch: 'Your latest posts on your own site, from our copy of the images, so the grid does not go blank when Instagram changes its mind.',
    // SE Ranking US, 2026-09-23: embed instagram feed 320/mo, difficulty 22; instagram feed
    // website 260/34; instagram feed wordpress 140/8.
    search: { query: 'embed instagram feed', alsoRanks: ['instagram feed website', 'instagram feed wordpress'] },
    replaces: ['PowerPack Instagram Feed', 'Smash Balloon / Elfsight / LightWidget embeds'],
    goodFor: 'Restaurants, salons, makers, and anyone whose Instagram is their portfolio: the grid keeps the site as fresh as the account.',
    notFor: 'Accounts that post rarely (a stale grid dates the site), and anything that needs like or comment counts: the API does not return them reliably for the account’s visitors, and they date the moment the page is built.',
    props: [
      { name: 'feed', type: 'SocialFeed', note: 'The feed JSON: `{ source: { username, profile_url, connected, last_pulled_at }, posts: [{ id, permalink, media_type, taken_at, image: { url, width, height }, alt, caption }] }`. At build, from `src/data/social.json`. Import the type from the component.' },
      { name: 'columns', type: 'number | { base?, md?, lg? }', default: '{ base: 3, md: 4, lg: 6 }', note: 'Columns per viewport breakpoint: md from 48rem, lg from 64rem. A missing md takes base; a missing lg takes md.' },
      { name: 'max', type: 'number', default: '12', note: 'Most tiles shown. The Worker serves the latest 24.' },
      { name: 'header', type: 'boolean', default: 'true', note: '"@username on Instagram" linking to the profile, and a Follow link. Disconnected: "Recent posts".' },
      { name: 'captions', type: "'hover' | 'below' | 'none'", default: "'hover'", note: 'hover: an overlay on hover and keyboard focus (aria-hidden: the alt carries the text). below: the caption as text under the tile, three lines. none.' },
      { name: 'square', type: 'boolean', default: 'true', note: 'Square crops with object-fit: cover. false keeps each image’s own shape.' },
      { name: 'gap', type: 'string', note: 'Space between tiles, any CSS length. Overrides --sg-gap.' },
      { name: 'locale', type: 'string', default: "'en-US'", note: 'Date words in the fallback alt ("Instagram post from September 12, 2026").' },
      { name: 'words', type: 'Partial<SocialGridWords>', note: 'Override any text: live (`{username}`), recent, follow, video, album, untitled (`{date}`), newTab.' },
      { name: 'id', type: 'string', note: 'Id prefix. Derived from the content by default; set it only when one page repeats the same grid with the same options.' },
    ],
    theming: [
      { name: '--sg-gap', fallback: '0.5rem', note: 'Space between tiles.' },
      { name: '--sg-radius', fallback: '0', note: 'Tile corner radius.' },
      { name: '--sg-tile-bg', fallback: 'rgb(0 0 0 / 0.06)', note: 'Behind an image while it loads.' },
      { name: '--sg-caption-bg', fallback: 'rgb(0 0 0 / 0.72)', note: 'Hover caption overlay. Keep 4.5:1 with --sg-caption-fg over the lightest image.' },
      { name: '--sg-caption-fg', fallback: '#fff', note: 'Hover caption text.' },
      { name: '--sg-below-fg', fallback: 'inherit', note: 'Caption text under a tile.' },
      { name: '--sg-mark-bg', fallback: 'rgb(0 0 0 / 0.55)', note: 'Disc behind the video / album mark.' },
      { name: '--sg-mark-fg', fallback: '#fff', note: 'The mark.' },
      { name: '--sg-head-fg', fallback: 'inherit', note: 'Header line.' },
      { name: '--sg-follow-bg', fallback: '#1d1a2e', note: 'Follow link fill.' },
      { name: '--sg-follow-fg', fallback: '#fff', note: 'Follow link text.' },
      { name: '--sg-focus', fallback: '#1d1a2e', note: 'Focus ring on tiles and links.' },
      { name: '--sg-duration', fallback: '180ms', note: 'Caption fade. Instant under prefers-reduced-motion.' },
    ],
    a11y: [
      'Each tile is one link wrapping the image, so its accessible name is the image’s alt, then "(video)" or "(album)" from a visually hidden word beside the decorative mark. Tabbing through the grid reads a distinct name per tile.',
      'An empty alt falls back to the caption’s first sentence, then to "Instagram post from <date>"; a name that would repeat gets a number. No tile is nameless.',
      'Hover captions also show on keyboard focus, and are aria-hidden: the text lives in the alt, never only in the overlay. Captions below are ordinary text after the link.',
      'Every link opens Instagram in a new tab and says so once, through aria-describedby, rather than in each name.',
      'The grid is a list labelled by the header line. The caption fade is instant under prefers-reduced-motion. No JavaScript.',
    ],
    usage: `// package.json: the site fetches the feed before every build
"prebuild": "node scripts/fetch-social.mjs"

// scripts/fetch-social.mjs (in the client site, not the library):
//   GET https://social.compass.st/v1/feeds/<site>.json  →  src/data/social.json
//   unreachable or malformed, and a previous social.json exists → keep it, warn, exit 0
//   unreachable or malformed, and no social.json yet            → fail the build, exit 1
// Commit src/data/social.json: a Pages build starts from a clean clone, so the committed copy
// is the "previous" one. The Worker fires the site's deploy hook when new posts arrive.

---
import SocialGrid, { type SocialFeed } from '../components/SocialGrid.astro';
import social from '../data/social.json';
const feed = social as SocialFeed;
---
{feed.posts.length > 0 && <h2>From our Instagram</h2>}
<SocialGrid feed={feed} columns={{ base: 3, md: 4, lg: 6 }} max={12} />

<!-- public/_headers: the images come from the Worker's host, so the CSP needs
     img-src 'self' https://social.compass.st -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/social-grid/ (demo)' }],
    file: 'src/library/social-grid/SocialGrid.astro',
    added: '2026-09-23',
  },
  {
    id: 'accordion',
    name: 'Accordion / FAQ',
    aka: ['PowerPack FAQ Module', 'PowerPack Advanced Accordions', 'UABB Advanced Accordion', 'Elementor Accordion', 'FAQ accordion', 'FAQ schema', 'toggle', 'collapsible'],
    summary:
      'Questions (or any titles) that open to show their answer, on native <details>/<summary>: keyboard, screen readers and find-in-page work with no script. One open at a time or several, numbered, chevron or plus, deep-linkable by #id. With jsonLd on, the same items become the page’s FAQPage structured data, so the FAQ and the accordion are one element.',
    pitch: 'FAQ page design that gets people their answer fast: each question opens with a tap, every answer is findable with Ctrl+F, and search engines and AI assistants can read them as questions and answers.',
    // faq page design 320/mo, difficulty 6; wordpress accordion 110/17; accordion design 210/35;
    // html accordion 320/41 (SE Ranking US, 2026-09-23).
    search: { query: 'faq page design', alsoRanks: ['wordpress accordion', 'accordion design', 'html accordion'] },
    replaces: [
      'PowerPack “FAQ” module (Beaver Builder)',
      'PowerPack “Advanced Accordions” module',
      'UABB “Advanced Accordion”',
      'Elementor Accordion and Toggle widgets',
      'hand-written FAQ lists',
      'FAQ schema plugins (Yoast and Rank Math FAQ blocks, Structured Content)',
    ],
    goodFor: 'An FAQ page or section; services, policies or specifications that visitors scan for the one they need; any page where most readers want one answer out of many.',
    notFor:
      'Content everyone must read (behind a tap, most people never see it), a single paragraph, or navigation. Nor is it a promise of search features: since August 2023 Google shows FAQ rich results only for well-known, authoritative government and health sites. The schema is still correct markup that tells machines these are questions and answers; it does not buy extra space in results.',
    props: [
      { name: 'items', type: 'AccordionItem[]', note: '`{ title, body?, slot?, id?, open? }`. `title` is plain text (the summary and the JSON-LD question). `body` is an HTML string; or name a slot in `slot` and pass `<div slot="…">…</div>`. `id` is the deep-link anchor (default: the title, slugified).' },
      { name: 'exclusive', type: 'boolean', default: 'true', note: 'One open at a time. Uses the `name` attribute, so the browser closes the others itself.' },
      { name: 'openFirst', type: 'boolean', default: 'false', note: 'Open the first item on load.' },
      { name: 'numbered', type: 'boolean', default: 'false', note: '“1) 2) 3)” before each title, in the accent colour.' },
      { name: 'icon', type: '“chevron” | “plus” | “none”', default: '“chevron”', note: 'Chevron turns over; plus becomes a minus.' },
      { name: 'boxed', type: 'boolean', default: 'false', note: 'Separate bordered boxes with `--ac-gap` between, instead of a ruled list.' },
      { name: 'headingLevel', type: '2 | 3 | 4', default: '3', note: 'Heading level of each title inside its summary, so the page outline stays unbroken.' },
      { name: 'jsonLd', type: 'boolean', default: 'false', note: 'Emit FAQPage JSON-LD from `items`. One instance per page; delete any hand-written FAQPage on that page.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--ac-fg', fallback: 'inherit', note: 'Question text.' },
      { name: '--ac-muted', fallback: 'inherit', note: 'Answer text.' },
      { name: '--ac-accent', fallback: 'currentColor', note: 'Icon and number.' },
      { name: '--ac-bg', fallback: 'transparent', note: 'Summary fill.' },
      { name: '--ac-bg-open', fallback: 'var(--ac-bg)', note: 'Summary fill while open.' },
      { name: '--ac-hover', fallback: 'rgb(0 0 0 / 0.04)', note: 'Summary fill on hover.' },
      { name: '--ac-border', fallback: 'rgb(0 0 0 / 0.14)', note: 'Rules between items, or box borders when `boxed`.' },
      { name: '--ac-radius', fallback: '0', note: 'Corners of each item.' },
      { name: '--ac-gap', fallback: '0 (0.75rem when boxed)', note: 'Space between items.' },
      { name: '--ac-pad-y / --ac-pad-x', fallback: '1rem / 1.25rem', note: 'Summary and answer padding.' },
      { name: '--ac-focus', fallback: 'currentColor', note: 'Keyboard focus ring, drawn inside the summary.' },
      { name: '--ac-duration', fallback: '250ms', note: 'Open animation and icon turn.' },
    ],
    a11y: [
      'Native <details>/<summary>: Tab reaches each question, Enter or Space opens and closes it, and screen readers announce expanded or collapsed. The browser does this, not a script, so it cannot break.',
      'Every answer is in the page even when closed: find-in-page (Ctrl/⌘+F) matches it, and current Chrome, Edge and Firefox open the item. This is why the element is <details> and not a JavaScript accordion. It works with JavaScript off.',
      'Each question is a heading at `headingLevel` inside its summary, so the page outline lists the questions. The icon is decorative (aria-hidden).',
      '`exclusive` uses the name attribute, so the browser closes the others. A link to #item-id opens that item and scrolls to it (the one script in the element).',
      'Opening animates its height where ::details-content and interpolate-size exist (Chromium) and is instant elsewhere; under prefers-reduced-motion nothing animates, the icon included.',
    ],
    usage: `---
import Accordion, { type AccordionItem } from '../components/Accordion.astro';
const faqs: AccordionItem[] = [
  { id: 'parking', title: 'Is there parking?', body: '<p>Free two-hour parking out front.</p>' },
  { id: 'dogs', title: 'Can I bring my dog?', body: '<p>On the patio, yes.</p>' },
];
---
<!-- The FAQ page: schema on, first answer open. Delete any hand-written FAQPage. -->
<Accordion items={faqs} openFirst jsonLd headingLevel={2} />

<!-- A services list: numbered, plus icons, several open at once, no schema -->
<Accordion items={services} numbered icon="plus" boxed exclusive={false} />
<!-- .faq { --ac-accent: var(--brand); --ac-border: var(--line); } -->`,
    usedOn: [
      { site: 'jwalktours.com', where: '/faqs/ and the tour pages: its own FaqList.astro (<details>, FAQPage JSON-LD from the same array); moves to this element on its next FAQ request' },
      { site: 'stbeautybar.com', where: '/about-us/ FAQ: its own Faqs.astro (exclusive, first open, rotating icon, FAQPage JSON-LD); moves to this element on its next FAQ request' },
    ],
    file: 'src/library/accordion/Accordion.astro',
    added: '2026-09-23',
  },
  {
    id: 'card-slider',
    name: 'Card slider',
    aka: ['PowerPack Card Slider', 'Elementor Testimonial Carousel', 'Slick slider', 'Swiper', 'Owl carousel', 'post carousel', 'team carousel'],
    summary:
      'A row of cards (testimonials, team, posts, products) on a real horizontally scrolling track with CSS scroll-snap, so touch and trackpad swiping need no code. Arrows page it, dots follow the page, cards per page are set per breakpoint. Loop and autoplay are off by default; autoplay comes with a pause button.',
    pitch: 'Show more reviews, team members or posts than fit across the page, and let visitors swipe or click through them.',
    // card slider 210/mo, difficulty 7; card carousel 260/21; testimonial carousel 90/15
    // (SE Ranking US, 2026-09-23).
    search: { query: 'card slider', alsoRanks: ['card carousel'] },
    replaces: ['PowerPack Card Slider', 'Slick/Swiper/Owl embeds', 'Elementor Pro carousels'],
    goodFor: 'Testimonials, team members, recent posts, related products: a set of similar cards where seeing three and knowing there are more is enough.',
    notFor:
      'A hero (that is video-background or particle-field territory), or anything every visitor must see all of: a slider hides most of its cards, so when each card matters a grid is the honest choice.',
    props: [
      { name: 'label', type: 'string', note: 'Accessible name of the carousel, e.g. “What our customers say”. Required.' },
      { name: 'default slot', type: 'cards', note: 'Each direct child is one card (article, div, figure), not a list. The script names each “3 of 8”.' },
      { name: 'perView', type: 'number | { base?, md?, lg? }', default: '{ base: 1, md: 2, lg: 3 }', note: 'Cards per page; md ≥ 48rem, lg ≥ 64rem (viewport). A missing breakpoint inherits the one below.' },
      { name: 'gap', type: 'string', note: 'Space between cards, any CSS length. Overrides `--cs-gap` (fallback 1rem).' },
      { name: 'loop', type: 'boolean', default: 'false', note: 'Next on the last page rewinds to the first, Previous on the first goes to the last. A visible rewind: no cloned cards, so nothing is read twice.' },
      { name: 'autoplay', type: 'boolean', default: 'false', note: 'Advance a page every `interval`, rewinding at the end. Adds a pause button. Never under reduced motion.' },
      { name: 'interval', type: 'number', default: '5000', note: 'ms between pages when autoplaying (at least 2000).' },
      { name: 'arrows', type: 'boolean', default: 'true', note: 'Previous / Next buttons under the track.' },
      { name: 'dots', type: 'boolean', default: 'true', note: 'One button per page. With neither arrows nor dots the scrollbar stays visible.' },
      { name: 'pauseOnHover', type: 'boolean', default: 'true', note: 'Autoplay waits while a mouse is over the slider.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--cs-gap', fallback: '1rem', note: 'Space between cards; the `gap` prop overrides it.' },
      { name: '--cs-control-bg', fallback: '#1b1c22', note: 'Arrow and pause buttons.' },
      { name: '--cs-control-fg', fallback: '#fff', note: 'Their icons.' },
      { name: '--cs-dot', fallback: 'rgb(0 0 0 / 0.25)', note: 'Other pages’ dots.' },
      { name: '--cs-dot-active', fallback: '#1b1c22', note: 'The current page’s dot, which is also longer.' },
      { name: '--cs-focus', fallback: 'currentColor', note: 'Keyboard focus ring.' },
    ],
    a11y: [
      'The track is a region with aria-roledescription="carousel" and the `label` as its name, and it is focusable, so ← → scroll it. Each card is role="group" with aria-roledescription="slide" and “3 of 8” in its name.',
      'The cards’ own links are ordinary tab stops; focusing one scrolls its whole card into view. Arrows and dots are real buttons with names (“Previous”, “Page 2 of 3”); the current dot has aria-current and a longer shape, not only a colour. No aria-live: nothing is announced on its own.',
      'Swiping, trackpad and scroll-wheel are the browser’s own scrolling. Paging is smooth, and instant under prefers-reduced-motion.',
      'Autoplay (off by default) has a visible pause button, WCAG 2.2.2, named for what it will do. It waits while hovered, while focus is inside, while the tab is hidden and while off screen, and a swipe restarts its countdown. Under prefers-reduced-motion (tracked live) it never starts and the button is not shown.',
      'Without JavaScript the track scrolls by hand with its scrollbar visible; arrows, dots and the pause button are absent.',
    ],
    usage: `<CardSlider label="What our customers say" perView={{ base: 1, md: 2, lg: 3 }}>
  <figure class="quote">…</figure>
  <figure class="quote">…</figure>
  <figure class="quote">…</figure>
  <figure class="quote">…</figure>
</CardSlider>

<CardSlider label="From the blog" perView={{ base: 1, md: 2 }} autoplay interval={6000} loop>
  {posts.map((p) => <article class="post">…<a href={p.url}>{p.title}</a></article>)}
</CardSlider>
<!-- .quotes { --cs-control-bg: var(--brand); --cs-dot-active: var(--brand); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/card-slider/ (demo)' }],
    file: 'src/library/card-slider/CardSlider.astro',
    added: '2026-09-23',
  },
  {
    id: 'tabs',
    name: 'Tabs',
    aka: ['PowerPack Advanced Tabs', 'UABB Advanced Tabs', 'Elementor Tabs', 'tabbed content', 'vertical tabs'],
    summary:
      'The WAI-ARIA tabs pattern, horizontal or vertical with icons, automatic or manual activation, with a shareable #hash per tab. Below collapseBelow the same panels render as an accordion; without JavaScript every panel shows under its heading.',
    pitch: 'Put several related answers in one place, a tab each, that folds into a simple list on a phone.',
    // html tabs 540/mo, difficulty 22; tabs component 260/23 (rising); tabs ui design 210/15;
    // vertical tabs 1000/74, out of reach, listed only (SE Ranking US, 2026-09-23).
    search: { query: 'html tabs', alsoRanks: ['tabs component', 'tabs ui design', 'vertical tabs'] },
    replaces: ['PowerPack “Advanced Tabs” (Beaver Builder)', 'UABB “Advanced Tabs”', 'Elementor Tabs widget'],
    goodFor: 'Alternatives a visitor picks one of: plans, service areas, a product’s description, specifications and delivery, an about page’s team, history and values.',
    notFor: 'Content people must compare side by side (use a table or columns), or more than about six tabs: past that the strip scrolls and some tabs are out of sight.',
    props: [
      { name: 'tabs', type: 'Tab[]', note: '`{ id, label, icon?, panel?, slot? }`. `id` is the anchor and hash (unique on the page). `icon` is an inline SVG string (decorative). `panel` is an HTML string; or name a slot in `slot`.' },
      { name: 'label', type: 'string', note: 'Accessible name of the tab strip. Required.' },
      { name: 'orientation', type: '“horizontal” | “vertical”', default: '“horizontal”', note: 'Vertical puts the strip in a column beside the panel; ↑ ↓ move between tabs.' },
      { name: 'activation', type: '“automatic” | “manual”', default: '“automatic”', note: 'Automatic selects the tab that gets focus; manual moves focus only, and Enter or Space selects.' },
      { name: 'collapseBelow', type: 'number', default: '640', note: 'Viewport width (px) below which the tabs render as an accordion. Tracked live. 0 never collapses.' },
      { name: 'hash', type: 'boolean', default: 'true', note: '`#id` selects that tab on load and on hashchange; selecting a tab rewrites the hash (replaceState, so Back does not step through tabs).' },
      { name: 'defaultTab', type: 'string', note: 'id of the tab selected when the URL names none. Default: the first.' },
      { name: 'headingLevel', type: '2 | 3 | 4', default: '3', note: 'Level of each panel’s heading: shown without JavaScript, and holding the accordion button on phones.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--tb-accent', fallback: 'currentColor', note: 'Selected tab marker, icons, accordion chevron.' },
      { name: '--tb-fg', fallback: 'inherit', note: 'Selected tab and panel text.' },
      { name: '--tb-muted', fallback: 'currentColor at 75%', note: 'Other tabs’ text.' },
      { name: '--tb-bg', fallback: 'transparent', note: 'Tab fill.' },
      { name: '--tb-bg-selected', fallback: 'var(--tb-bg)', note: 'Selected tab fill.' },
      { name: '--tb-border', fallback: 'rgb(0 0 0 / 0.14)', note: 'Rule under (or beside) the strip; accordion rules.' },
      { name: '--tb-panel-bg', fallback: 'transparent', note: 'Panel fill.' },
      { name: '--tb-panel-pad', fallback: '1.25rem 0', note: 'Panel padding (tabs layout).' },
      { name: '--tb-radius', fallback: '0', note: 'Tab corners.' },
      { name: '--tb-focus', fallback: 'currentColor', note: 'Keyboard focus ring.' },
      { name: '--tb-list-width', fallback: '16rem', note: 'Widest the vertical strip gets.' },
    ],
    a11y: [
      'The WAI-ARIA Authoring Practices tabs pattern: tablist, tab and tabpanel, with aria-selected, aria-controls, aria-labelledby and aria-orientation, and a roving tabindex so the strip is one Tab stop.',
      '← → (↑ ↓ when vertical) move between tabs and wrap; Home and End jump to the ends. Automatic activation selects on focus; manual waits for Enter or Space. Tab then moves into the panel, which is itself focusable only when it has nothing focusable inside.',
      'Below `collapseBelow` the tab strip is removed and each panel’s heading holds a disclosure button (aria-expanded, aria-controls). The panels are the same elements, rendered once; the label appears as the tab and as the heading, and only one of the two is ever displayed.',
      'Without JavaScript there is no tab strip: every panel shows under its label as a heading, and #id links jump to the panel.',
      'The newly shown panel fades in over 150 ms; under prefers-reduced-motion it does not.',
    ],
    usage: `<Tabs
  label="Plans"
  tabs={[
    { id: 'starter', label: 'Starter', panel: '<p>…</p>' },
    { id: 'studio', label: 'Studio', slot: 'studio' },
    { id: 'agency', label: 'Agency', panel: '<p>…</p>' },
  ]}
  defaultTab="studio"
>
  <div slot="studio"><p>…</p><a href="/contact/">Talk to us</a></div>
</Tabs>

<Tabs label="Why us" orientation="vertical" activation="manual" tabs={why} hash={false} />
<!-- .plans { --tb-accent: var(--brand); --tb-border: var(--line); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/tabs/ (demo)' }],
    file: 'src/library/tabs/Tabs.astro',
    added: '2026-09-23',
  },
  {
    id: 'info-list',
    name: 'Info list',
    aka: ['PowerPack Info List', 'UABB Info List', 'Elementor Icon List', 'icon list', 'steps list', 'process steps', 'vertical timeline', 'feature list'],
    summary:
      'Items with a marker (icon, image, number or dot), a title, a line of text and an optional link, stacked or inline in columns. With the connector the markers are joined by a line: a steps list or a vertical timeline. HTML and CSS only; there is no script.',
    pitch: 'Lay out your services, how you work step by step, or your story year by year, each with an icon or a number, in a list that reads on any screen.',
    // vertical timeline 500/mo, difficulty 21 (rising); icon list 660/45; timeline design website
    // 170/25 (SE Ranking US, 2026-09-23).
    search: { query: 'vertical timeline', alsoRanks: ['icon list', 'timeline design website'] },
    replaces: ['PowerPack “Info List” module (Beaver Builder)', 'UABB “Info List”', 'Elementor Icon List widget', 'hand-written icon lists'],
    goodFor: 'Services, “how it works”, process steps, milestones and feature lists.',
    notFor: 'Navigation (that is a menu) and long prose (write paragraphs).',
    props: [
      { name: 'items', type: 'InfoItem[]', note: '`{ title, text?, href?, icon?, iconLabel?, image?, imageAlt?, number?, meta? }`. `icon` is an inline SVG string; `number` overrides the position (“01”); `meta` is a small line above the title (a year, a duration).' },
      { name: 'layout', type: '“stack” | “inline”', default: '“stack”', note: 'Stack is one column, marker at the left. Inline is a grid of `columns`; where it has one column it is laid out as the stack.' },
      { name: 'marker', type: '“icon” | “image” | “number” | “dot” | “none”', default: '“icon”', note: 'What sits beside (or above) each title.' },
      { name: 'connector', type: 'boolean', default: 'false', note: 'A line between markers: vertical at the left, horizontal along a row when markers are on top. Makes the list an <ol>.' },
      { name: 'columns', type: 'number | { base?, md?, lg? }', default: '{ base: 1, md: 2, lg: 4 }', note: 'Inline only. 1–6 per breakpoint; md ≥ 48rem, lg ≥ 64rem (viewport). A missing breakpoint inherits the one below.' },
      { name: 'markerPosition', type: '“left” | “top”', default: 'left for stack, top for inline', note: 'Top applies where inline has more than one column.' },
      { name: 'headingLevel', type: '2 | 3 | 4 | 5', default: '3', note: 'Level of each title.' },
      { name: 'size', type: '“sm” | “md” | “lg”', default: '“md”', note: 'Marker size: 2.25, 3 or 4rem. A dot is 1rem.' },
      { name: 'class', type: 'string', note: 'Class on the list, for the host to theme it.' },
    ],
    theming: [
      { name: '--il-accent', fallback: '#3451b2', note: 'Default marker fill and dot ring. Map it to the host accent.' },
      { name: '--il-marker-bg', fallback: 'var(--il-accent)', note: 'Marker fill (for outline icons: a tint or transparent).' },
      { name: '--il-marker-fg', fallback: '#fff', note: 'Icon or number colour.' },
      { name: '--il-marker-size', fallback: 'by `size`', note: 'Marker box, any length.' },
      { name: '--il-marker-radius', fallback: '50%', note: 'Marker corners; 8px for rounded squares.' },
      { name: '--il-connector', fallback: 'rgb(0 0 0 / 0.18)', note: 'Connector colour.' },
      { name: '--il-connector-width', fallback: '2px', note: 'Connector thickness.' },
      { name: '--il-title / --il-text / --il-meta', fallback: 'inherit', note: 'Text colours.' },
      { name: '--il-gap / --il-col-gap', fallback: '1.75rem / 1.5rem', note: 'Space between rows / columns. The connector spans the row gap.' },
      { name: '--il-focus', fallback: 'currentColor', note: 'Focus ring around a linked item.' },
    ],
    a11y: [
      'A real list: <ol> when the order matters (connector or numbers), <ul> otherwise, with role="list" so Safari keeps announcing it with list-style removed.',
      'Each title is a heading at `headingLevel`. Numbers are real text, not generated content.',
      'A linked item is ONE link, the title, whose hit area is stretched over the item by a pseudo-element: a screen reader hears one link named by its title, and the focus ring outlines the whole item.',
      'Icons are decorative (aria-hidden) unless an item gives `iconLabel`; images take `imageAlt` (empty by default). The connector is CSS, not markup, so nothing extra is read.',
      'No script and no motion, so nothing to reduce and nothing to fail.',
    ],
    usage: `<!-- Services, stacked, icons -->
<InfoList items={[
  { title: 'Garden design', text: 'A plan drawn to scale.', href: '/design/', icon: leafSvg },
  { title: 'Lawn care', text: 'Mowing and feeding, March to November.', icon: sunSvg },
]} />

<!-- How it works: four across on desktop, a vertical steps list on a phone -->
<InfoList items={steps} layout="inline" marker="number" connector columns={{ base: 1, md: 2, lg: 4 }} />

<!-- A vertical timeline -->
<InfoList items={history.map((h) => ({ meta: h.year, title: h.title, text: h.text }))} marker="dot" connector />
<!-- .steps { --il-accent: var(--brand); --il-connector: var(--line); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/info-list/ (demo)' }],
    file: 'src/library/info-list/InfoList.astro',
    added: '2026-09-23',
  },
  {
    id: 'video-player',
    name: 'Video player',
    aka: ['PowerPack Video', 'UABB Video', 'Elementor Video', 'YouTube embed', 'Vimeo embed', 'video lightbox', 'lite YouTube embed'],
    summary:
      'A YouTube, Vimeo or self-hosted video behind your own poster and play button, in place or in a lightbox. Nothing is requested from YouTube or Vimeo until the button is pressed; then a privacy-enhanced iframe is created and focus moves into it.',
    pitch: 'Your video, your thumbnail, and nothing loads from YouTube until someone presses play.',
    // SE Ranking US, 2026-09-23: html5 video player 480/mo, difficulty 27 (appeared this year);
    // video player website 320/38; video lightbox 140/20; lite youtube embed 40/18.
    search: { query: 'html5 video player', alsoRanks: ['video lightbox', 'video player website', 'lite youtube embed'] },
    replaces: ['PowerPack / UABB / Elementor video modules', 'raw YouTube/Vimeo iframes', 'lite-youtube-embed', 'video lightbox plugins'],
    goodFor: 'A video people choose to watch: an explainer on a service page, a testimonial, a tour of the premises.',
    notFor: 'Ambient loops behind a hero (that is video-background) and autoplay with sound, which no page of ours ever does.',
    props: [
      { name: 'src', type: 'string | { src, type? }[]', note: 'A YouTube URL or id (watch, youtu.be, shorts, embed), a Vimeo URL or id (unlisted `/id/hash` kept), a .mp4/.webm URL, or sources in order of preference. Anything else fails the build with a sentence.' },
      { name: 'title', type: 'string', note: 'Required. Names the play button ("Play: <title>"), the iframe and the lightbox.' },
      { name: 'poster', type: 'string', note: 'Your thumbnail, served by your site. Required for YouTube and Vimeo (the build fails without it); for a file it is the <video> poster. Use the video’s aspect ratio.' },
      { name: 'posterAlt', type: 'string', default: '“Video: <title>”', note: 'Alt text of the poster image: what it shows.' },
      { name: 'posterFrom', type: "'youtube'", note: 'Only when the site has no image: uses YouTube’s thumbnail from i.ytimg.com, a third-party request at load (no cookie, but the visitor’s IP reaches Google).' },
      { name: 'caption', type: 'string', note: 'Text under the player (a credit, a transcript link). Makes the element a <figure>.' },
      { name: 'tracks', type: '{ src, srclang, label, kind?, default? }[]', note: 'Text tracks for a file; `kind` defaults to captions. Same-origin files. The build warns when a file has no captions track.' },
      { name: 'autoplayOnClick', type: 'boolean', default: 'true', note: 'Start playing when the button is pressed. False only reveals the player, so the visitor presses play twice.' },
      { name: 'muted', type: 'boolean', default: 'false', note: 'Start muted.' },
      { name: 'loop', type: 'boolean', default: 'false', note: 'Loop (YouTube as a one-item playlist).' },
      { name: 'start', type: 'number', default: '0', note: 'Start at this many seconds (YouTube `start`, Vimeo `#t=`, a media fragment on a file).' },
      { name: 'aspect', type: 'number | string', default: '16/9', note: 'Frame ratio: 1.7778, "16/9", "4 / 3", "9/16" for a Short.' },
      { name: 'lightbox', type: 'boolean', default: 'false', note: 'Play in a <dialog> over the page; the poster and button stay as the trigger.' },
      { name: 'playIcon', type: 'string', note: 'Inline SVG markup for the button’s icon (the “custom play button”). Use currentColor and 1em.' },
      { name: 'playLabel / closeLabel / watchLabel', type: 'string', default: '“Play” / “Close video” / “Watch “<title>””', note: 'Words, for a non-English site. playLabel prefixes the title in the button’s name; watchLabel is the no-JavaScript link.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme and size it.' },
    ],
    theming: [
      { name: '--vp-play-bg', fallback: 'rgb(0 0 0 / 0.7)', note: 'Play button circle.' },
      { name: '--vp-play-fg', fallback: '#fff', note: 'Play icon.' },
      { name: '--vp-play-size', fallback: '4.5rem', note: 'Diameter of the circle; the icon is 45% of it.' },
      { name: '--vp-overlay', fallback: 'rgb(0 0 0 / 0.12)', note: 'Tint over the poster (keeps a white icon readable on a light poster).' },
      { name: '--vp-radius', fallback: '0', note: 'Corner radius of the frame.' },
      { name: '--vp-bg', fallback: '#000', note: 'Frame colour behind the poster, the video and the letterbox.' },
      { name: '--vp-focus', fallback: '#fff', note: 'Focus ring on the play and close buttons (a dark halo sits outside it).' },
      { name: '--vp-caption', fallback: 'inherit', note: 'Caption text colour.' },
      { name: '--vp-backdrop', fallback: 'rgb(0 0 0 / 0.88)', note: 'Lightbox backdrop.' },
      { name: '--vp-close-bg', fallback: 'rgb(255 255 255 / 0.15)', note: 'Lightbox close button fill.' },
      { name: '--vp-close-fg', fallback: '#fff', note: 'Lightbox close icon.' },
    ],
    a11y: [
      'The play button is a real <button> named “Play: <title>”, over the whole poster; Tab reaches it and Enter or Space plays. The poster image has its own alt text.',
      'In place, focus moves into the player on play: the iframe (titled with the video’s title) or the <video>. The keyboard then drives the player itself.',
      'Self-hosted video keeps the browser’s native controls: keyboard operable, with a captions menu for `tracks`. A captions track is expected because a video with speech and no captions fails WCAG 1.2.2, and the build warns without one.',
      'Lightbox: a native modal <dialog> named with the title, so focus is trapped and Escape closes it; the close button is labelled and a backdrop click closes too. On open the video starts and focus goes to the close button, because a YouTube or Vimeo iframe keeps every key, Escape included; Tab moves on into the player. Closing removes the iframe or pauses the file, so sound never continues behind it, and returns focus to the play button. The page does not scroll underneath.',
      'Nothing plays until the visitor asks, so there is no autoplay to pause. prefers-reduced-motion only removes the play button’s hover growth.',
      'Without JavaScript a file plays through its native controls, and YouTube, Vimeo and the lightbox offer a plain link to watch the video where it lives.',
    ],
    usage: `<VideoPlayer
  src="https://www.youtube.com/watch?v=VIDEO_ID"
  title="How a site visit works"
  poster="/images/site-visit-poster.webp"
  caption="Two minutes, with captions."
/>

<VideoPlayer
  src={[{ src: '/video/tour.webm', type: 'video/webm' }, { src: '/video/tour.mp4', type: 'video/mp4' }]}
  title="A tour of the clinic"
  poster="/video/tour-poster.webp"
  tracks={[{ src: '/video/tour.en.vtt', srclang: 'en', label: 'English' }]}
  lightbox
/>
<!-- .video { --vp-play-bg: var(--brand); --vp-radius: var(--radius); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/video-player/ (demo)' }],
    file: 'src/library/video-player/VideoPlayer.astro',
    added: '2026-09-23',
  },
  {
    id: 'testimonial-carousel',
    name: 'Testimonial carousel',
    aka: ['testimonial slider', 'testimonial rotator', 'review scroller', 'reviews slider', 'Elementor Testimonial Carousel', 'Slick carousel', 'Owl Carousel testimonials', 'Strong Testimonials', 'rotating testimonials'],
    summary: 'A row of quote cards, all in the HTML, that scrolls and snaps by swipe, by arrows or on its own. Autoplay waits on each card for its reading time, holds on hover, stops once the visitor takes hold of the row, and has a visible pause button.',
    pitch: 'Let what your clients say move gently across the page, without anyone losing a quote halfway through reading it.',
    // 90/mo, difficulty 15; variants 90/21 and 50/9 (SE Ranking US, 2026-09-23). "review
    // carousel" shows 320/mo, but that volume is reviews of Carousel the musical and Sharp's
    // carousel microwave, not the element — do not move this page onto it.
    search: { query: 'testimonial carousel', alsoRanks: ['testimonial slider', 'testimonial rotator'] },
    replaces: ['Elementor Pro “Testimonial Carousel” widget', 'Slick and Owl Carousel testimonial sliders', 'Strong Testimonials and similar WordPress plugins', 'Beaver Builder and UABB testimonials modules'],
    goodFor: 'Five to fifteen testimonials or reviews you want read, short and long mixed, on a home page or a service page.',
    notFor: 'A live feed of Google or Tripadvisor reviews: this shows what you give it and fetches nothing. And two or three quotes, which read better side by side.',
    props: [
      { name: 'items', type: '{ quote, name, meta? }[]', note: 'The cards, in order. `name` as the person agreed to be named; `meta` is a second line, such as the service and date.' },
      { name: 'label', type: 'string', default: '“N testimonials, scroll sideways for more”', note: 'Accessible name of the row. Say how many and that it scrolls.' },
      { name: 'autoplay', type: 'boolean', default: 'true', note: 'Move on its own. Off leaves a swipeable row with arrows and no pause button.' },
      { name: 'minDwell', type: 'number', default: '7000', note: 'The least time (ms) the row waits on a card, however short the quote.' },
      { name: 'wordsPerMinute', type: 'number', default: '200', note: 'Reading pace. A card waits its reading time plus 2 s, so long quotes hold the row longer.' },
      { name: 'pauseLabel / playLabel', type: 'string', default: '“Pause the testimonials” / “Play …”', note: 'Names of the play/pause button in each state.' },
      { name: 'prevLabel / nextLabel', type: 'string', default: '“Previous testimonials” / “Next …”', note: 'Names of the arrows.' },
      { name: 'slot "heading"', type: 'markup', note: 'The section heading, set on the same row as the controls.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--tc-gap', fallback: 'clamp(1rem, 0.7rem + 1.4vw, 1.6rem)', note: 'Space between cards.' },
      { name: '--tc-card-bg', fallback: '#fff', note: 'Card fill. A translucent mix over a patterned band works if the text still clears 4.5:1.' },
      { name: '--tc-card-border', fallback: '#e4e4e7', note: 'Card edge and the rule above the byline.' },
      { name: '--tc-card-shadow', fallback: '0 1.2rem 2.6rem -1.4rem rgb(0 0 0 / 0.28)', note: 'Card depth. The track is padded so it is not clipped.' },
      { name: '--tc-radius', fallback: '14px', note: 'Card corners.' },
      { name: '--tc-ink', fallback: 'inherit', note: 'Quote and name.' },
      { name: '--tc-muted', fallback: '#5b6472', note: 'The meta line. Must clear 4.5:1 on the card.' },
      { name: '--tc-quote-font', fallback: 'inherit', note: 'Typeface of the quote, often the display face.' },
      { name: '--tc-accent', fallback: 'currentColor', note: 'The opening quotation mark. Decorative, so no contrast duty.' },
      { name: '--tc-control-bg', fallback: '#fff', note: 'Button fill.' },
      { name: '--tc-control-fg', fallback: '#1d2320', note: 'Button glyph.' },
      { name: '--tc-control-border', fallback: '#5b6472', note: 'Button ring: the control’s only edge, so it needs 3:1.' },
      { name: '--tc-control-hover', fallback: '#1e76aa', note: 'Ring and glyph on hover.' },
      { name: '--tc-focus', fallback: 'currentColor', note: 'Focus rings on the buttons and the row.' },
    ],
    a11y: [
      'Every card is in the HTML as a list item: a figure with a blockquote and a figcaption. Without JavaScript it is a swipeable, scroll-snapping row and nothing is hidden, from readers or from search.',
      'WCAG 2.2.2: a visible, 44 px play/pause button sits with the arrows whenever the row can move. Its name says what it will do.',
      'The autoplay never takes a quote from someone reading it: each card waits its reading time (never under 7 s), a hovering mouse holds the row, and it moves one card at a time.',
      'Taking hold of the row stops it until Play is pressed — an arrow, a swipe or click in the row, a sideways wheel, or keyboard focus anywhere in it except the play button. That is the WAI-ARIA carousel pattern.',
      'The row is focusable and named, so a keyboard can scroll it with the arrow keys. The arrows use aria-disabled at the ends, so focus is not dropped when a button stops working.',
      'prefers-reduced-motion (tracked live): no autoplay, no play button, and the arrows jump instead of gliding. It also stops while off screen and in hidden tabs.',
    ],
    usage: `---
import TestimonialCarousel from '../components/TestimonialCarousel.astro';
import { testimonials } from '../data/testimonials';   // [{ quote, name, meta }]
---
<section class="band">
  <TestimonialCarousel class="reviews" items={testimonials}>
    <h2 slot="heading">In their words</h2>
  </TestimonialCarousel>
</section>
<!-- .reviews { --tc-accent: var(--teal); --tc-quote-font: var(--font-display); --tc-focus: var(--teal-deep); } -->`,
    usedOn: [
      { site: 'nicolelawton.com', where: 'Home, "In their words" (her own copy, pre-launch on nicolelawton.gohero.us); the reading-time dwell was built for it' },
      { site: 'jwalktours.com', where: 'Home and tour pages, as ReviewScroller: the earlier version, with a fixed 5 s interval' },
    ],
    file: 'src/library/testimonial-carousel/TestimonialCarousel.astro',
    added: '2026-09-23',
  },
  {
    id: 'icon',
    name: 'Icon library',
    aka: ['Font Awesome', 'icon picker', 'icon search', 'Beaver Builder icon', 'UABB icon', 'Elementor icon widget', 'SVG icon'],
    summary: 'One glyph from Font Awesome Free, inlined as a single SVG at build. No icon font, no CSS sprite, no client-side JavaScript.',
    pitch: 'Find the icon, copy its name, put it in a request — it arrives as one crisp inline SVG, not a 300 KB font.',
    // SE Ranking US, 2026-09-23: icon picker 140/mo diff 6; icons for website design 260/27;
    // icon search 320/39; website icons 330/39. "icon library" itself is 1,900/71 — out of
    // reach for a page this size, so it stays an aka rather than the target.
    search: { query: 'icon picker', alsoRanks: ['icons for website design', 'icon search', 'website icons'] },
    replaces: ['Font Awesome as a web font (the whole set on every page)', 'icon fonts', 'page-builder icon modules'],
    goodFor: 'A glyph next to text, in a button, or standing alone: navigation, feature lists, contact details, social links, icon-only buttons (with `label` set).',
    notFor: 'Illustrations and logos — an icon is a glyph, not artwork. And any Pro-only style or glyph: ask for it by name and we license and embed it directly in that site, never here.',
    props: [
      { name: 'name', type: 'string', note: 'Font Awesome Free icon name, kebab-case: "house", "user", "phone-volume". Required.' },
      { name: 'style', type: '"solid" | "regular" | "brands"', default: 'solid', note: 'Free ships exactly these three styles, and not every icon has all three.' },
      { name: 'size', type: 'string', default: '1em', note: 'Any CSS length. The icon is a square of this size.' },
      { name: 'label', type: 'string', note: 'Accessible name. Without it the icon is decorative (aria-hidden), which is right for most uses since the text beside it already carries the meaning. Set it when the icon is the only content that does, such as an icon-only button.' },
      { name: 'title', type: 'string', note: 'Optional native tooltip text (an SVG <title>), independent of `label`.' },
      { name: 'class', type: 'string', note: 'Class on the <svg>, for the host to size or theme it further.' },
    ],
    theming: [{ name: '--ic-color', fallback: 'currentColor', note: 'Icon colour. Most call sites need none of this: the icon already follows the surrounding text colour.' }],
    a11y: [
      'Decorative by default: no `label` means `aria-hidden="true"`, because most icons sit beside text that already says what they mean.',
      'With `label`, the icon gets `role="img"` and that exact text as its accessible name — set it whenever the icon is the only content conveying meaning, such as an icon-only button.',
      '`focusable="false"` always, so the SVG never becomes a stray tab stop in Safari or older Edge.',
      'An unknown `name` or `style` fails the build, with the three nearest names by edit distance, rather than shipping a blank icon.',
    ],
    usage: `<Icon name="house" />                                   <!-- decorative, next to "123 Main St" -->
<Icon name="trash-can" style="regular" label="Delete" />    <!-- icon-only button: label is required -->
<Icon name="truck" size="1.5em" class="hero__icon" />

<!-- In a request: "Put icon: solid truck next to the delivery line." -->`,
    license:
      "Every icon here is Font Awesome Free, CC BY 4.0 — its own attribution comment travels inside each SVG, exactly as Font Awesome ships it. Want a thin, light, sharp or duotone version, or a glyph that's Pro-only? Browse the full set at fontawesome.com/search and send us the name: Font Awesome's Pro license lets us embed those icons only in the sites we build for our clients, never hand them over as files or carry them in a public gallery like this one, so Pro icons never appear here — only in your own site, once you've asked for one by name.",
    usedOn: [{ site: 'superherotech.ai', where: '/elements/icon/ (gallery)' }],
    file: 'src/library/icon/Icon.astro',
    added: '2026-09-23',
  },
  {
    id: 'animated-text',
    name: 'Animated text',
    aka: ['animated headline', 'Elementor Animated Headline', 'text rotator', 'word rotator', 'rotating text', 'typewriter effect', 'typing animation', 'Typed.js', 'fancy text', 'word reveal', 'highlighted headline'],
    summary:
      'One line of text in one of six effects: build (word by word), typewriter, rotate (one slot turns over), distil (words fall away to a shorter phrase), highlight (a marker or underline sweeps), strike (a word is struck and replaced). Speed, cadence, hold, repeat, entrance and type are set per use. Nothing reflows, a screen reader hears the sentence once, and it rests whole under reduced motion or with no script.',
    pitch: 'Let your most important line arrive the way you would say it out loud, in your own type and at your own pace.',
    // 90/mo, difficulty 20; "html text animation" 90/24, "animated text html" 90/22 (SE Ranking US,
    // 2026-09-23). Google's first page for it is galleries of examples (Prismic's CSS text
    // animations, CodePen, Moving Letters), which is what this page is. The bigger queries are
    // not this element: "text animation" 1,600/62 and "animated text" 920/32 are Premiere Pro,
    // iPhone message effects and GIF makers (9 of the top 10 for "animated text" are generators
    // or video templates); "typewriter effect" 320 is After Effects and Instagram stories;
    // "rotating words" is rotating text in Microsoft Word. The web-intent queries with volume
    // are typewriter only ("typing text animation" 480/22, up from 260 a year ago; "css typing
    // animation" 390/32), so they are alsoRanks, not the title of a page that shows six effects.
    search: { query: 'text animation html', alsoRanks: ['typing text animation', 'css typing animation', 'animated text html'] },
    replaces: [
      'Elementor Pro “Animated Headline” widget (its highlighted and rotating modes)',
      'Typed.js and TypeIt typing effects',
      'UABB “Fancy Text” and PowerPack “Animated Headlines” (Beaver Builder)',
      'text-rotator and animated-headline WordPress plugins',
    ],
    goodFor:
      'The one line that carries a page or a band: a tagline, a promise, a mantra. Highlight suits a first-screen headline because it is readable from the first frame; the other five suit a line the visitor meets after it.',
    notFor:
      'Body copy, anything a visitor must read to act (a price, an instruction), or more than one on a screen. Not the first screen’s h1 in build, typewriter or distil: they start invisible, which delays the moment it can be read and the page’s Largest Contentful Paint. Typewriter splits letters, so not for scripts that join them (Arabic, Devanagari).',
    props: [
      { name: 'effect', type: `'build' | 'typewriter' | 'rotate' | 'distil' | 'highlight' | 'strike'`, default: `'build'`, note: 'Which of the six.' },
      { name: 'text', type: 'string', note: 'The words, with marks as the effect needs: `|` between parts (build, distil) or lines (typewriter); `[…]` round the words that fall away (distil); `{a|b|c}` the slot (rotate); `{…}` the marked words (highlight); `{old|new}` the change (strike). A missing mark is a build error that says which.' },
      { name: 'as', type: `'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div'`, default: `'p'`, note: 'The element the text is. Semantics only: the type comes from `--at-*` or where it sits, not the host’s heading rules.' },
      { name: 'speed', type: 'number', default: 'per effect', note: 'How long one piece takes to arrive (ms): build 700, rotate 600, distil 900, highlight 900, strike 600. For typewriter, ms per letter (60), deleting at twice that pace.' },
      { name: 'gap', type: 'number', default: 'per effect', note: 'The cadence (ms). Build and distil: from one piece starting to the next (build 160 by word, 900 by part; distil 1000). Rotate and typewriter: how long each option or line rests (2200, 1800). Highlight: before each mark (1200). Strike: from the strike to the replacement (900).' },
      { name: 'hold', type: 'number', default: 'per effect', note: 'How long the finished line holds before it goes round again (ms). Distil 10000, rotate 2200, typewriter 1800, others 6000. Only matters when it repeats.' },
      { name: 'repeat', type: `'once' | 'loop' | number`, default: `'loop' for rotate and typewriter, else 'once'`, note: 'A single run ends in its finished state and stays there. A number runs that many times.' },
      { name: 'entrance', type: `'rise' | 'fade' | 'blur'`, default: `'rise', or 'fade' for distil`, note: 'How pieces arrive in build and distil, and how rotate’s options change: a small rise, a plain fade, or out of a blur into focus.' },
      { name: 'mark', type: `'marker' | 'underline'`, default: `'marker'`, note: 'Highlight only: a fill behind the words (`--at-mark`) or a line under them (`--at-accent`).' },
      { name: 'pause', type: `'visible' | 'focus'`, default: `'visible'`, note: 'The pause button, for anything that loops or runs past 5 s. `focus` shows it only on keyboard focus, like a skip link (see Accessibility for the trade-off).' },
      { name: 'label', type: 'string', note: 'What assistive technology reads instead of the defaults, e.g. “We sell outcomes, not software.” for a strike.' },
      { name: 'pauseLabel / playLabel', type: 'string', default: '“Pause the animation” / “Play …”', note: 'Names of the button in each state.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, to theme and space it. The text element has no margin of its own.' },
    ],
    theming: [
      { name: '--at-font', fallback: 'inherit', note: 'Typeface. The type comes from here or from where the element sits, never from the host’s h1/h2 rules.' },
      { name: '--at-size', fallback: 'inherit', note: 'Size. For a looping line, size it by its widest state so it fits a 320 px phone: Nicole’s is clamp(1.4rem, 7.6vw, 3.4rem).' },
      { name: '--at-weight', fallback: 'inherit', note: 'Weight.' },
      { name: '--at-line-height', fallback: 'inherit', note: 'Line height.' },
      { name: '--at-tracking', fallback: 'inherit', note: 'Letter spacing.' },
      { name: '--at-ink', fallback: 'inherit', note: 'Text colour.' },
      { name: '--at-align', fallback: 'inherit', note: 'Alignment.' },
      { name: '--at-slot-display', fallback: 'inline-grid', note: 'Rotate’s slot. `grid` gives it a line of its own (“We build” / “websites”), which a centred headline wants.' },
      { name: '--at-slot-align', fallback: 'start', note: 'Where each option sits in the slot, which is as wide as the widest: `start` for a slot at the end of a line, `center` for a slot on its own line.' },
      { name: '--at-wrap', fallback: 'normal', note: 'white-space. `nowrap` keeps a line whole, as distil usually wants.' },
      { name: '--at-accent', fallback: 'currentColor', note: 'The caret, the underline and the strike line.' },
      { name: '--at-mark', fallback: 'rgb(255 205 0 / 0.45)', note: 'Highlight’s marker. The text must still clear 4.5:1 on it.' },
      { name: '--at-control-fg / --at-control-bg / --at-control-border', fallback: 'inherit / transparent / currentColor', note: 'The pause button. With `pause="focus"` its fill falls back to Canvas, because it then sits over whatever follows.' },
      { name: '--at-focus', fallback: 'currentColor', note: 'The pause button’s focus ring.' },
      { name: '--at-pause-align', fallback: 'flex-end', note: 'Where the visible pause button sits under the text: flex-start, center or flex-end.' },
    ],
    a11y: [
      'A screen reader hears the whole sentence once and nothing while it moves: the DOM text never changes, only opacity and position. Build, distil and highlight are plain text. Typewriter’s letters are hidden from assistive technology and its lines given once in a visually hidden copy; rotate’s slot reads as its options joined (“websites, online shops, and booking pages”); strike’s change reads as the replacement. `label` substitutes a sentence of your own.',
      'WCAG 2.2.2: anything that loops or runs past five seconds gets a pause button, visible by default, named for what it will do. `pause="focus"` keeps it in the page but shows it only on keyboard focus: keyboard and screen-reader visitors can stop it, but a mouse or touch visitor who has not set reduced motion cannot. That is a choice to make with the client (Nicole made it), not a default.',
      'prefers-reduced-motion (tracked live), no JavaScript, or paused: one still, complete state — the whole phrase, the first line or option, the marks drawn, the strike made — and no button.',
      'No flashing (WCAG 2.3.1): fades, slides and sweeps only. The typewriter caret blinks about once a second, and only while it rests.',
      'It runs only while 60% on screen and the tab is visible, and starts after web fonts have loaded. Nothing reflows while it runs, so nothing near it moves either.',
    ],
    usage: `---
import AnimatedText from '../components/AnimatedText.astro';
---
<!-- Nicole Lawton's band, as this element: distil, looping, the button on keyboard focus only -->
<AnimatedText class="letgo" effect="distil" text="[Let] Go. | [Let] Be. | [Let] Me." repeat="loop" pause="focus" />
<!-- .letgo { --at-font: var(--font-display); --at-size: clamp(1.4rem, 7.6vw, 3.4rem); --at-wrap: nowrap; --at-align: center; } -->

<AnimatedText as="h2" effect="rotate" text="We build {websites|online shops|booking pages}" />
<AnimatedText effect="typewriter" text="Book a call.|Ask a question.|See the work." speed={45} />
<AnimatedText as="h1" effect="highlight" text="Every page {one click} from the header." mark="underline" />
<AnimatedText effect="strike" text="We sell {software|outcomes}." label="We sell outcomes, not software." />`,
    usedOn: [
      { site: 'nicolelawton.com', where: 'Home, the "Let Go. Let Be. Let Me." band over the deep water (pre-launch on nicolelawton.gohero.us). It is the distil original, LetGo.astro, built before this element and not yet swapped for it' },
      { site: 'superherotech.ai', where: '/elements/animated-text/ (demo): all six effects' },
    ],
    file: 'src/library/animated-text/AnimatedText.astro',
    added: '2026-09-23',
  },
  {
    id: 'cookie-consent',
    name: 'Cookie consent',
    aka: ['CookieYes', 'Cookiebot', 'Complianz', 'GDPR Cookie Consent', 'cookie banner', 'consent bar', 'consent mode'],
    summary: 'A consent bar and the Google Tag Manager loader it gates. Opt-out mode (the default) loads analytics until the visitor declines; opt-in loads nothing from Google until they accept; visitors whose browser time zone is in the EEA, UK or Switzerland get opt-in whichever mode is set. Decline stops GA and deletes the cookies it already wrote. Synced from ecropolis-consent, never edited here.',
    pitch: 'A consent bar that is yours: no monthly CMP fee, nothing loads from Google until the visitor has said yes where the law needs a yes.',
    // 880/mo, difficulty 34, CPC $13; variants "cookie consent" 660/47, "gdpr cookie consent"
    // 390/43, "cookie consent wordpress" 170/30 (SE Ranking US, 2026-09-23).
    search: { query: 'cookie banner', alsoRanks: ['cookie consent', 'gdpr cookie consent', 'cookie consent wordpress'] },
    replaces: [
      'CookieYes / Cookiebot / Complianz subscriptions',
      'Osano',
      'Termly',
      'A hand-written cookie banner that loads Google Analytics before the visitor clicks anything: it asks, but the tracking has already happened',
    ],
    goodFor:
      'A site that runs Google Analytics, or anything else, through Google Tag Manager and wants the consent choice on its own page, in its own colours, with no subscription. In opt-out mode US visitors are measured until they decline; with strictRegions on (the default), visitors in EEA, UK and Swiss time zones get prior consent, so nothing is fetched from Google until they accept. That region test reads the browser’s time zone: no IP lookup, no network call, and a VPN or a traveller can be misread either way.',
    notFor:
      'A site that sets no cookies and loads no third-party tags. It needs no banner at all: leave gtmId empty and this renders nothing. Its job is gating Tag Manager, not decoration. Also not for sites that need per-category toggles, a stored consent log to show an auditor, or IAB TCF signals for ad networks: it is one yes-or-no for analytics, with ad storage denied unless enableAds is set. It does not make a site compliant by itself. It implements prior consent where that is required; the privacy policy, and what the site promises in it, are the site owner’s.',
    props: [
      { name: 'gtmId', type: 'string', default: "''", note: 'Tag Manager container. Empty renders nothing at all: no bar, no script, no cookies.' },
      { name: 'gaMeasurementId', type: 'string', default: "''", note: 'GA4 id. On decline sets GA’s own ga-disable-<id> kill switch, because Consent Mode denial alone still sends cookieless pings.' },
      { name: 'mode', type: "'opt-out' | 'opt-in'", default: "'opt-out'", note: 'opt-out loads analytics until declined; opt-in loads nothing from Google until accepted.' },
      { name: 'strictRegions', type: 'boolean', default: 'true', note: 'Forces opt-in for EEA, UK and Swiss time zones whatever `mode` says, and when the zone cannot be read. Leave it on.' },
      { name: 'copy', type: "Partial<Record<mode, { text?, accept? }>>", default: '{}', note: 'Per-mode wording of the bar and the accept label (OK in opt-out, Accept in opt-in). Use it rather than editing the file.' },
      { name: 'storageKey', type: 'string', default: "'cc_consent'", note: 'localStorage key for the choice. Always pass the site’s own; changing it resets every stored choice.' },
      { name: 'privacyHref', type: 'string', default: "'/privacy'", note: 'The Privacy Policy link in the bar.' },
      { name: 'conversions', type: '{ match, event }[]', default: '[]', note: 'Clicks on links whose href contains `match` push `event` to the dataLayer. Elements with data-analytics push their own.' },
      { name: 'enableAds', type: 'boolean', default: 'false', note: 'Grant ad storage, ad user data and personalisation on accept. Off: analytics only.' },
    ],
    theming: [
      { name: '--cc-bg', fallback: '#eef2f1', note: 'Bar ground: a tint, not white.' },
      { name: '--cc-border', fallback: '#cfdad7', note: 'Bar edge and the Decline outline.' },
      { name: '--cc-text', fallback: '#4c5a60', note: 'Body copy at 13.5px: needs 4.5:1 on --cc-bg (default 6.33:1).' },
      { name: '--cc-ink', fallback: '#1d2b30', note: 'Decline label and its hover border.' },
      { name: '--cc-link', fallback: '#1f4f55', note: 'Privacy Policy link.' },
      { name: '--cc-accent', fallback: '#1f4f55', note: 'Accept/OK fill. Needs 4.5:1 against --cc-accent-ink (default 9.10:1): use the site’s dark surface tone, not its CTA colour.' },
      { name: '--cc-accent-hover', fallback: '#143a3f', note: 'Accept/OK hover fill.' },
      { name: '--cc-accent-ink', fallback: '#fff', note: 'Accept/OK label.' },
      { name: '--cc-shadow', fallback: '0 14px 40px rgba(16, 32, 36, .18)', note: 'Bar shadow.' },
      { name: '--cc-font', fallback: 'inherit', note: 'Bar typeface.' },
      { name: '--cc-radius', fallback: '14px', note: 'Bar corners. Square below 560px, where the bar spans the screen.' },
      { name: '--cc-radius-btn', fallback: '10px', note: 'Button corners.' },
    ],
    a11y: [
      'Decline and Accept are native buttons, so Enter and Space work, and each is at least 44px tall. Below 560px they share the full width.',
      'The bar is a non-modal dialog named “Cookie consent”. It does not take focus or trap it, and the page stays usable while it is open. Sites mount it at the end of the body, so keyboard users reach it after the page content.',
      'It stays hidden (the hidden attribute) until the script has chosen the wording for the visitor’s mode, and is hidden again after a choice, so a screen reader never reads a bar that is not on screen.',
      'Any element with data-cc-reopen (the “Cookie settings” link in a site’s footer) opens it again, so the choice can be changed at any time. There is no Escape shortcut: the choice is made with the buttons.',
      'No movement: only 0.15s colour transitions on hover. Default text and button colours clear 4.5:1; a site that themes it must keep them there.',
    ],
    usage: `---
// src/layouts/BaseLayout.astro, as on superherotech.ai. Do not copy CookieConsent.astro by hand:
// add the site to sites.json in ecropolis/ecropolis-consent, then
//   node bin/consent-sync.mjs update <site>
import CookieConsent from '../components/CookieConsent.astro';
import { analytics } from '../data/site';
---
<body>
  <slot />
  <!-- in the footer, only when there is a choice to change -->
  {analytics.gtmId && <a href="/privacy/" data-cc-reopen>Cookie settings</a>}

  <CookieConsent
    gtmId={analytics.gtmId}
    gaMeasurementId={analytics.ga4Id}
    mode={analytics.consentMode}
    strictRegions={analytics.strictRegions}
    storageKey={analytics.consentKey}
    privacyHref="/privacy"
  />
</body>
<!-- global.css: :root { --cc-bg: var(--tint); --cc-accent: var(--navy); --cc-font: var(--font); … } -->
<!-- The bar assumes the usual *, *::before, *::after { box-sizing: border-box } reset; without it,
     the full-width phone layout runs off the right edge. -->
<!-- Switching mode makes the privacy policy wrong until it is edited too: ship both together. -->`,
    usedOn: [
      { site: 'ecropolis.com', where: 'Every page' },
      { site: 'growgrid.io', where: 'Every page' },
      { site: 'superherotech.ai', where: 'Every page, with “Cookie settings” in the footer; and the demo on /elements/cookie-consent/' },
      { site: 'compass.st', where: 'Every page' },
      { site: 'zingfling.com', where: 'Every page' },
      { site: 'vendorstreet.app', where: 'Every page' },
      { site: 'apothecary.st', where: 'Every page' },
    ],
    file: 'src/library/cookie-consent/CookieConsent.astro',
    source: { repo: 'ecropolis/ecropolis-consent', sync: 'node bin/consent-sync.mjs update <site>' },
    added: '2026-09-23',
  },
  {
    id: 'animated-background',
    name: 'Animated background',
    aka: ['Vanta.js', 'Vanta backgrounds', 'UABB Animated Background', 'PowerPack animated background', 'animated hero background', 'waves background', 'fog background', 'birds background'],
    summary:
      'A moving background behind a hero: waves, cells, fog, rings, bubbles, birds, snow, a breathing halo, or a scrolling texture. One 2D canvas (or, for the scrolling ones, CSS alone) in one file, with no WebGL and no dependency. Still under reduced motion, below `minWidth` or with `motion="off"`; paused off screen and in hidden tabs; one per page.',
    pitch: 'The moving hero background people ask for — waves, cells, fog, birds — in one small file, no WebGL, and it holds still for anyone who asked for less motion.',
    // 260/mo, difficulty 22; "website background animation" 260/22, "css animated background"
    // 320/30, "vanta js" 320/14 (SE Ranking US, 2026-09-24). "animated background" 6,600/71
    // is out of reach (wallpapers and video), so it stays in aka. "vanta js" is people looking
    // for exactly this: the Vanta looks without three.js, which the page says plainly.
    search: { query: 'animated website background', alsoRanks: ['website background animation', 'css animated background', 'vanta js'] },
    replaces: ['Vanta.js + three.js (≈600 KB, WebGL)', 'UABB / PowerPack animated background rows', 'video loops used for ambience'],
    goodFor: 'A hero band, or a section divider on a brand with room for motion.',
    notFor:
      'Under body text; more than one per page (the second instance draws only its still frame and warns: two moving layers fight for attention and for the main thread); a page that already has video-background or particle-field; and any look that needs dots joined by lines — that is particle-field.',
    props: [
      { name: 'preset', type: "'waves' | 'cells' | 'fog' | 'rings' | 'bubbles' | 'birds' | 'snow' | 'halo' | 'scroll-x' | 'scroll-y'", default: "'waves'", note: 'The look. The first eight are drawn on one canvas; scroll-x and scroll-y are CSS only (a tiling texture moving on a keyframe). Watched live as `data-preset`, so a picker can swap it.' },
      { name: 'palette', type: "'superhero' | 'custom'", default: "'superhero'", note: 'superhero pins the house purple, ink and white on the element; custom reads the host’s `--ab-a/b/c`, with the same fallbacks.' },
      { name: 'intensity', type: "'low' | 'medium' | 'high'", default: "'medium'", note: 'Element count, amplitude and pace: 0.6×, 1×, 1.6×. High on a canvas larger than 800×450 drops itself to 30 fps if a frame costs more than about 12 ms (measured, logged once).' },
      { name: 'speed', type: 'number', default: '1', note: 'Multiplier on the preset’s own pace; the scroll presets take 40 s per tile at 1.' },
      { name: 'minWidth', type: 'number', default: '700', note: 'Below this viewport width the still frame is drawn and nothing animates. 0 animates everywhere. Tracked live.' },
      { name: 'motion', type: "'auto' | 'off'", default: "'auto'", note: 'off draws the still frame always; such an instance does not count against one-per-page.' },
      { name: 'pointer', type: "'drift' | 'repel' | 'none'", default: "'drift'", note: 'How the canvas presets answer the mouse: waves lean and swell toward its x, cells and bubbles lean in or away, fog slides in parallax, rings and the halo centre trail it, birds are drawn or scattered, snow gusts with a sweep. Fine pointers only (hover + pointer: fine), never on touch; no reaction under reduced motion, with motion="off" or below minWidth. Listeners sit on the host, the canvas keeps pointer-events: none. The scroll presets do not react.' },
      { name: 'texture', type: 'string', note: 'scroll-x / scroll-y only: URL of the host’s own square, seamlessly tiling image, drawn at 512 px, in place of the generated one. Never a client image on a shared page.' },
      { name: 'class', type: 'string', note: 'Class for the host to position and stack it with.' },
    ],
    theming: [
      { name: '--ab-a', fallback: '#5933d8', note: 'First palette stop: the body of waves and cells, the fog’s midtone, the glow, a third of the birds, the scroll texture.' },
      { name: '--ab-b', fallback: '#1e283c', note: 'Second stop: the deep end of waves and cells, the fog’s lowlight.' },
      { name: '--ab-c', fallback: '#fff', note: 'Third stop: highlights, bubbles, snow, rings, the rest of the birds, the scroll presets’ fine layer.' },
      { name: '--ab-bg', fallback: 'transparent', note: 'Base fill under the drawing. Leave transparent when the host has its own background layer.' },
      { name: '--ab-opacity', fallback: '1', note: 'Opacity of the whole layer, the easy way to sit it further behind the copy.' },
    ],
    a11y: [
      'Decorative: aria-hidden, no pointer events, nothing announced.',
      'The pointer reaction is decorative and never required to reach any content; it is off on touch screens and in every still state.',
      'prefers-reduced-motion (tracked live): one still frame is drawn and the frame loop stops; the CSS presets pause their keyframe. The look survives without the movement.',
      'Pauses while off screen and while the tab is hidden; one requestAnimationFrame loop capped at 60 fps.',
      'Nothing flashes: every preset moves slowly and fades; no strobing (WCAG 2.3.1).',
      'Removed from the page (Astro view transitions, SPA swaps), it cancels its frame and frees its canvas: it is a custom element with a disconnectedCallback.',
    ],
    usage: `<section class="hero">          <!-- position: relative; isolation: isolate; pointermove is read here -->
  <img class="hero__bg" … />        <!-- z-index: -1 -->
  <AnimatedBackground preset="fog" pointer="repel" class="hero__motion" />   <!-- z-index: 1, via :global() if the host scopes styles -->
  <div class="hero__copy">…</div>   <!-- position: relative; z-index: 2 -->
</section>
<!-- .hero { --ab-a: var(--brand); --ab-b: var(--brand-dark); --ab-c: var(--white); } with palette="custom" -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/animated-background/ (demo)' }],
    file: 'src/library/animated-background/AnimatedBackground.astro',
    added: '2026-09-24',
  },
  {
    id: 'modal',
    name: 'Modal box',
    aka: ['PowerPack Modal Box', 'UABB Modal Popup', 'Elementor Popup', 'popup', 'lightbox', 'exit-intent popup', 'OptinMonster'],
    summary:
      'A native <dialog> over the page, opened by any element with data-modal-open, by a #<id> link, or (opt-in) after a delay, a scroll depth or exit intent. Focus trapped, Escape and backdrop close it, focus returns to the opener, the page does not scroll underneath. Automatic opens wait for 3 s of visible time and for the consent bar, happen once per page view across all modals, and are remembered per session or per visitor.',
    pitch: "A box that opens when it is asked for — a click, a scroll, a hand leaving for the tab bar — and stays gone once it's been closed.",
    // SE Ranking US, 2026-09-24: website popup 170/mo, difficulty 24; modal popup 390/46;
    // html modal 590/47; exit intent popup 320/52. The higher-volume three are harder; the page
    // is written for "website popup" and should pick them up as variants.
    search: { query: 'website popup', alsoRanks: ['modal popup', 'html modal', 'exit intent popup'] },
    replaces: ['PowerPack / UABB / Elementor popup modules', 'OptinMonster and popup plugins', 'Magnific Popup / Fancybox for content'],
    goodFor:
      'Something the visitor asked for: a form behind a “Get a quote” button, a video or a large image on request, a link in an email that opens the offer (#<id>). Or one offer after real engagement: half the page read, or a mouse heading for the tab bar. A popup is a tool with a cost, so use it where the content is worth the interruption.',
    notFor:
      'Opening on arrival. A popup that covers the content the moment the page loads is what put popups out of favour: people leave, and Google’s guidance on intrusive interstitials says a mobile page whose content is blocked on arrival can rank lower. That is why automatic opens here wait for 3 s of visible time at the least. Also not for every page, not for more than one automatic popup per page (the element opens only the first anyway), and not for content people need in order to use the page, which belongs on the page. Exit intent works with a mouse or trackpad only: on a phone or tablet it never fires, so a mobile audience needs a scroll or delay trigger or none.',
    props: [
      { name: 'id', type: 'string', note: 'Required. The dialog’s id: any element with data-modal-open="<id>" opens it, and with openOnHash so does #<id> in the URL.' },
      { name: 'title', type: 'string', note: 'Required. The dialog’s accessible name, shown as its heading (aria-labelledby).' },
      { name: 'hideTitle', type: 'boolean', default: 'false', note: 'Hide the heading visually; it still names the dialog. For an image or a video that speaks for itself.' },
      { name: 'size', type: "'sm' | 'md' | 'lg' | 'full'", default: "'md'", note: 'Max width 24rem, 36rem, 56rem, or the whole viewport with no corners.' },
      { name: 'closeLabel', type: 'string', default: '“Close”', note: 'Name of the close button.' },
      { name: 'delay', type: 'number (ms)', note: 'Open this long after load. Combinable with scroll and exit: the first to fire opens it.' },
      { name: 'scroll', type: 'number (0–100)', note: 'Open once this percent of the page has been scrolled. A page too short to scroll counts as 100.' },
      { name: 'exit', type: 'boolean', default: 'false', note: 'Open when the pointer leaves through the top edge. Only where the primary pointer is a mouse or trackpad; never on touch.' },
      { name: 'openOnHash', type: 'boolean', default: 'false', note: 'Open when the URL is …#<id>, on load and on hashchange: a link in an email. Treated as a request: no dwell, no memory. The hash is removed on close.' },
      { name: 'once', type: "'session' | 'visitor' | 'never'", default: "'session'", note: 'How long an automatic open is remembered: this browser session, this browser for good (localStorage), or not at all. A modal the visitor closed never comes back by itself in the same session, whatever this says.' },
      { name: 'key', type: 'string', default: '“modal:<id>”', note: 'The storage key of that memory.' },
      { name: 'version', type: 'string', default: '“1”', note: 'Change it when the offer changes, and people who closed the old one see the new one.' },
      { name: 'closeOnBackdrop', type: 'boolean', default: 'true', note: 'Close on a click outside the box. Turn off for a long form someone could lose with a stray click.' },
      { name: 'minDwell', type: 'number (ms)', default: '3000', note: 'Visible time before any automatic open. Time in a background tab does not count.' },
      { name: 'class', type: 'string', note: 'Class on the <dialog>, for the host to theme it.' },
    ],
    theming: [
      { name: '--md-backdrop', fallback: 'rgb(15 20 35 / 0.6)', note: 'Behind the box.' },
      { name: '--md-surface', fallback: '#fff', note: 'The box.' },
      { name: '--md-text', fallback: '#1e283c', note: 'Text in the box (14.75:1 on the fallback surface).' },
      { name: '--md-radius', fallback: '12px', note: 'Box corners; size="full" has none.' },
      { name: '--md-padding', fallback: 'clamp(1.25rem, 4vw, 2rem)', note: 'Inside the box.' },
      { name: '--md-shadow', fallback: '0 1.5rem 4rem rgb(0 0 0 / 0.3)', note: 'Box shadow.' },
      { name: '--md-close-bg', fallback: 'transparent', note: 'Close button fill (a faint grey on hover).' },
      { name: '--md-close-fg', fallback: 'currentColor', note: 'Close icon.' },
      { name: '--md-focus', fallback: 'currentColor', note: 'Focus ring on the close button.' },
      { name: '--md-width-sm', fallback: '24rem', note: 'Max width of size="sm".' },
      { name: '--md-width-md', fallback: '36rem', note: 'Max width of size="md".' },
      { name: '--md-width-lg', fallback: '56rem', note: 'Max width of size="lg".' },
    ],
    a11y: [
      'A native modal <dialog> opened with showModal(): the rest of the page is inert, Tab stays inside, Escape closes it. Named by its title through aria-labelledby, also when the title is hidden visually.',
      'The close button is a real 44px <button> named by closeLabel, first in the dialog, so it has focus on open unless the content has an autofocus field. A backdrop click closes too; a text selection dragged out of the box does not.',
      'Focus returns to the element that opened it, or after an automatic open to whatever had focus. Triggers get aria-haspopup="dialog"; a trigger that is not a button or link (an <img>) gets role="button" and tabindex="0" and opens on Enter or Space.',
      'The page underneath does not scroll while it is open, and the scrollbar’s width is kept so nothing shifts.',
      'prefers-reduced-motion: no fade or rise; it appears at once. Nothing else moves.',
      'Without JavaScript the dialog stays closed and nothing opens by itself. A link trigger still goes to its href (point it at a page with the same content); a button trigger does nothing.',
    ],
    usage: `<!-- A click: any element with data-modal-open. A link keeps working without JavaScript. -->
<a href="/contact/" data-modal-open="quote">Get a quote</a>
<Modal id="quote" title="Get a quote">
  <ContactForm />            <!-- anything: a form embed, a video-player, an image -->
</Modal>

<!-- One offer after engagement: half the page or 30 s, once a session, never in the first 3 s. -->
<Modal id="guide" title="The free planting guide" size="sm" scroll={50} delay={30000} version="2026-spring">
  …
</Modal>
<!-- .site { --md-surface: var(--white); --md-text: var(--ink); --md-radius: var(--radius); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/modal/ (demo)' }],
    file: 'src/library/modal/Modal.astro',
    added: '2026-09-24',
  },
  {
    id: 'announcement-bar',
    name: 'Announcement bar',
    aka: ['PowerPack Announcement Bar', 'Hello Bar', 'notification bar', 'top bar', 'promo bar', 'sticky bar', 'WP Notification Bar'],
    summary:
      'One line above the header (or at the end of the page) with an optional link, a dismiss that is remembered, a from/until window and a countdown in the business’s time zone. In the document flow, settled by an inline script before the first paint, so it causes no layout shift; a dismissal collapses it once, on the visitor’s action.',
    pitch: 'One line across the top for the thing that matters this week — with a date it stops itself, and a dismiss that stays dismissed.',
    // SE Ranking US, 2026-09-24: announcement bar 110/mo, difficulty 14; notification bar
    // website 70/6; top bar website 70/11; hello bar alternative 20/5.
    search: { query: 'announcement bar', alsoRanks: ['notification bar website', 'top bar website', 'hello bar alternative'] },
    replaces: ['PowerPack announcement bar', 'Hello Bar', 'WP Notification Bar and top-bar plugins'],
    goodFor:
      'Something true for a while and then not: holiday hours, a sale with an end, a launch, a closure, a change of address. Give it `until` or a `countdown` and it takes itself down on time, in the business’s time zone, with no one editing the site.',
    notFor:
      'Permanent content: a phone number or a tagline that is always there belongs in the header. Two bars stacked on one page: say the one thing. A rolling list of headlines is news-ticker. And a sticky bar by default: a bar that follows the reader down the page covers content on a phone; ask for sticky when it earns it.',
    props: [
      { name: 'text', type: 'string', note: 'The announcement, when not given as the default slot. One line on a laptop; it wraps on a phone.' },
      { name: 'href / linkText', type: 'string', default: '— / “Read more”', note: 'A normal link after the text.' },
      { name: 'label', type: 'string', note: 'The region’s accessible name. Default: the bar’s own text.' },
      { name: 'position', type: "'top' | 'bottom'", default: "'top'", note: 'Top: place it first in <body>, above the header. Bottom: place it last. It sits where it is put.' },
      { name: 'sticky', type: 'boolean', default: 'false', note: 'position: sticky to the viewport edge. Publishes --anb-height (top) or --anb-height-bottom on <html> for the host’s own sticky header. A sticky bottom bar sits above the cookie-consent bar while that shows.' },
      { name: 'dismissible', type: 'boolean', default: 'true', note: 'A dismiss button; the dismissal is stored in localStorage.' },
      { name: 'key', type: 'string', default: '“announcement-bar” (“announcement-bar-bottom”)', note: 'localStorage key of the dismissal.' },
      { name: 'version', type: 'string', default: 'a hash of the content', note: 'A changed announcement shows again by itself; set it by hand only to re-show the same words.' },
      { name: 'from / until', type: "'YYYY-MM-DD' | 'YYYY-MM-DDTHH:MM'", note: 'The window, as the business’s wall clock. A date is a whole day, and `until` includes it. An offset or Z makes it an absolute instant.' },
      { name: 'countdown', type: "'YYYY-MM-DDTHH:MM'", note: '“Ends in 2 days 4 hours” after the text, refreshed on the minute; the bar hides when it passes.' },
      { name: 'timeZone', type: 'string (IANA)', note: 'Required with from, until or countdown: “America/Chicago”, not the visitor’s zone.' },
      { name: 'endsIn / ends', type: 'string', default: '“Ends in” / “Ends”', note: 'Words before the countdown, and before the end date shown without JavaScript. The units (days, hours, minutes) are English.' },
      { name: 'theme', type: "'accent' | 'dark' | 'light'", default: "'accent'", note: 'Which pair of colours.' },
      { name: 'dismissLabel', type: 'string', default: '“Dismiss announcement”', note: 'Name of the dismiss button.' },
      { name: 'class', type: 'string', note: 'Class on the bar.' },
    ],
    theming: [
      { name: '--anb-accent-bg', fallback: '#5933d8', note: 'theme="accent" ground (7.27:1 with its text).' },
      { name: '--anb-accent-fg', fallback: '#fff', note: 'theme="accent" text.' },
      { name: '--anb-dark-bg', fallback: '#1e283c', note: 'theme="dark" ground (14.75:1).' },
      { name: '--anb-dark-fg', fallback: '#fff', note: 'theme="dark" text.' },
      { name: '--anb-light-bg', fallback: '#eef2f1', note: 'theme="light" ground (12.92:1).' },
      { name: '--anb-light-fg', fallback: '#1d2b30', note: 'theme="light" text.' },
      { name: '--anb-link', fallback: 'currentColor', note: 'Link colour; underlined either way. If you set it, keep 4.5:1 on the ground.' },
      { name: '--anb-min-height', fallback: '2.75rem', note: 'Bar height: the 44px dismiss button.' },
      { name: '--anb-font-size', fallback: '0.95rem', note: 'Text size.' },
      { name: '--anb-focus', fallback: 'currentColor', note: 'Focus ring on the link and the dismiss button.' },
      { name: '--anb-z', fallback: '40', note: 'Stacking of a sticky bar; below the consent bar (120).' },
    ],
    a11y: [
      'A region (role="region") named by its own text, or by `label`. The link is a normal link.',
      'The dismiss button is a real 44px <button> named “Dismiss announcement”. After a dismiss, focus moves to the next focusable thing on the page, not to nowhere.',
      'The countdown is a <time datetime> with the absolute end, and deliberately not a live region: it changes every minute and should not be read out each time.',
      'The fallback colours of all three themes clear 4.5:1 (7.27, 14.75 and 12.92 to 1); `npm run check` computes them.',
      'prefers-reduced-motion: a dismissed bar disappears at once instead of collapsing.',
      'Without JavaScript the bar shows when the build put it inside its window, the countdown gives the end date instead, and it cannot be dismissed: the button stays hidden rather than doing nothing.',
    ],
    usage: `<body>
  <AnnouncementBar
    text="Closed Monday, May 25, for Memorial Day."
    href="/hours/" linkText="Holiday hours"
    until="2026-05-25" timeZone="America/Chicago"
  />
  <Header />
  …
  <!-- A sale with an end: counts down, then takes itself down. -->
  <AnnouncementBar theme="dark" countdown="2026-11-30T23:59" timeZone="America/New_York">
    Black Friday: 30% off everything.
  </AnnouncementBar>
</body>
<!-- global.css: .anb { --anb-accent-bg: var(--brand); --anb-accent-fg: var(--white); }
     with sticky:  .site-header { position: sticky; top: var(--anb-height, 0px); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/announcement-bar/ (demo)' }],
    file: 'src/library/announcement-bar/AnnouncementBar.astro',
    added: '2026-09-24',
  },
  {
    id: 'hotspot',
    name: 'Image hotspots',
    aka: ['UABB Hotspot', 'image hotspots', 'interactive image', 'image map', 'hotspot tour', 'product tour image', 'Elementor Hotspot', 'shoppable image'],
    summary:
      'An image with numbered pins at percent coordinates; each pin is a button that opens a small panel (title, text, optionally a small image) beside it. Click, tap, Enter and Space toggle a pin everywhere; hover and focus also open it where there is a mouse. One open at a time, Escape closes. An optional tour steps through the pins with "2 of 5", Previous, Next and End tour, and can play itself once started. Without JavaScript the pins link to a numbered list of every point under the image.',
    pitch: 'Put the explanation on the picture: pins on the parts that matter, each opening a line about it — or a guided tour that walks visitors round.',
    // SE Ranking US, 2026-09-26: image hotspot 320/mo, difficulty 23; interactive image 390/10;
    // image hotspots 320/24 and hotspot image 320/24 (one cluster); image tooltip 70/13.
    // "image map" (760/41) is the old HTML <map> element's term and "hotspot" alone (90,500/93)
    // is Wi-Fi; neither is this page.
    search: { query: 'image hotspot', alsoRanks: ['interactive image', 'image hotspots', 'image tooltip'] },
    replaces: ['UABB “Hotspot” module (Beaver Builder), tour included', 'Elementor Pro Hotspot widget', 'image hotspot / image map plugins', 'HTML <map> / <area> image maps'],
    goodFor:
      'One picture that stands for a lot of parts: a room or a product whose features each need a line, a floor plan, a site map of a campus or a trail, a diagram of a machine. The tour suits a picture people should see in order, like the stops of a visit or the steps of an assembly.',
    notFor:
      'Text people must read to use the page: behind a pin, many never see it (the numbered list under the image is only there without JavaScript and in print). More than about eight pins, which crowd the picture and a phone. Pins that are links to other pages: that is a list of links, or cards. And a picture without a spot to point at, where a caption does the job.',
    props: [
      { name: 'src', type: 'string', note: 'The image.' },
      { name: 'alt', type: 'string', note: 'Required. Describe the whole picture; the pins add the detail. "" only when the pins and their text say everything.' },
      { name: 'width / height', type: 'number', note: 'Intrinsic size, so nothing shifts while the image loads. Pins are placed in percent, so any display size works.' },
      { name: 'points', type: '{ x, y, title, text, image?, imageAlt? }[]', note: '`x` and `y` are percent of the image from its left and top edge (0–100; the build fails outside that). `title` names the pin, `text` is what it opens. `image` shows a small picture above the text and needs `imageAlt` ("" if decorative).' },
      { name: 'caption', type: 'string', note: 'A <figcaption> under the image.' },
      { name: 'tour', type: 'boolean', default: 'false', note: 'A “Start tour” button over the image; each panel then carries “2 of 5”, Previous, Next and End tour, in the points’ order.' },
      { name: 'repeat', type: 'boolean', default: 'false', note: 'Tour: Next on the last step goes back to the first (and Previous on the first to the last). Without it, the first step has no Previous and the last no Next.' },
      { name: 'autoplay', type: 'number (ms)', note: 'Tour: step on by itself every so many ms (at least 2000) once the visitor presses Start tour. Waits while the pointer is on the open pin or panel, while keyboard focus is in the figure and while the tab is hidden; never under reduced motion. Needs `tour`.' },
      { name: 'pulse', type: 'boolean', default: 'true', note: 'A soft ring pulsing out of each closed pin. Never under reduced motion.' },
      { name: 'labels', type: '{ start?, previous?, next?, end?, of? }', default: 'Start tour, Previous, Next, End tour, of', note: 'The tour’s words, for another language.' },
      { name: 'loading', type: "'lazy' | 'eager'", default: "'lazy'", note: 'Eager only when the image is in the first screen.' },
      { name: 'class', type: 'string', note: 'Class on the <figure>, for theming one figure.' },
    ],
    theming: [
      { name: '--hs-accent', fallback: '#5933d8', note: 'Pins, Start tour, Next, focus rings, unless set separately.' },
      { name: '--hs-pin-bg', fallback: 'var(--hs-accent)', note: 'The pin’s dot.' },
      { name: '--hs-pin-fg', fallback: '#fff', note: 'The number in the dot, and text on Start tour and Next.' },
      { name: '--hs-pin-ring', fallback: 'rgb(255 255 255 / 0.9)', note: 'Ring round the dot and the pulse, so a pin shows on a dark or busy picture.' },
      { name: '--hs-pin-active', fallback: '#1e283c', note: 'The dot of the pin whose panel is open.' },
      { name: '--hs-pin-size', fallback: '1.75rem', note: 'The visible dot. The hit area stays 44px whatever this is.' },
      { name: '--hs-panel-bg', fallback: '#fff', note: 'Panel background.' },
      { name: '--hs-panel-fg', fallback: '#1e283c', note: 'Panel text (14.75:1 on the fallback background).' },
      { name: '--hs-panel-width', fallback: '18rem', note: 'Panel width over the image; never more than 70% of the figure.' },
      { name: '--hs-muted', fallback: '#5b6275', note: 'The tour’s “2 of 5” (6.09:1 on the fallback panel).' },
      { name: '--hs-radius', fallback: '10px', note: 'Image and panel corners.' },
      { name: '--hs-shadow', fallback: '0 0.75rem 2rem rgb(15 20 35 / 0.25)', note: 'Panel shadow.' },
      { name: '--hs-focus', fallback: 'var(--hs-accent)', note: 'Focus ring on pins and tour buttons.' },
    ],
    a11y: [
      'Each pin is a real <button> with aria-expanded and aria-controls pointing at its panel, named by the point’s title and described by its text (aria-describedby), so a screen reader hears both on reaching it. The hit area is 44 × 44 px whatever the image size.',
      'Click, tap, Enter and Space toggle a pin on every device. With a mouse or trackpad, hover and keyboard focus also open it; leaving closes what hover opened, and a click holds it open. One panel at a time. Escape closes it and returns focus to its pin; a click or tap off the pins closes it too.',
      'Tour: each step’s controls are a group named “2 of 5” plus the title; after Previous or Next, focus moves to the same button in the new panel, so the keyboard stays in the tour. End tour (or Escape) closes it and puts focus back on Start tour.',
      'Autoplay only after the visitor presses Start tour, never on arrival. It waits while the pointer is on the open pin or panel and while keyboard focus is in the figure, and End tour stops it (WCAG 2.2.2). prefers-reduced-motion (tracked live): no autoplay, no pulse, no fade.',
      'Panels open toward the larger space, decided at build; in a figure narrower than 34rem the open panel sits under the image, so it never covers the picture or leaves the screen.',
      'Without JavaScript the pins are links to a numbered list under the image holding every point’s title, text and image: nothing is only behind a pin. Print shows the list too.',
    ],
    usage: `<Hotspot
  src="/images/showroom.webp" width={1600} height={1000}
  alt="The showroom: a sofa by the window, a lamp and a plant"
  points={[
    { x: 50, y: 62, title: 'Three-seat sofa', text: 'Washable covers in twelve colours.' },
    { x: 73, y: 25, title: 'Arc lamp', text: 'Warm light on a dimmer.' },
    { x: 87, y: 58, title: 'Rubber plant', text: 'Copes with low light.', image: '/images/plant.webp', imageAlt: '' },
  ]}
  tour autoplay={6000}
/>
<!-- global.css: .hs { --hs-accent: var(--brand); --hs-radius: var(--radius); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/hotspot/ (demo)' }],
    file: 'src/library/hotspot/Hotspot.astro',
    added: '2026-09-26',
  },
  {
    id: 'info-circle',
    name: 'Info circle',
    aka: ['UABB Info Circle', 'circular infographic', 'circle infographic', 'process circle', 'cycle diagram', 'radial menu', 'interactive infographic'],
    summary:
      'Items (an icon or a round image each) spaced evenly round a circle, positions computed at build; the chosen item’s title and text show in the middle. Hover, focus and click choose; each item is a button with aria-pressed and the centre is a polite live region. Optional autoplay with a pause button. In a container narrower than 28rem, and without JavaScript, it is a plain list with every item’s text showing.',
    pitch: 'Five things you do, round one circle: point at one and it tells its story in the middle — and on a phone it is simply a list.',
    // SE Ranking US, 2026-09-26: circular infographic 320/mo, difficulty 7 (circle infographic
    // and infographic circle are the same cluster, 320/7); info circle 40/10; interactive
    // infographic 320/25; cycle diagram 810/7 (people making slides, so a variant, not the title).
    search: { query: 'circular infographic', alsoRanks: ['info circle', 'interactive infographic', 'cycle diagram'] },
    replaces: ['UABB “Info Circle” module (Beaver Builder)', 'Ultimate Addons / Elementor “info circle” widgets', 'circular infographic images with the text baked in'],
    goodFor:
      'Three to eight things of equal weight that belong together: the steps of a process that repeats, the services round one promise, the branches of a small business, the parts of a method. The circle says “these go round together”; the middle gives each its moment.',
    notFor:
      'Content people must read in order or all at once (a list does that better), more than eight items (they crowd the circle and the text box in its middle), or items with long texts: the middle holds about 30 words. Steps with a start and an end, which are info-list’s vertical timeline. And not a navigation menu, whatever “radial menu” searches suggest: items choose text, they do not go anywhere.',
    props: [
      { name: 'items', type: '{ title, text, icon?, image?, link?: { text, href } }[]', note: '2 to 10 items (the build fails outside that); each needs a title, a text and an `icon` (inline SVG) or an `image`. Both are decorative: the title names the item. `link` adds a link under the text.' },
      { name: 'size', type: 'string (CSS length)', default: '32rem', note: 'The circle’s diameter; never wider than its container. The circle needs a container at least 28rem wide; below that it is a list.' },
      { name: 'autoplay', type: 'number (ms) | boolean', default: 'false', note: 'Move to the next item every so many ms (`true` = 5000, at least 2000). Comes with a pause button; waits on hover, focus, off screen and in a hidden tab; stops for good when the visitor clicks an item; never under reduced motion.' },
      { name: 'startAt', type: 'number', default: '0', note: 'The item chosen when the page loads (0-based).' },
      { name: 'label', type: 'string', note: 'Accessible name of the whole group (it becomes role="group"), e.g. “What we offer”.' },
      { name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3', note: 'Level of the item titles; match the page outline.' },
      { name: 'pauseLabel / playLabel', type: 'string', default: '“Pause the rotation” / “Start the rotation”', note: 'The pause button’s words.' },
      { name: 'class', type: 'string', note: 'Class on the root, for theming one circle.' },
    ],
    theming: [
      { name: '--inc-accent', fallback: '#5933d8', note: 'The chosen item, item borders and icons, links, focus ring.' },
      { name: '--inc-item-bg', fallback: '#fff', note: 'An item that is not chosen.' },
      { name: '--inc-item-fg', fallback: 'var(--inc-accent)', note: 'Its icon.' },
      { name: '--inc-active-fg', fallback: '#fff', note: 'The chosen item’s icon (7.27:1 on the accent).' },
      { name: '--inc-centre-bg', fallback: '#f4f1fe', note: 'The disc behind the text in the middle, and behind list icons.' },
      { name: '--inc-fg', fallback: '#1e283c', note: 'Text (13.24:1 on the centre disc).' },
      { name: '--inc-ring', fallback: 'rgb(89 51 216 / 0.35)', note: 'The dashed circumference.' },
      { name: '--inc-size', fallback: '32rem', note: 'Diameter; the `size` prop sets it.' },
      { name: '--inc-item-size', fallback: '4.5rem', note: 'Each item’s disc (never under 44px).' },
      { name: '--inc-focus', fallback: 'var(--inc-accent)', note: 'Focus ring.' },
    ],
    a11y: [
      'Each item is a real <button> named by its title, with aria-pressed (exactly one is pressed) and aria-controls pointing at the middle. Hover (with a mouse or trackpad), focus and click all choose it, so Tab alone walks the circle.',
      'The middle is aria-live="polite": when the choice changes, a screen reader reads the new title and text. While autoplay runs it is not live, so nothing is read out on its own.',
      'Autoplay has a visible pause button (WCAG 2.2.2), waits while the pointer is on the circle or focus is inside, while off screen and in a hidden tab, stops for good once the visitor clicks an item, and never runs under prefers-reduced-motion (tracked live), which also drops the fade.',
      'The circle needs about 28rem. In a narrower container it becomes a vertical list with each item’s icon, title and text showing, and there is nothing to press.',
      'Without JavaScript it is that list, whatever the width: every item’s text is on the page. The list is the only copy of the content; the middle shows a copy of the chosen entry. Print shows the list.',
      'Icons and images are decorative (the title names the item); items are at least 44px.',
    ],
    usage: `<InfoCircle
  label="What we offer"
  items={[
    { icon: listenSvg, title: 'Listen', text: 'An hour about your customers.' },
    { icon: planSvg, title: 'Plan', text: 'A page list, agreed first.' },
    { image: '/images/team.webp', title: 'Build', text: 'Tested parts.', link: { text: 'How we build', href: '/process/' } },
  ]}
  autoplay={6000}
/>
<!-- global.css: .inc { --inc-accent: var(--brand); --inc-centre-bg: var(--tint); } -->`,
    license:
      'The icons in this demo are Font Awesome Free (CC BY 4.0), each carrying Font Awesome’s own attribution comment. The circle takes any SVG you give it: your own icons, or a Font Awesome Pro one we have licensed for your site.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/info-circle/ (demo)' }],
    file: 'src/library/info-circle/InfoCircle.astro',
    added: '2026-09-26',
  },
  {
    id: 'slide-box',
    name: 'Slide box',
    aka: ['UABB Slide Box', 'slide box', 'reveal card', 'sliding card', 'hover reveal box', 'info box with slide-up detail', 'card overlay'],
    summary:
      'A card whose back panel slides in over the front from a chosen direction (up, down, left, right): on hover where there is a mouse, and on click, tap, Enter or Space everywhere, through a real button with aria-expanded. The front is a teaser (icon or image, title, a line), the back its detail (text and a link). Both panels share one height; the one out of view is inert.',
    pitch: 'A card that shows the headline first and slides up the detail when someone wants it, on a phone as well as with a mouse.',
    // SE Ranking US, 2026-09-26: reveal card 110/mo, difficulty 14; sliding card 260/8; card
    // hover effects 30/12; card overlay 50/10. "slide box" itself is 1,300/55, but its results
    // are microscope-slide storage boxes and toolbox drawer slides, not websites, so it stays an aka.
    search: { query: 'reveal card', alsoRanks: ['sliding card', 'card hover effects', 'card overlay'] },
    replaces: ['UABB “Slide Box” module (Beaver Builder), overlay style', 'hover-reveal info boxes in Elementor and Divi', 'hand-rolled CSS slide-up card overlays'],
    goodFor:
      'A grid of teasers whose detail is worth one more gesture: services that each need three lines of explanation and a link, job openings (title on the front, what the job is and Apply on the back), products with ingredients or specifications, team members with a short bio.',
    notFor:
      'Two faces of equal weight: that is flip-box, which turns a card over to a second, equally important side. Pick slide-box when the front is a teaser and the back its detail sliding over it; pick flip-box when both sides stand on their own. Neither is for anything a visitor must read without interacting: the back never holds the only copy of a price, a phone number or an opening time. And a panel that drops open below the card and pushes the page down (UABB’s other styles) is an accordion.',
    props: [
      { name: 'title', type: 'string', note: 'Front heading, and the accessible name of the card’s button.' },
      { name: 'text', type: 'string', note: 'The front’s short line.' },
      { name: 'icon', type: 'string', note: 'Inline SVG markup, in a tinted circle above the title; decorative. Ignored when there is an `image`.' },
      { name: 'image', type: 'string', note: 'An image across the top of the front (16:9, cropped to fit).' },
      { name: 'imageAlt', type: 'string', note: 'Required with `image` (the build fails without it): describe it, or "" when it is decorative on purpose.' },
      { name: 'backTitle', type: 'string', default: '`title`', note: 'Back heading; "" for none.' },
      { name: 'backText', type: 'string', note: 'The back’s longer text; about 40 words fit a card of the default size.' },
      { name: 'cta', type: '{ text: string; href: string }', note: 'A link on the back. On a touch screen the first tap slides the back in, the second follows the link.' },
      { name: 'direction', type: "'up' | 'down' | 'left' | 'right'", default: "'up'", note: 'Where the back comes from as it moves: up rises from the bottom edge, down drops from the top, left comes in from the right edge, right from the left.' },
      { name: 'trigger', type: "'both' | 'click'", default: "'both'", note: 'Whether hover ALSO slides it in. Click, tap, Enter and Space always do; a hover-only card would lock out touch screens and keyboards.' },
      { name: 'duration', type: 'number (ms)', note: 'The slide. Overrides `--slb-duration` (450ms).' },
      { name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3', note: 'Level of the headings; match the page outline.' },
      { name: 'label', type: 'string', note: 'Accessible name of the card’s button. Default: `title`, else the front’s first heading.' },
      { name: 'class', type: 'string', note: 'Class on the root, for theming one card.' },
      { name: 'slot front / slot back', type: 'slot', note: 'Any HTML for a panel; wins over the props for that panel. Keep links off the front: the whole front is the button.' },
    ],
    theming: [
      { name: '--slb-accent', fallback: '#5933d8', note: 'The back, the icon and the focus ring, unless set separately.' },
      { name: '--slb-front-bg', fallback: '#fff', note: 'Front background.' },
      { name: '--slb-front-fg', fallback: '#1e283c', note: 'Front text (14.75:1 on the fallback background).' },
      { name: '--slb-border', fallback: 'rgb(0 0 0 / 0.08)', note: 'Front border.' },
      { name: '--slb-back-bg', fallback: 'var(--slb-accent)', note: 'Back background.' },
      { name: '--slb-back-fg', fallback: '#fff', note: 'Back text (7.27:1 on the fallback accent), and the ring round a focused back link.' },
      { name: '--slb-cta-bg', fallback: '#fff', note: 'Back link fill.' },
      { name: '--slb-cta-fg', fallback: 'var(--slb-back-bg)', note: 'Back link text.' },
      { name: '--slb-icon-color', fallback: 'var(--slb-accent)', note: 'Icon and the corner hint.' },
      { name: '--slb-icon-bg', fallback: '#f4f1fe', note: 'Circle behind the icon.' },
      { name: '--slb-icon-size', fallback: '2.25rem', note: 'Icon size; its circle is twice it.' },
      { name: '--slb-radius', fallback: '14px', note: 'Corner radius.' },
      { name: '--slb-padding', fallback: '1.75rem 1.5rem', note: 'Inside each panel.' },
      { name: '--slb-shadow', fallback: '0 1px 2px rgb(0 0 0 / 0.06), 0 10px 28px rgb(0 0 0 / 0.1)', note: 'box-shadow of the card.' },
      { name: '--slb-min-height', fallback: '14rem', note: 'A floor, not a height: the card grows with its taller panel.' },
      { name: '--slb-title-size', fallback: '1.2rem', note: 'Title font size.' },
      { name: '--slb-duration', fallback: '450ms', note: 'The slide; the `duration` prop overrides it.' },
      { name: '--slb-easing', fallback: 'cubic-bezier(0.2, 0.7, 0.2, 1)', note: 'Timing of the slide.' },
      { name: '--slb-fade', fallback: '200ms', note: 'The crossfade under reduced motion.' },
      { name: '--slb-focus', fallback: 'var(--slb-accent)', note: 'Focus ring round the card.' },
    ],
    a11y: [
      'The card is a real <button> named from the title, with aria-expanded saying whether the back is in and aria-controls pointing at the back. Enter or Space slides it in and out; Escape slides it out and returns focus to the button.',
      'Both panels are in the DOM. The one out of view is inert and aria-hidden, so its link is not a tab stop and a screen reader reads only what shows. With the back in, Tab goes from the button to the back’s link.',
      'Focus inside the back keeps it in. Focus leaving the card slides out a back opened from the keyboard; one a pointer clicked in stays until clicked again.',
      'Hover never works alone: on a touch screen the first tap slides the back in and its link works on the second tap; a tap on the back away from the link slides it out. A corner plus on the front, turned to a cross on the back, says there is more.',
      'prefers-reduced-motion (tracked live): no sliding; the panels crossfade.',
      'Without JavaScript the button is never shown and both panels render, the back below the front, link included. Printing shows both.',
    ],
    usage: `<div class="jobs">   <!-- grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)) -->
  <SlideBox
    icon={wrenchSvg}
    title="Service technician"
    text="Full time, Springfield."
    backText="Install and repair heating systems across the county. Van, tools and training provided."
    cta={{ text: 'Apply now', href: '/jobs/technician/' }}
  />
  <SlideBox image="/images/office.webp" imageAlt="" title="Office manager" direction="left" … />
</div>
<!-- global.css: .slb { --slb-accent: var(--brand); --slb-radius: var(--radius); } -->`,
    license:
      'The icons in this demo are Font Awesome Free (CC BY 4.0), each carrying Font Awesome’s own attribution comment. The card takes any SVG you give it: your own icons, or a Font Awesome Pro one we have licensed for your site.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/slide-box/ (demo)' }],
    file: 'src/library/slide-box/SlideBox.astro',
    added: '2026-09-26',
  },
  {
    id: 'countdown',
    name: 'Countdown',
    aka: ['UABB Countdown', 'Elementor Countdown', 'countdown timer', 'evergreen countdown timer', 'sale timer', 'deadline timer', 'order cut-off timer'],
    summary:
      'Days, hours, minutes and seconds to a wall-clock moment in the business’s time zone, or an evergreen run that starts per visitor and is remembered in localStorage. Square, circle or plain. At zero it shows a message, hides, or counts to the next day’s or week’s occurrence. A role="timer" named by its end (“Ends Oct 3, 5:00 PM CDT”) with no aria-live, so nothing is announced as it ticks; the digits stay readable on demand.',
    pitch: 'Show exactly how long is left — to the end of a sale, the start of an event or today’s order cut-off — in your time zone, not the visitor’s guess.',
    // SE Ranking US, 2026-09-26: countdown timer widget 320/mo, difficulty 36; countdown timer
    // html 320/53; sales countdown timer 40/44; evergreen countdown timer 10/13. "countdown
    // widget" 4,400/64 is out of reach and "email countdown timer" 480/37 is a different
    // product (an image in an email), so neither is claimed.
    search: { query: 'countdown timer widget', alsoRanks: ['countdown timer html', 'sales countdown timer', 'evergreen countdown timer'] },
    replaces: ['UABB “Countdown” module (Beaver Builder)', 'Elementor Pro Countdown widget', 'evergreen timer plugins (Deadline Funnel style)', 'embedded third-party countdown widgets'],
    goodFor:
      'A real deadline: a sale that ends, an event that starts, a daily order cut-off (onEnd="repeat" every day), a webinar. Evergreen suits an offer that is genuinely held for each visitor for a set time, such as a welcome discount.',
    notFor:
      'A deadline that is not real. An evergreen timer that restarts on every visit, or a sale that never ends, is a false urgency claim, and the FTC and UK CMA treat fake countdowns as a deceptive practice; this element keeps a visitor’s evergreen start on return precisely so the deadline stays true. Also not a clock or a stopwatch, and not for the page’s one line of news (announcement-bar has its own “Ends in 2 days” countdown).',
    props: [
      { name: 'to', type: "'YYYY-MM-DD' | 'YYYY-MM-DDTHH:MM'", note: 'The end, as the business’s wall clock reads it. A date alone is that day’s midnight. Give `to` or `evergreen`.' },
      { name: 'timeZone', type: 'string (IANA)', note: 'Required with `to`: “America/Chicago”, not the visitor’s zone. A time inside a spring-forward gap resolves to the jump.' },
      { name: 'evergreen', type: 'number (minutes)', note: 'Starts on the visitor’s first view; the start instant is stored in localStorage under `key` (never a cookie), so a return shows the same deadline.' },
      { name: 'key', type: 'string', default: '“countdown-evergreen”', note: 'localStorage key of the evergreen start. Countdowns sharing a key share a deadline; give each offer its own.' },
      { name: 'units', type: "('days' | 'hours' | 'minutes' | 'seconds')[]", default: 'all four', note: 'The largest shown takes the rest (no days: 51 hours). The smallest rounds up, so it reaches zero exactly at the end.' },
      { name: 'labels', type: '{ days?, hours?, minutes?, seconds? }', default: 'English', note: 'Each a word, or [singular, plural]: `{ days: [\'día\', \'días\'] }`. For other languages, with `ends`, `endsIn`, `endedText` and `locale`.' },
      { name: 'style', type: "'square' | 'circle' | 'plain'", default: "'square'", note: 'Boxes, rings whose arc is the unit’s share of its range, or bare digits.' },
      { name: 'onEnd', type: "'message' | 'hide' | 'repeat'", default: "'message'", note: 'At zero: show `endedText`; remove it; or count again (with `to`, to the next occurrence per `every`; evergreen, a fresh run).' },
      { name: 'every', type: "'day' | 'week'", note: 'With `to` and onEnd="repeat": the same wall-clock time the next day or week, in `timeZone`, across DST.' },
      { name: 'endedText', type: 'string', default: '“This offer has ended.”', note: 'Shown at zero with onEnd="message", and the accessible name then.' },
      { name: 'ends', type: 'string', default: '“Ends”', note: 'Word before the end date: the accessible name and the no-JavaScript line.' },
      { name: 'endsIn', type: 'string', default: '“Ends in”', note: 'Before an evergreen duration in the no-JavaScript line (“Ends in 30 minutes”).' },
      { name: 'showEnd', type: 'boolean', default: 'false', note: 'Keep the “Ends Oct 3, 5:00 PM CDT” line visible under the running digits.' },
      { name: 'locale', type: 'string', default: '“en-US”', note: 'Locale of the end date.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme and place it.' },
    ],
    theming: [
      { name: '--cd-bg', fallback: '#1e283c', note: 'style="square" box (14.75:1 with its digits).' },
      { name: '--cd-fg', fallback: '#fff', note: 'style="square" digits and labels.' },
      { name: '--cd-text', fallback: 'inherit', note: 'Digits of circle and plain; the end line and the ended message.' },
      { name: '--cd-label', fallback: 'currentColor at 80–85%', note: 'Unit labels. Keep 4.5:1 if you set it.' },
      { name: '--cd-ring', fallback: '#5933d8', note: 'style="circle" arc.' },
      { name: '--cd-track', fallback: 'rgb(127 127 127 / 0.25)', note: 'style="circle" track under the arc.' },
      { name: '--cd-size', fallback: 'clamp(1.75rem, 6vw, 2.75rem)', note: 'Digit size; circle units scale with it.' },
      { name: '--cd-radius', fallback: '10px', note: 'Square box corners.' },
      { name: '--cd-gap', fallback: '0.75rem', note: 'Space between units.' },
      { name: '--cd-align', fallback: 'center', note: 'justify-content of the units: flex-start to sit left.' },
      { name: '--cd-font', fallback: 'inherit', note: 'Digit font family; the digits are tabular so they do not jitter.' },
    ],
    a11y: [
      'role="timer", whose implicit aria-live is “off”, with no aria-live attribute: nothing is announced as the digits tick, so a screen reader is never read seconds. The wrapper’s aria-label gives the absolute end, “Ends Oct 3, 5:00 PM CDT”, or `endedText` once ended.',
      'The digits stay readable when someone navigates into them: each unit is its number and its word, and screen readers get the number unpadded, so it reads “3 days 4 hours”, not “zero three 4”.',
      'The name changes only when the end does: a daily repeat rolling over, or an evergreen run starting.',
      'Without JavaScript: the static line “Ends Oct 3, 5:00 PM CDT” in a <time datetime> (an evergreen one reads “Ends in 30 minutes”). The digits from the build’s clock are not shown, because they would be stale and never tick.',
      'No layout shift: the script placed right after the element shows and corrects the digits before the first paint.',
      'prefers-reduced-motion: no tick animation on a changing digit and no ring transition; the numbers simply change.',
      'The square style’s fallback colours clear 4.5:1 (14.75:1); `npm run check` computes it.',
    ],
    usage: `<!-- A sale that ends at 5 PM Chicago time, whatever zone the visitor is in. -->
<h2>The autumn sale ends in</h2>
<Countdown to="2026-10-03T17:00" timeZone="America/Chicago" endedText="The autumn sale has ended." />

<!-- Today's order cut-off, then tomorrow's, for ever. -->
<Countdown to="2026-09-28T15:00" timeZone="America/New_York" onEnd="repeat" every="day"
  style="plain" units={['hours', 'minutes', 'seconds']} />

<!-- 30 minutes per visitor, the same deadline when they come back. -->
<Countdown evergreen={30} key="welcome-offer" style="circle" units={['minutes', 'seconds']} />
<!-- .cd { --cd-bg: var(--navy); --cd-fg: var(--white); --cd-ring: var(--brand); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/countdown/ (demo)' }],
    file: 'src/library/countdown/Countdown.astro',
    added: '2026-09-26',
  },
  {
    id: 'content-toggle',
    name: 'Content toggle',
    aka: ['UABB Content Toggle', 'PowerPack Content Toggle', 'pricing toggle', 'monthly / annual switch', 'content switcher', 'toggle switch'],
    summary:
      'Two labelled versions of one thing, a switch (role="switch") or two pressed buttons between them, and two panels in slots a and b. Optional badge on one label, a choice remembered for the session, and ?<param>= to preselect. Without JavaScript both panels show under their labels as headings.',
    pitch: 'Let visitors flip between two versions of the same thing — monthly or annual prices, homes or businesses — without leaving the page.',
    // SE Ranking US, 2026-09-26: toggle content 110/mo, difficulty 27; content switcher 90/18;
    // css toggle switch 170/16; html toggle switch 90/9. "content toggle" and "pricing toggle"
    // have no US volume; "toggle switch" 22,400/64 is out of reach and mostly hardware.
    search: { query: 'toggle content', alsoRanks: ['content switcher', 'css toggle switch', 'html toggle switch'] },
    replaces: ['UABB “Content Toggle” module (Beaver Builder)', 'PowerPack Content Toggle', 'the monthly/annual toggle of pricing-table plugins'],
    goodFor:
      'The pricing page’s monthly or annual switch, and any two versions of the same content a visitor picks between: homes or businesses, metric or imperial, before or during a project. One line of label each side.',
    notFor:
      'Tabs. A toggle is two versions of ONE thing switched in place, so the panels share a shape (the same plans, two prices). Three or more views, or two different topics (Features and Reviews), are tabs, which name each panel as a tab and scale past two. Also not for hiding content people need; both panels are one click apart, and without JavaScript both show.',
    props: [
      { name: 'labels', type: '[string, string]', note: 'Required. The two states, [a, b]: “Monthly”, “Annual”. They label the switch and head the panels.' },
      { name: 'slot a / slot b', type: 'slots', note: 'Required. The two panels: `<div slot="a">…</div>` and `<div slot="b">…</div>`.' },
      { name: 'style', type: "'switch' | 'buttons'", default: "'switch'", note: 'A switch between the two labels, or two pressed buttons for labels too long to sit either side of one.' },
      { name: 'default', type: "'a' | 'b'", default: "'a'", note: 'Which panel shows first when the URL and the session say nothing.' },
      { name: 'badge', type: 'string', note: 'A short note on one label: “Save 20%”. The switch is described by it, so it is heard too.' },
      { name: 'badgeOn', type: "'a' | 'b'", default: "'b'", note: 'Which label carries the badge.' },
      { name: 'remember', type: 'boolean', default: 'false', note: 'Keep the visitor’s choice for this browser session (sessionStorage).' },
      { name: 'key', type: 'string', default: '“content-toggle:<param or hash>”', note: 'The sessionStorage key. Toggles sharing a key share the remembered choice.' },
      { name: 'param', type: 'string', note: 'A URL parameter that preselects: `param="billing"` and a link to `?billing=b` or `?billing=annual` opens on annual. Beats the remembered choice.' },
      { name: 'label', type: 'string', default: '“<a> or <b>”', note: 'Accessible name of the button group (style="buttons").' },
      { name: 'headingLevel', type: '2 | 3 | 4 | 5', default: '3', note: 'Level of each panel’s heading: visible without JavaScript, for screen readers with it.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme and place it.' },
    ],
    theming: [
      { name: '--ct-track', fallback: '#5933d8', note: 'Switch track, the same in both states (neither is “off”). 7.27:1 against white.' },
      { name: '--ct-knob', fallback: '#fff', note: 'Switch knob.' },
      { name: '--ct-label', fallback: 'currentColor at 75%', note: 'The label not shown. Keep 4.5:1 if you set it.' },
      { name: '--ct-active', fallback: 'inherit', note: 'The label that is shown (also bold).' },
      { name: '--ct-pressed-bg', fallback: '#5933d8', note: 'style="buttons": the pressed button (7.27:1 with its text).' },
      { name: '--ct-pressed-fg', fallback: '#fff', note: 'style="buttons": the pressed button’s text.' },
      { name: '--ct-border', fallback: '#5933d8', note: 'style="buttons": the outline round both.' },
      { name: '--ct-badge-bg', fallback: '#dff5e8', note: 'Badge ground (8.19:1 with its text).' },
      { name: '--ct-badge-fg', fallback: '#0f5132', note: 'Badge text.' },
      { name: '--ct-focus', fallback: 'currentColor', note: 'Keyboard focus ring.' },
      { name: '--ct-gap', fallback: '1.25rem', note: 'Space between the switch and the panel.' },
      { name: '--ct-align', fallback: 'center', note: 'Where the switch sits: flex-start for the left.' },
    ],
    a11y: [
      'style="switch": a native <button role="switch"> named by label b, with aria-checked saying whether b is shown (“Annual, switch, on”) and aria-controls naming both panels. Space and Enter toggle it; clicking either visible label sets it too.',
      'style="buttons": two <button aria-pressed> in a group named by `label`; exactly one is pressed.',
      'The badge describes the switch (aria-describedby), so “Save 20%” is heard as well as seen.',
      'The shown panel keeps its label as a heading for screen readers only, so it is clear which version is on the page; the other panel is hidden, not just covered.',
      'Without JavaScript both panels render, each under its label as a heading, and the switch (which could not work) is not shown.',
      'No layout shift: the script right after the element settles it before the first paint. prefers-reduced-motion: the knob jumps instead of sliding and the panel does not fade. In forced-colours mode the track and knob are drawn with system colours.',
    ],
    usage: `<ContentToggle labels={['Monthly', 'Annual']} badge="Save 20%" param="billing" remember>
  <PricingTable slot="a" period="month" />
  <PricingTable slot="b" period="year" />
</ContentToggle>
<!-- A link to /pricing/?billing=annual opens on annual prices. -->

<ContentToggle labels={['For homeowners', 'For businesses and landlords']} style="buttons" label="Who it is for">
  <div slot="a">…</div>
  <div slot="b">…</div>
</ContentToggle>
<!-- .ct { --ct-track: var(--brand); --ct-pressed-bg: var(--brand); } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/content-toggle/ (demo)' }],
    file: 'src/library/content-toggle/ContentToggle.astro',
    added: '2026-09-26',
  },
  {
    id: 'off-canvas',
    name: 'Off-canvas panel',
    aka: ['UABB Off-Canvas', 'Elementor Off-Canvas', 'slide-out panel', 'side drawer', 'push menu', 'offcanvas', 'flyout panel', 'slide-in cart'],
    summary:
      'A native <dialog> that slides in from the left, right, top or bottom when any data-offcanvas-open trigger asks. Modal by default (backdrop, focus kept in, Escape, scroll lock keeping the scrollbar width), or push: non-modal, publishing --ofc-push for the host to move its page over. Focus returns to the opener. Without JavaScript the panel renders inline where it sits, and its #<id> link jumps to it.',
    pitch: 'Keep the cart, the filters or the account menu one tap away, sliding in from the edge instead of crowding the page.',
    // SE Ranking US, 2026-09-26: off canvas 140/mo, difficulty 35; push menu 110/13; off canvas
    // menu 70/24; slide out panel 70/6. "side drawer" 480/7 and "slide out drawer" 590/19 are
    // furniture and hardware; "flyout menu" 210/14 is main navigation, mega-menu's ground.
    search: { query: 'off canvas', alsoRanks: ['off canvas menu', 'slide out panel', 'push menu'] },
    replaces: ['UABB “Off-Canvas” module (Beaver Builder)', 'Elementor Pro Off-Canvas widget', 'slide-out cart and side-cart plugins', 'push-menu and slide-panel jQuery plugins'],
    goodFor:
      'Things that belong beside the page and are wanted now and then: a cart, product filters, an account or secondary menu, a short form (a callback request), a notice, a table of contents on a long page. Push mode suits a panel people keep open while they read, such as notes or a contents list.',
    notFor:
      'The site’s main navigation. mega-menu already folds its own links behind a Menu button below its breakpoint, in the header, keeping the nav landmark, aria-current on the page you are on, arrow-key movement and a no-JavaScript fallback; use that for the main menu on every screen size. Use off-canvas for what sits beside that menu (the cart, filters, an account menu), or for a secondary nav on a site whose main menu is plain header links. Also not for a message that must interrupt (that is modal) or content everyone needs (that belongs on the page).',
    props: [
      { name: 'id', type: 'string', note: 'Required. Any element with data-offcanvas-open="<id>" opens it; a link to #<id> reaches it without JavaScript.' },
      { name: 'title', type: 'string', note: 'Required. The panel’s heading and accessible name (aria-labelledby).' },
      { name: 'hideTitle', type: 'boolean', default: 'false', note: 'Hide the heading visually; it still names the panel.' },
      { name: 'side', type: "'left' | 'right' | 'top' | 'bottom'", default: "'left'", note: 'The edge it slides from. Left and right take the full height; top and bottom the full width.' },
      { name: 'mode', type: "'modal' | 'push'", default: "'modal'", note: 'modal: backdrop, page inert, scroll locked. push: non-modal, no backdrop; publishes --ofc-push (its size) and data-ofc-push (its side) on <html> while open.' },
      { name: 'closeLabel', type: 'string', default: '“Close”', note: 'Name of the 44px close button.' },
      { name: 'closeOnBackdrop', type: 'boolean', default: 'true', note: 'Close on a click on the backdrop (modal). A text selection dragged out of the panel never closes it.' },
      { name: 'headingLevel', type: '2 | 3 | 4', default: '2', note: 'Level of the title’s heading.' },
      { name: 'slot (default)', type: 'slot', note: 'The content: a <nav>, a form, a cart, a promo. A <form method="dialog"> inside closes it on submit.' },
      { name: 'class', type: 'string', note: 'Class on the <dialog>, for the host to theme it.' },
    ],
    theming: [
      { name: '--ofc-size', fallback: 'min(22rem, 88vw) · auto', note: 'Width of a left or right panel; height of a top or bottom one (at most 85dvh).' },
      { name: '--ofc-bg', fallback: '#fff', note: 'The panel (14.75:1 with its text).' },
      { name: '--ofc-fg', fallback: '#1e283c', note: 'Text in the panel.' },
      { name: '--ofc-backdrop', fallback: 'rgb(15 20 35 / 0.55)', note: 'Behind a modal panel.' },
      { name: '--ofc-shadow', fallback: '0 0 3rem rgb(0 0 0 / 0.25)', note: 'The panel’s shadow.' },
      { name: '--ofc-padding', fallback: 'clamp(1rem, 4vw, 1.5rem)', note: 'Inside the panel.' },
      { name: '--ofc-close-bg', fallback: 'transparent', note: 'Close button fill (a faint grey on hover).' },
      { name: '--ofc-close-fg', fallback: 'currentColor', note: 'Close icon.' },
      { name: '--ofc-focus', fallback: 'currentColor', note: 'Focus ring inside the panel.' },
      { name: '--ofc-z', fallback: '110', note: 'Stacking of a push panel, below the cookie-consent bar (120). A modal panel is in the browser’s top layer, like every modal dialog.' },
      { name: '--ofc-duration', fallback: '0.28s', note: 'Slide time; none under reduced motion.' },
      { name: '--ofc-border', fallback: '#dfe3ea', note: 'Border of the inline panel without JavaScript.' },
      { name: '--ofc-push', fallback: '(published)', note: 'Set BY the element on <html> in push mode: the panel’s width (or height), 0px when closed. The host moves its page: html[data-ofc-push="left"] .site { translate: var(--ofc-push) 0; }' },
    ],
    a11y: [
      'A native <dialog> named by its title (aria-labelledby). Modal mode uses showModal(): the page is inert, Tab stays in the panel, Escape closes it, and the page does not scroll underneath, with the scrollbar’s width kept so nothing shifts.',
      'Push mode is non-modal (show()): the page stays usable beside it, and Escape closes it while focus is in the panel or on its trigger.',
      'Triggers get aria-controls and aria-expanded (and aria-haspopup="dialog" in modal mode). A trigger that is not a link or button gets role="button" and tabindex="0" and opens on Enter or Space.',
      'Focus moves into the panel on open and returns to the opener on close. The close button is a real 44px <button> named by closeLabel. A backdrop click closes a modal panel; a text selection dragged out of it does not.',
      'Without JavaScript the panel renders inline, visible, under its heading, at its place in the page; a link trigger to #<id> jumps to it; the close button, which could not work, is not shown.',
      'prefers-reduced-motion: the panel appears and goes at once, with no slide and no backdrop fade.',
    ],
    usage: `<!-- A link keeps working without JavaScript: it jumps to the panel, which then reads inline. -->
<a href="#cart" data-offcanvas-open="cart">Cart (2)</a>
<OffCanvas id="cart" title="Your cart" side="right">
  <CartSummary />
</OffCanvas>

<!-- Push: the page moves over by the panel's width. -->
<button type="button" data-offcanvas-open="contents">Contents</button>
<OffCanvas id="contents" title="On this page" mode="push">…</OffCanvas>
<!-- global.css:
  .ofc { --ofc-bg: var(--white); --ofc-fg: var(--ink); }
  .site { transition: translate 0.28s; }
  html[data-ofc-push="left"] .site { translate: var(--ofc-push) 0; }
  @media (prefers-reduced-motion: reduce) { .site { transition: none; } } -->`,
    usedOn: [{ site: 'superherotech.ai', where: '/elements/off-canvas/ (demo)' }],
    file: 'src/library/off-canvas/OffCanvas.astro',
    added: '2026-09-26',
  },
  {
    id: 'video-gallery',
    name: 'Video gallery',
    aka: ['UABB Video Gallery', 'PowerPack Video Gallery', 'Elementor Video Playlist', 'YouTube gallery', 'Vimeo gallery', 'video grid', 'filterable video gallery'],
    summary:
      'A grid of YouTube, Vimeo or self-hosted videos, each behind your own poster and a play button, with optional category filter chips. A click plays the video in one lightbox dialog or in the tile itself. Nothing is requested from YouTube or Vimeo until a tile is pressed.',
    pitch: 'All your videos on one page, sorted by topic, with your own thumbnails, and nothing loads from YouTube until someone picks one.',
    // SE Ranking US, 2026-09-26: video gallery 590/mo, difficulty 20; youtube gallery 210/8;
    // video gallery wordpress 50/28; video gallery website 40/13 (the round-3 note's first
    // guess, which "video gallery" beats on volume at a similar difficulty). video grid 390/34
    // is a stock-footage and editing query, left unclaimed.
    search: { query: 'video gallery', alsoRanks: ['youtube gallery', 'video gallery website', 'video gallery wordpress'] },
    replaces: ['UABB / PowerPack “Video Gallery” modules (Beaver Builder)', 'Elementor Pro Video Playlist', 'YouTube gallery plugins', 'a page of pasted YouTube iframes'],
    goodFor: 'A page of several videos: testimonials, a how-to library, event recordings, a portfolio of films. Categories when there are enough to be worth sorting.',
    notFor:
      'One video on its own (that is video-player), an ambient loop behind a hero (video-background), and a whole channel kept in sync by itself: the list is written into the page, so a new upload means an edit. Galleries of photos are not this either.',
    props: [
      { name: 'videos', type: '{ url, title, caption?, poster?, category?, tracks? }[]', note: 'Required. `url` takes what video-player’s `src` takes: a YouTube URL or id (watch, youtu.be, shorts, embed), a Vimeo URL or id, a .mp4/.webm URL, or [{ src, type }]. Anything else fails the build. `title` is required. `category` is one string or several.' },
      { name: 'mode', type: "'lightbox' | 'inline'", default: "'lightbox'", note: 'Lightbox plays in one <dialog> over the page. Inline replaces the tile’s poster with the player; pressing another tile puts it back.' },
      { name: 'columns', type: 'number (1–6)', default: '3', note: 'The most tiles per row. Fewer when a tile would be narrower than --vg-min; one on a phone. Set --vg-template instead for the host’s own grid.' },
      { name: 'filter', type: 'boolean', default: 'two or more categories', note: 'Category chips above the grid, “All” first.' },
      { name: 'counts', type: 'boolean', default: 'false', note: 'Show how many videos each chip holds.' },
      { name: 'allLabel / filterLabel', type: 'string', default: '“All” / “Filter videos”', note: 'The first chip, and the accessible name of the chip group.' },
      { name: 'aspect', type: 'number | string', default: '16/9', note: 'Frame ratio of every tile and of the lightbox: 1.7778, "16/9", "4 / 3".' },
      { name: 'autoplay', type: 'boolean', default: 'true', note: 'Start playing on the click. False shows the player and waits for a second press.' },
      { name: 'titleTag', type: "'h2' | 'h3' | 'h4' | 'p'", default: "'h3'", note: 'Element for each tile’s title, to fit the page’s heading outline.' },
      { name: 'playLabel / closeLabel', type: 'string', default: '“Play” / “Close video”', note: 'Words, for a non-English site. playLabel prefixes each title in the button’s name.' },
      { name: 'playIcon', type: 'string', note: 'Inline SVG markup for the play icon. Use currentColor and 1em.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--vg-min', fallback: '14rem', note: 'No tile narrower than this; below it the row drops a column.' },
      { name: '--vg-gap', fallback: '1.25rem', note: 'Gap between tiles.' },
      { name: '--vg-template', fallback: '(unset)', note: 'The whole grid-template-columns, when the host wants its own grid: `repeat(4, 1fr)`.' },
      { name: '--vg-radius', fallback: '0.5rem', note: 'Corner radius of each frame.' },
      { name: '--vg-bg', fallback: '#000', note: 'Frame colour behind the poster and the player.' },
      { name: '--vg-panel', fallback: 'linear-gradient(135deg, #2c3656, #1e283c)', note: 'A tile without a poster.' },
      { name: '--vg-overlay', fallback: 'rgb(0 0 0 / 0.12)', note: 'Tint over the poster.' },
      { name: '--vg-play-bg', fallback: 'rgb(0 0 0 / 0.7)', note: 'Play button circle. Keep 3:1 against the posters.' },
      { name: '--vg-play-fg', fallback: '#fff', note: 'Play icon.' },
      { name: '--vg-play-size', fallback: '3.5rem', note: 'Diameter of the circle.' },
      { name: '--vg-focus', fallback: '#5933d8', note: 'Focus ring on tiles and chips.' },
      { name: '--vg-title', fallback: 'inherit', note: 'Tile title colour.' },
      { name: '--vg-caption', fallback: 'inherit', note: 'Caption colour.' },
      { name: '--vg-chip-bg', fallback: '#fff', note: 'Chip fill.' },
      { name: '--vg-chip-fg', fallback: '#1e283c', note: 'Chip text (14.75:1 on the fallback fill).' },
      { name: '--vg-chip-border', fallback: '#c9cedb', note: 'Chip outline.' },
      { name: '--vg-chip-on-bg', fallback: '#1e283c', note: 'The pressed chip’s fill.' },
      { name: '--vg-chip-on-fg', fallback: '#fff', note: 'The pressed chip’s text.' },
      { name: '--vg-backdrop', fallback: 'rgb(0 0 0 / 0.88)', note: 'Lightbox backdrop.' },
      { name: '--vg-close-bg', fallback: 'rgb(255 255 255 / 0.15)', note: 'Lightbox close button fill.' },
      { name: '--vg-close-fg', fallback: '#fff', note: 'Lightbox close icon and title.' },
    ],
    a11y: [
      'Each tile’s play control is a real <button> named “Play: <title>”, over the whole poster, with a visible focus ring. The title is also printed under the tile as a heading (titleTag).',
      'Filter chips are a labelled group of <button aria-pressed>, “All” first and pressed. Choosing one hides the other tiles and a polite live region says how many are shown (“Open films: 3 videos.”).',
      'Lightbox: one native modal <dialog>, named by the video’s title: focus trapped, Escape and a backdrop click close it, the close button is labelled. On open the video starts and focus goes to the close button, because a YouTube or Vimeo iframe keeps every key, Escape included; Tab moves on into the player. Closing empties the dialog so the sound stops, returns focus to the tile and releases the scroll lock.',
      'Inline: focus moves into the player (the titled iframe, or the <video>). One tile plays at a time.',
      'Self-hosted files keep the browser’s native controls with a captions menu. A captions track is expected (WCAG 1.2.2); the build warns without one.',
      'prefers-reduced-motion: tiles shown by a filter appear at once instead of fading in, and the play button does not grow on hover. Nothing plays until asked.',
      'Without JavaScript every tile is a link to the video’s own page (“Watch “<title>” on YouTube”), or to the file, and every video is listed: the chips are not shown.',
    ],
    usage: `<VideoGallery
  videos={[
    { url: 'https://www.youtube.com/watch?v=VIDEO_ID', title: 'Planting garlic', poster: '/images/garlic.webp', category: 'How-to' },
    { url: 'https://vimeo.com/123456789', title: 'Spring open day', poster: '/images/open-day.webp', category: 'Events' },
    { url: '/video/tour.mp4', title: 'A tour of the farm', poster: '/video/tour.webp',
      tracks: [{ src: '/video/tour.en.vtt', srclang: 'en', label: 'English' }], category: 'Events' },
  ]}
  counts
/>
<!-- .videos { --vg-play-bg: var(--brand); --vg-radius: var(--radius); --vg-chip-on-bg: var(--brand); } -->`,
    license:
      'The videos stay yours, or their owners’: the gallery plays them from YouTube, Vimeo or your own site, under those services’ terms, and adds nothing of its own. The films in our demo are the Blender Foundation’s open films Big Buck Bunny and Sintel, CC BY 3.0, credited under each one as that licence asks.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/video-gallery/ (demo)' }],
    file: 'src/library/video-gallery/VideoGallery.astro',
    added: '2026-09-26',
  },
  {
    id: 'map',
    name: 'Map and directions',
    aka: ['UABB Google Map', 'PowerPack Google Map', 'Elementor Google Maps', 'WP Google Maps', 'Google Maps embed', 'store locator', 'location card', 'get directions button'],
    summary:
      'A card per location with the address, phone and an optional hours line, “Open in Google Maps” and “Directions” links, and an optional map that loads from Google only when someone presses “Show the map”. No API key, and nothing from Google at page load.',
    pitch: 'Show people where you are and get them there in one tap, without a Google script on every page.',
    // SE Ranking US, 2026-09-26: google map embed code for website 170/mo, difficulty 35;
    // google maps embed 590/41; google maps directions link 390/34; google maps link 320/20.
    // The round-3 note's "map embed without api key" (and "google map embed without api key")
    // have no data. "store locator" 2,400/65 is a different product (search by distance) and
    // stays an aka.
    search: { query: 'google map embed code for website', alsoRanks: ['google maps embed', 'google maps directions link', 'google maps link'] },
    replaces: ['UABB / PowerPack “Google Map” modules (Beaver Builder)', 'Elementor’s Google Maps widget', 'WP Google Maps and similar plugins', 'a Google Maps <iframe> pasted into the footer'],
    goodFor: 'A contact or visit page, a footer with the address, several branches each with its own card. Anywhere the question is “where is it and how do I get there”.',
    notFor:
      'A styled, branded or interactive map: custom colours, your own markers, clustering, a store locator that searches by distance. That needs the Google Maps JavaScript API, which needs an API key and a billing account, loads Google’s script on every visit, and adds Google’s map origins to the site’s CSP and consent policy; quote it as its own piece of work. Full opening hours are business-hours, which also owns the LocalBusiness structured data.',
    props: [
      { name: 'locations', type: '{ name, address, phone?, hours?, query?, photo?, embed? }[]', note: 'Required. `address` is its lines, as on an envelope. `query` is what Google searches for, by default the address; give “Business name, address” when Google knows the business, so its place card opens. `photo` is the facade image for the embed. `embed` overrides the element’s for this card.' },
      { name: 'embed', type: 'boolean', default: 'false', note: 'Offer the click-to-load map on each card. Off, the cards are links only.' },
      { name: 'zoom', type: 'number (1–21)', default: 'Google’s choice', note: 'Zoom of the embedded map: 15 is a neighbourhood, 18 a street.' },
      { name: 'layout', type: "'stack' | 'split'", default: "'stack'", note: 'Stack: the map above the details, cards in a grid. Split: the map beside the details when there is room, one card per row.' },
      { name: 'titleTag', type: "'h2' | 'h3' | 'h4'", default: "'h3'", note: 'Element for each card’s name.' },
      { name: 'openLabel / directionsLabel / showLabel / notice', type: 'string', default: '“Open in Google Maps” / “Directions” / “Show the map” / “Loads a map from Google.”', note: 'Words, for a non-English site.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--map-min', fallback: '18rem', note: 'Narrowest card before the list drops a column.' },
      { name: '--map-gap', fallback: '1.25rem', note: 'Gap between cards.' },
      { name: '--map-surface', fallback: '#fff', note: 'Card background, and the “Show the map” pill.' },
      { name: '--map-text', fallback: '#1e283c', note: 'Card text (14.75:1 on the fallback surface).' },
      { name: '--map-border', fallback: '#d5dae6', note: 'Card outline.' },
      { name: '--map-radius', fallback: '0.75rem', note: 'Corners of cards and buttons.' },
      { name: '--map-accent', fallback: '#5933d8', note: '“Open in Google Maps” button fill.' },
      { name: '--map-on-accent', fallback: '#fff', note: 'Its text. Keep 4.5:1 against --map-accent (the fallbacks are 7.27:1; `npm run check` computes them).' },
      { name: '--map-link', fallback: '#4a2bb8', note: '“Directions” and the phone number.' },
      { name: '--map-aspect', fallback: '16 / 10', note: 'The map’s width / height.' },
      { name: '--map-panel', fallback: '#e9ecf3', note: 'The neutral facade (no photo).' },
      { name: '--map-panel-line', fallback: '#d3d8e4', note: 'Its street lines.' },
      { name: '--map-pin', fallback: '#5933d8', note: 'The pin on the neutral facade.' },
      { name: '--map-focus', fallback: '#5933d8', note: 'Focus rings.' },
      { name: '--map-notice', fallback: '#4b5468', note: 'The “Loads a map from Google.” line.' },
    ],
    a11y: [
      'Each address is an <address> under the location’s heading; the phone number is a tel: link.',
      'The links name their place for a screen reader (“Open in Google Maps: Navy Pier”, “Directions to Navy Pier”), so a list of links still makes sense. Both are at least 44px tall.',
      'The facade is a real <button> named “Show the map of <name>”, described by the visible notice “Loads a map from Google.”, so nobody loads a third party without being told. Pressed, it becomes an <iframe> titled “Map of <name>” and focus moves into it.',
      'Nothing moves except the button’s pill growing slightly on hover, which prefers-reduced-motion removes.',
      'Without JavaScript the cards and their links are all there, and the facade is not shown: a button that could not work is not rendered.',
    ],
    usage: `---
import LocationMap from '../components/LocationMap.astro';   // not "Map": that would shadow JavaScript's Map
---
<LocationMap
  embed
  locations={[{
    name: 'The Garden Shop',
    address: ['123 Main St', 'Springfield, IL 62701'],
    phone: '(217) 555-0100',
    hours: 'Open daily, 8 AM to 6 PM',
    query: 'The Garden Shop, 123 Main St, Springfield, IL 62701',
    photo: '/images/storefront.webp',
  }]}
  layout="split"
/>
<!-- _headers: the embed needs frame-src https://www.google.com in the site's CSP; the links need nothing. -->`,
    license:
      'No API key and no Google account are involved. The links are Google’s public Maps URLs, and the map you choose to load is Google’s own embed, shown under Google’s terms with its attribution inside the frame. The pin on the plain facade is Font Awesome Free (CC BY 4.0).',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/map/ (demo)' }],
    file: 'src/library/map/LocationMap.astro',
    added: '2026-09-26',
  },
  {
    id: 'link-effects',
    name: 'Link effects',
    aka: ['UABB Creative Link', 'PowerPack Link Effects', 'creative link', 'underline animation', 'link hover effects', 'animated underline', 'text hover effects'],
    summary:
      'Eleven hover-and-focus styles for links, CSS only: underline-slide, underline-grow, brackets, highlight, box, strike-to-underline, arrow, circle, and three of ours, peek, swash and tag. A class on any <a>, or the <Link effect> wrapper. Focus shows what hover shows, reduced motion shows the end state at once, and the text never drops below 4.5:1 mid-animation.',
    pitch: 'Links that answer back when you point at them, and never leave a keyboard user or a slow eye behind.',
    // SE Ranking US, 2026-09-26: underline animation css 590/mo, difficulty 20; css link hover
    // effects 110/26; link hover effects 90/30; css text hover effects 90/27. The round-3 note's
    // "link hover effects" is the closest name but a sixth of the volume at a higher difficulty;
    // five of the eleven effects are underlines, so the page leads with them. "css hover
    // effects" 480/31 covers buttons and images too and stays unclaimed.
    search: { query: 'underline animation css', alsoRanks: ['css link hover effects', 'link hover effects', 'css text hover effects'] },
    replaces: ['UABB “Creative Link” (Beaver Builder)', 'PowerPack “Link Effects”', 'hover.css and underline snippets pasted into a theme'],
    goodFor:
      'Navigation, a card’s call to action, footer links, a “Read more”: short links that should feel alive. underline-grow also suits links in running text, because it is underlined at rest. peek suits a link whose destination has a one-word answer: “Pricing” → “$49/mo”, “Hours” → “Open now”.',
    notFor:
      'Links in a paragraph with any effect that has no underline at rest (all but underline-grow and peek): a link must look like a link before anyone points at it, and colour alone does not say so. Buttons, which are not links. More than one or two effects on a site: pick one for navigation and one for calls to action, and keep them.',
    props: [
      { name: 'effect', type: "'underline-slide' | 'underline-grow' | 'brackets' | 'highlight' | 'box' | 'strike-to-underline' | 'arrow' | 'circle' | 'peek' | 'swash' | 'tag'", note: 'With `href`, renders <a class="lk-<effect>">. Leave both out (<LinkEffects />) to emit only the stylesheet, once, e.g. in the layout.' },
      { name: 'href', type: 'string', note: 'The link. Required with `effect`.' },
      { name: 'peek', type: 'string', note: 'For effect="peek": the words that slide in, set as data-peek. Part of the link’s accessible name.' },
      { name: 'class', type: 'string', note: 'More classes on the <a>.' },
      { name: '…rest', type: '<a> attributes', note: 'Passed through: target, rel, aria-current, download.' },
    ],
    theming: [
      { name: '--lk-accent', fallback: '#5933d8', note: 'Lines, brackets, frame, ring, swash, arrow and peek words, tag fill. Keep 4.5:1 against --lk-bg, since the arrow and peek words are text (the fallbacks are 7.27:1).' },
      { name: '--lk-ink', fallback: '#1e283c', note: 'The text colour highlight and tag pin: 14.75:1 on --lk-bg and 11.68:1 on --lk-mark.' },
      { name: '--lk-on-accent', fallback: '#fff', note: 'Tag text over its fill: 7.27:1 on --lk-accent.' },
      { name: '--lk-mark', fallback: '#ffe38f', note: 'The highlight marker.' },
      { name: '--lk-bg', fallback: '#fff', note: 'The page behind the links, and the tag’s resting fill. Set it to the section’s background so the check’s arithmetic matches.' },
      { name: '--lk-thickness', fallback: '2px', note: 'Line weight.' },
      { name: '--lk-duration', fallback: '0.3s', note: 'Length of each effect (swash takes 1.8×).' },
      { name: '--lk-ease', fallback: 'cubic-bezier(0.2, 0.7, 0.2, 1)', note: 'Easing.' },
    ],
    a11y: [
      'Every effect fires on :focus-visible exactly as on :hover (one selector, `:is(:hover, :focus-visible)`), and the browser’s own focus ring stays.',
      'prefers-reduced-motion: every transition sits inside `(prefers-reduced-motion: no-preference)`, so otherwise the end state appears at once. Nothing plays by itself.',
      'The text never drops below 4.5:1 mid-animation. Effects move decorations, not the text colour; highlight pins the text to --lk-ink, which passes on the page and on the marker; tag paints its text and fill as two layers of one background moving together, so each pixel of text is one passing pair or the other. `npm run check` computes the fallback pairs.',
      'Decorative glyphs (the brackets, the arrow) are silent to screen readers, and the swash SVG is aria-hidden. The peek words are read as part of the link’s name (“Pricing $49/mo”).',
      'Windows High Contrast (forced colours): system link colours, and the underline-based effects keep a real underline.',
      'No JavaScript at all, so the render without it is the same.',
    ],
    usage: `---
import LinkEffects from '../components/LinkEffects.astro';
import Link from '../components/LinkEffects.astro';   // the same file, as a wrapper
---
<head> … <LinkEffects /> </head>                    <!-- the stylesheet, once -->

<nav>
  <Link effect="underline-slide" href="/about/" aria-current="page">About</Link>
  <Link effect="peek" peek="$49/mo" href="/pricing/">Pricing</Link>
</nav>
<a class="lk-arrow" href="/book/">Book a visit</a>   <!-- or just the class -->
<!-- .site { --lk-accent: var(--brand); --lk-bg: var(--page); } -->`,
    license: 'Our own CSS and our own drawings (the swash and the ring). Nothing licensed from anyone else: no font, no icon set, no script.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/link-effects/ (demo)' }],
    file: 'src/library/link-effects/LinkEffects.astro',
    added: '2026-09-26',
  },
  {
    id: 'tabcordion',
    name: 'Tabcordion',
    aka: ['responsive tabs', 'tabs to accordion', 'accordion tabs', 'tabs on mobile', 'product details tabs', 'Easy Responsive Tabs'],
    summary:
      'One set of panels that is tabs when the element is wide and an accordion when it is narrow, decided by a CSS container query on its own width rather than the window. The ARIA follows the layout (tablist / tab / tabpanel, or buttons with aria-expanded), the open panel carries across the switch, and the accordion can hold several open. Without JavaScript every panel is open under its heading.',
    pitch: 'The same details as tabs where there is room and as an accordion where there is not, even in a sidebar, and the section someone was reading stays open when it changes.',
    // SE Ranking US, 2026-09-26: responsive accordion 320/mo, difficulty 32 (rising: 50/mo a
    // year ago); tabs on mobile 110/11; responsive tabs 40/35; tabs to accordion 10/34. The brief's
    // "responsive tabs accordion" and "tabcordion" have no measurable volume.
    search: { query: 'responsive accordion', alsoRanks: ['tabs on mobile', 'responsive tabs', 'tabs to accordion'] },
    replaces: ['A tabs widget and a toggle widget with the same content, one hidden on desktop and one on mobile (the usual Elementor and Divi workaround)', 'Easy Responsive Tabs and other tabs-to-accordion jQuery plugins'],
    goodFor:
      'A few sections that sit in columns of different widths: product details beside a gallery, a service’s scope in a card grid, visiting information in a sidebar. On a phone several sections can stay open at once, so people can compare two without reopening.',
    notFor:
      'A tab set that should stay tabs until the phone, or that needs a vertical strip, icons, manual activation or a #hash that follows the selection: use tabs, which decides by the window. A list of questions, FAQ schema, or answers that find-in-page should reach while closed: use accordion, which is native <details>. And anything everyone must read: behind a tab or a tap, most people never see it.',
    props: [
      { name: 'panels', type: 'TabcordionPanel[]', note: '`{ id, label, body?, slot? }`. `id` is the anchor (unique on the page); `body` an HTML string, or name a slot in `slot`.' },
      { name: 'label', type: 'string', note: 'Accessible name of the tab strip. Required.' },
      { name: 'breakpoint', type: '“sm” | “md” | “lg”', default: '“md”', note: 'The element’s own width from which it is tabs: 30rem, 40rem or 52rem. Narrower, it is an accordion. Tracked live.' },
      { name: 'multiple', type: 'boolean', default: 'true', note: 'Accordion: several panels open at once. false keeps one open.' },
      { name: 'selected', type: 'string', note: 'id of the panel selected, and open, first. Default: the first. A #id in the URL wins.' },
      { name: 'headingLevel', type: '2 | 3 | 4', default: '3', note: 'Level of each panel’s heading: shown without JavaScript, and holding the accordion button.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--tcd-accent', fallback: 'currentColor', note: 'Selected tab marker and the accordion chevron.' },
      { name: '--tcd-fg', fallback: 'inherit', note: 'Text, and the selected tab.' },
      { name: '--tcd-muted', fallback: 'currentColor at 72%', note: 'Unselected tabs.' },
      { name: '--tcd-bg', fallback: 'transparent', note: 'Panel, selected tab and open heading fill.' },
      { name: '--tcd-strip-bg', fallback: 'rgb(0 0 0 / 0.04)', note: 'Tab strip and closed accordion headings.' },
      { name: '--tcd-border', fallback: 'rgb(0 0 0 / 0.14)', note: 'Frame and rules.' },
      { name: '--tcd-radius', fallback: '0.5rem', note: 'Frame corners.' },
      { name: '--tcd-pad', fallback: '1.25rem', note: 'Panel and heading padding.' },
      { name: '--tcd-focus', fallback: 'currentColor', note: 'Keyboard focus ring.' },
    ],
    a11y: [
      'Tabs: tablist named by `label`, tab and tabpanel with aria-selected, aria-controls and aria-labelledby, a roving tabindex so the strip is one Tab stop; ← → wrap, Home and End jump to the ends, and a tab is selected when it gets focus. A panel with nothing focusable inside is itself focusable.',
      'Accordion: each heading holds a real button with aria-expanded and aria-controls; Enter and Space toggle, ↑ ↓ Home End move between headings. The tab strip is hidden and the panels lose their tabpanel role, so a screen reader never meets tab semantics it cannot use.',
      'One breakpoint, in the stylesheet: the script reads the layout the container query chose and sets the ARIA to match whenever the element changes width. The selected tab’s panel is open in the accordion, and the panel opened last is the selected tab when it widens again.',
      'Without JavaScript there is no tab strip and every panel is open under its label as a heading; #id links jump to the panel.',
      'prefers-reduced-motion: no panel fade and no chevron turn.',
    ],
    usage: `<Tabcordion
  label="Product details"
  panels={[
    { id: 'description', label: 'Description', body: '<p>…</p>' },
    { id: 'size', label: 'Size', slot: 'size' },
    { id: 'delivery', label: 'Delivery', body: '<p>…</p>' },
  ]}
>
  <div slot="size"><table>…</table></div>
</Tabcordion>

<aside class="sidebar">
  <Tabcordion label="Visiting" panels={visit} multiple={false} breakpoint="sm" />
</aside>
<!-- .product { --tcd-accent: var(--brand); --tcd-border: var(--line); --tcd-bg: var(--white); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/tabcordion/ (demo)' }],
    file: 'src/library/tabcordion/Tabcordion.astro',
    added: '2026-09-26',
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    aka: ['hover text', 'info icon', 'hint bubble', 'Tippy.js', 'Bootstrap tooltip', 'Elementor Hotspot tooltip'],
    summary:
      'A short line of text that describes a button or link, shown on hover and on keyboard focus, hidden by Escape, and placed above, below or beside its trigger with a flip and a slide when the window has no room. role="tooltip" attached with aria-describedby; the Popover API’s top layer where the browser has it. Without JavaScript the text shows in brackets after the trigger, or as its title.',
    pitch: 'A small explanation on a word or an info icon, there when someone points at it or tabs to it, and out of the way the rest of the time.',
    // SE Ranking US, 2026-09-26: tooltip html 320/mo, difficulty 24; tooltip ui 260/36;
    // accessible tooltip 50/14; html tooltip 10/36. The brief's "accessible tooltip" is kept
    // as a variant: the bigger query is the same page.
    search: { query: 'tooltip html', alsoRanks: ['accessible tooltip', 'tooltip ui', 'html tooltip'] },
    replaces: ['Page-builder tooltip add-ons and the tooltips of Elementor Pro’s Hotspot widget', 'Tippy.js, Popper and Bootstrap tooltips', 'title="…" attributes used as tooltips (mouse only, and never on a phone)'],
    goodFor: 'A term a visitor may not know, an info icon beside a price or a setting, an icon-only button that needs its name spelled out: one sentence that helps and can be skipped.',
    notFor:
      'Anything with a link, a button or a form in it: that is a popover (a disclosure, or modal), because a tooltip vanishes as soon as focus moves and nothing inside it can be reached. Information people need to complete a task, such as a password rule or a form field’s format: show it as visible hint text. And a phone-first page that leans on them: on touch they need a tap to see.',
    props: [
      { name: 'text', type: 'string', note: 'The tip. Plain text, a sentence at most; markup is refused at build time.' },
      { name: 'placement', type: '“top” | “bottom” | “left” | “right”', default: '“top”', note: 'Preferred side. With no room there it flips to the opposite side, then tries the other two, and slides along its side to stay 8px inside the window.' },
      { name: 'label', type: 'string', note: 'Icon-only trigger: its accessible name. The slot (the icon) is then decorative, and the trigger is a 44px target.' },
      { name: 'href', type: 'string', note: 'Make the trigger a link. A tap then follows the link; hover and focus still show the tip.' },
      { name: 'inline', type: 'boolean', default: 'true', note: 'Without JavaScript: the text in brackets after the trigger (true) or the trigger’s title (false).' },
      { name: 'id', type: 'string', default: 'generated', note: 'id of the tip, which the trigger’s aria-describedby names.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--tt-bg', fallback: '#1d2130', note: 'Tip fill (the fallback pair is 16.0:1; `npm run check` computes it).' },
      { name: '--tt-fg', fallback: '#fff', note: 'Tip text. Keep 4.5:1 on --tt-bg.' },
      { name: '--tt-radius', fallback: '0.375rem', note: 'Tip corners.' },
      { name: '--tt-max', fallback: '18rem', note: 'Widest the tip gets before it wraps.' },
      { name: '--tt-font-size', fallback: '0.875rem', note: 'Tip text size.' },
      { name: '--tt-trigger', fallback: 'inherit', note: 'Trigger colour (text and icon).' },
      { name: '--tt-focus', fallback: 'currentColor', note: 'Trigger focus ring.' },
      { name: '--tt-z', fallback: '1000', note: 'Stacking in browsers without the Popover API (elsewhere the tip is in the top layer).' },
    ],
    a11y: [
      'The trigger is a real <button type="button"> (or a link with `href`) whose aria-describedby names the role="tooltip" element, so a screen reader reads the text with the trigger whether or not the tip is showing.',
      'It shows on keyboard focus as well as on hover, never on hover only. Escape hides it without moving focus or the pointer; the pointer can move onto the tip without losing it; it stays until pointer and focus have both left (WCAG 1.4.13). One shows at a time.',
      'On touch, a tap on a button trigger shows it and a second tap, or a tap elsewhere, hides it.',
      'An icon-only trigger is named by `label`, its icon is aria-hidden, and it is at least 44 × 44 px.',
      'The tip holds plain text only: markup is refused when the site is built, so nothing interactive can end up where focus cannot reach it.',
      'Without JavaScript the text is in the page, in brackets after the trigger, or as the trigger’s title with `inline={false}`.',
      'prefers-reduced-motion: no fade.',
    ],
    usage: `<p>
  Arrives in <Tooltip text="Monday to Friday, not counting public holidays.">two working days</Tooltip>.
</p>

<Tooltip label="About next-day delivery" text="Order by 2 pm for delivery the next working day." placement="right">
  <Icon name="circle-info" />
</Tooltip>

<Tooltip href="/returns/" text="30 days from delivery.">returns policy</Tooltip>
<!-- .site { --tt-bg: var(--navy); --tt-focus: var(--brand); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/tooltip/ (demo)' }],
    file: 'src/library/tooltip/Tooltip.astro',
    added: '2026-09-26',
  },
  {
    id: 'responsive-table',
    name: 'Responsive table',
    aka: ['mobile table', 'table to cards', 'stacked table', 'TablePress responsive', 'data table', 'comparison table', 'price table'],
    summary:
      'A real <table> with a caption, scoped headers and right-aligned numbers, built from columns and rows. Below a breakpoint on its own width each row becomes a card, every value under its column’s name (CSS only, from data-label); or, in scroll mode, the table keeps its shape in a focusable scrollbox named by the caption, with edge fades and a one-time hint. Optional striped rows and sticky header. Without JavaScript: the table.',
    pitch: 'Timetables, prices and comparisons that read on a phone: a proper table on a wide screen, and a card per row, or a table you can swipe along, on a narrow one.',
    // SE Ranking US, 2026-09-26: responsive tables 140/mo, difficulty 8; responsive table
    // 140/23; responsive table html 110/25; responsive table css 110/0; responsive data table
    // 70/16; sticky table header 50/12. All falling from ~260 a year ago; the brief's
    // "responsive table html" is a variant of the easiest head term.
    search: { query: 'responsive tables', alsoRanks: ['responsive table html', 'responsive table css', 'responsive data table', 'sticky table header'] },
    replaces: ['TablePress with its Responsive Tables extension', 'Ninja Tables and wpDataTables for small, hand-kept tables', 'the page builder’s table widget that overflows the screen on a phone'],
    goodFor: 'Data people read across and down: class timetables, price lists, opening times by branch, plan comparisons, specifications. Cards when each row stands on its own; scroll when people compare down a column.',
    notFor:
      'Layout: a table puts a page’s columns in a grid only if they are data, never to line things up. Large, sortable or filterable data sets: that is a data-grid application, not a page element. And prose: a cell of paragraphs belongs in a list or an accordion.',
    props: [
      { name: 'caption', type: 'string', note: 'What the table is. Required: it names the table, and the scroll region.' },
      { name: 'captionHidden', type: 'boolean', default: 'false', note: 'Hide the caption visually (a heading above already says it); screen readers still announce it.' },
      { name: 'columns', type: 'Column[]', note: '`{ key, label, numeric?, html? }`. `label` is the header and each cell’s data-label; `numeric` overrides the detection; `html` renders the cells as HTML (a link).' },
      { name: 'rows', type: 'Record<string, string | number | null>[]', note: 'One object per row, keyed by column `key`. A null or missing value is an empty cell (left out of its card).' },
      { name: 'rowHeader', type: 'string | false', default: 'the first column', note: 'Key of the column whose cells head their row (<th scope="row">, the card’s title). false for none.' },
      { name: 'mode', type: '“cards” | “scroll”', default: '“cards”', note: 'Cards below the breakpoint, or always a horizontal scrollbox.' },
      { name: 'breakpoint', type: '“sm” | “md” | “lg”', default: '“md”', note: 'Cards: the element’s own width below which rows become cards: 30rem, 40rem or 52rem.' },
      { name: 'sticky', type: 'boolean', default: 'false', note: 'The header row stays in view (offset by --rt-sticky-top). In scroll mode it needs `maxHeight`.' },
      { name: 'maxHeight', type: 'string (CSS length)', note: 'Scroll mode: the box’s greatest height; it then scrolls down as well.' },
      { name: 'striped', type: 'boolean', default: 'false', note: 'Tint alternate rows.' },
      { name: 'hint', type: 'string', default: '“Scroll sideways for more”', note: 'Scroll mode: shown under the box while it overflows, until the first scroll.' },
      { name: 'class', type: 'string', note: 'Class on the wrapper, for the host to theme it.' },
    ],
    theming: [
      { name: '--rt-fg', fallback: 'inherit', note: 'Text.' },
      { name: '--rt-muted', fallback: 'currentColor at 70%', note: 'Card labels and the scroll hint.' },
      { name: '--rt-border', fallback: 'rgb(0 0 0 / 0.14)', note: 'Rules and card borders.' },
      { name: '--rt-head-bg', fallback: 'rgb(0 0 0 / 0.04)', note: 'Header row fill.' },
      { name: '--rt-head-fg', fallback: 'inherit', note: 'Header row text.' },
      { name: '--rt-stripe', fallback: 'rgb(0 0 0 / 0.035)', note: 'Alternate rows with `striped`.' },
      { name: '--rt-card-bg', fallback: 'transparent', note: 'Card fill; also under a sticky header (Canvas when unset).' },
      { name: '--rt-radius', fallback: '0.5rem', note: 'Card and scrollbox corners.' },
      { name: '--rt-pad', fallback: '0.6rem 0.8rem', note: 'Cell padding.' },
      { name: '--rt-fade', fallback: '2.5rem', note: 'Width of the scroll-edge fade.' },
      { name: '--rt-sticky-top', fallback: '0px', note: 'Offset of a sticky header, for a sticky site header above it.' },
      { name: '--rt-focus', fallback: 'currentColor', note: 'Focus ring of the scrollbox.' },
    ],
    a11y: [
      'A real <table>: a <caption> names it, column headers are <th scope="col">, the row header column is <th scope="row">, so a screen reader announces each cell with its headers.',
      'Explicit roles (table, rowgroup, row, columnheader, rowheader, cell) keep it a table when the cards restyle its rows as blocks, which otherwise drops table semantics in Chrome and Safari.',
      'Cards take each label from the cell’s data-label, written at build time from the header text, so the two cannot drift. The label is drawn with empty alternative text, so a screen reader hears the column header once, not twice. Empty cells are left out of the card.',
      'Scroll mode: the box is a region named by the caption and is focusable, so arrow keys scroll it; when nothing overflows it is not a Tab stop. The hint is aria-hidden: it is for eyes, the table is already navigable.',
      'Numbers are right-aligned with tabular figures, header included, so columns of prices and counts line up.',
      'No motion. Without JavaScript it is the table (cards need no script); a scroll box scrolls without its fades.',
    ],
    usage: `<ResponsiveTable
  caption="Classes this week"
  columns={[
    { key: 'name', label: 'Class' },
    { key: 'day', label: 'Day' },
    { key: 'price', label: 'Price' },        // detected as numeric
  ]}
  rows={[{ name: 'Wheel throwing', day: 'Tuesday', price: '$45.00' }, …]}
  striped
/>

<ResponsiveTable caption="Plans compared" columns={cols} rows={plans} mode="scroll" sticky maxHeight="24rem" />
<!-- .site { --rt-border: var(--line); --rt-head-bg: var(--tint); --rt-card-bg: var(--white); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/responsive-table/ (demo)' }],
    file: 'src/library/responsive-table/ResponsiveTable.astro',
    added: '2026-09-26',
  },
  {
    id: 'notice',
    name: 'Notice',
    aka: ['alert box', 'info box', 'callout box', 'Bootstrap alert', 'message box', 'UABB Info Box', 'Elementor Alert widget', 'inline message'],
    summary:
      'A message in the page, in one of four kinds (info, success, warning, danger), each with its colours and a Font Awesome Free icon, an optional title and an optional close button remembered for the visit. role="status" for info and success, role="alert" for warning and danger; the kind is also said in words.',
    pitch: 'Say what just happened, or what needs attention, right where it applies, in a colour that says how much it matters.',
    // SE Ranking US, 2026-09-26: inline alert 260/mo, difficulty 13; alert banner 210/12;
    // css alert box 260/38; callout box 330/17. The pre-assigned "alert banner component" has
    // no US volume, so the page targets "inline alert", which is also what this is (the banner
    // across the top of a site is announcement-bar).
    search: { query: 'inline alert', alsoRanks: ['alert banner', 'css alert box', 'callout box'] },
    replaces: ['Bootstrap alerts', 'page-builder alert / info box / notice modules', 'hand-built callout boxes with a coloured border'],
    goodFor:
      'The state of the page or of a form after an action (“Your changes were saved”, “We could not take the payment”), a condition people need before they act (“Only 3 places left”), a note that holds for a while (“Classes resume on Monday”). One notice near what it is about.',
    notFor:
      'A message across the top of the whole site (that is announcement-bar), a confirmation that should vanish on its own (toast), or form-field errors, which belong beside their field with aria-describedby. And not several on one screen: when everything is a warning, nothing is.',
    props: [
      { name: 'kind', type: "'info' | 'success' | 'warning' | 'danger'", default: "'info'", note: 'Colours, icon, role and the word read before the message.' },
      { name: 'title', type: 'string', note: 'A short bold line above the text.' },
      { name: 'text', type: 'string', note: 'The message, when not given as the default slot. The slot takes links and paragraphs.' },
      { name: 'icon', type: 'string | false', note: 'A Font Awesome Free solid icon name in place of the kind’s own (circle-info, circle-check, triangle-exclamation, circle-exclamation), or false for none. An unknown name fails the build.' },
      { name: 'dismissible', type: 'boolean', default: 'false', note: 'A close button; the dismissal is kept in sessionStorage for the rest of the visit.' },
      { name: 'key', type: 'string', default: 'from a hash of the content', note: 'sessionStorage key of the dismissal. Give a stable one when the notice’s words change often.' },
      { name: 'version', type: 'string', default: 'a hash of the content', note: 'Change it to show the notice again to people who closed it; new words do that by themselves.' },
      { name: 'dismissLabel', type: 'string', default: '“Dismiss”', note: 'Name of the close button.' },
      { name: 'kindLabel', type: 'string', default: '“Information” / “Success” / “Warning” / “Error”', note: 'The kind in words, read (not shown) before the message.' },
      { name: 'class', type: 'string', note: 'Class on the notice.' },
    ],
    theming: [
      { name: '--ntc-info-bg / -fg / -accent', fallback: '#edf4fc / #12385f / #1c5fa8', note: 'kind="info": ground, text (10.79:1), edge and icon (5.83:1).' },
      { name: '--ntc-success-bg / -fg / -accent', fallback: '#ebf6ee / #14502b / #1d7a3b', note: 'kind="success": text 8.57:1, accent 4.86:1.' },
      { name: '--ntc-warning-bg / -fg / -accent', fallback: '#fdf4de / #553800 / #9a5b00', note: 'kind="warning": text 9.82:1, accent 4.95:1.' },
      { name: '--ntc-danger-bg / -fg / -accent', fallback: '#fcecec / #7a1717 / #b42318', note: 'kind="danger": text 9.35:1, accent 5.74:1.' },
      { name: '--ntc-radius', fallback: '8px', note: 'Corners.' },
      { name: '--ntc-padding', fallback: '0.875rem 1rem', note: 'Inside the notice.' },
      { name: '--ntc-font-size', fallback: '1rem', note: 'Text size.' },
      { name: '--ntc-focus', fallback: 'currentColor', note: 'Focus ring on links and the close button.' },
    ],
    a11y: [
      'role="status" for info and success, role="alert" for warning and danger. A screen reader announces a live region when its content arrives or changes: a notice the host inserts after an action is announced, one rendered with the page is read in place.',
      'The kind is said in words as well as colour and icon: a visually hidden “Warning:” (or `kindLabel`) leads the title or the text. The icon is aria-hidden.',
      'The close button is a real 44px <button> named “Dismiss”. After a dismiss, focus moves to the next focusable thing on the page.',
      'Every kind’s fallback text is at least 4.5:1 on its ground and its accent at least 3:1; `npm run check` computes all eight. In forced-colours mode the edge and icon take the system text colour.',
      'No motion.',
      'Without JavaScript the notice shows and cannot be closed: the close button stays hidden rather than doing nothing.',
    ],
    usage: `<Notice kind="success" text="Your changes were saved." />

<Notice kind="warning" title="Only 3 places left" dismissible key="june-course">
  The June course is nearly full. <a href="/book/">Book a place</a>
</Notice>
<!-- global.css: .ntc { --ntc-info-accent: var(--brand); --ntc-radius: var(--radius); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/notice/ (demo)' }],
    file: 'src/library/notice/Notice.astro',
    added: '2026-09-26',
  },
  {
    id: 'toast',
    name: 'Toast',
    aka: ['snackbar', 'toast notification', 'toastr', 'Notyf', 'flash message', 'pop-up notification', 'growl notification'],
    summary:
      'A short message in a corner after something happened, made by script: window.__superheroToast.show({ text, kind, action, timeout }) or a data-toast button. One polite live region per page; timers pause on hover, on focus and in a hidden tab; a toast with an action never leaves by itself; at most three at once; Escape closes the focused one; no slide under reduced motion. Without JavaScript nothing renders.',
    pitch: 'A quiet “Saved” or “Link copied” in the corner that confirms the click and gets out of the way, with an Undo when one is needed.',
    // SE Ranking US, 2026-09-26: toast notifications 320/mo, difficulty 32; toast notification
    // 1,100/67; toast popup 210/33; html toast 70/26. The pre-assigned "toast notification html"
    // has no US volume; the plural is the reachable head term and the singular a variant.
    search: { query: 'toast notifications', alsoRanks: ['toast notification', 'toast popup', 'html toast'] },
    replaces: ['toastr / Notyf / SweetAlert toasts', 'page-builder notification pop-ins', 'Material snackbars'],
    goodFor:
      'Confirming an action that worked where the visitor already is: saved, copied, sent, added to the cart, archived (with Undo). Short, and fine to miss, because the page already shows the result.',
    notFor:
      'Anything that must be read or that must exist without JavaScript: errors a visitor has to fix, a form’s result, a warning before they act. Those are a notice, in the page. Also not for marketing (that is modal or announcement-bar), and not a second <Toast /> on a page: there is one region.',
    props: [
      { name: 'position', type: "'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'", default: "'bottom-right'", note: 'The corner the region is fixed to. A bottom corner rises above the cookie-consent bar while that shows. On a phone the region spans the width.' },
      { name: 'label', type: 'string', default: '“Notifications”', note: 'The region’s accessible name.' },
      { name: 'timeout', type: 'number (ms)', default: '6000', note: 'How long a toast stays when show() does not say. 0 keeps toasts until closed. Anything under 4000 is raised to 4000.' },
      { name: 'closeLabel', type: 'string', default: '“Dismiss notification”', note: 'Name of each toast’s close button.' },
      { name: 'kindLabels', type: 'Partial<Record<kind, string>>', default: 'info none, then Success / Warning / Error', note: 'The word read (not shown) before a toast’s text.' },
      { name: 'class', type: 'string', note: 'Class on the region.' },
      { name: 'show({ text, kind?, action?, timeout? })', type: 'script API', note: 'window.__superheroToast.show() returns { element, dismiss(), open }. text is plain text. kind is info, success, warning or danger. action is { label, onClick?(event, handle) } or { label, href } (http(s), mailto, tel or relative; anything else is refused). Also clear() and count.' },
      { name: 'data-toast', type: 'attribute', note: 'On any button: its value is the text. Optional data-toast-kind, data-toast-timeout, data-toast-action (a label) with data-toast-href.' },
    ],
    theming: [
      { name: '--ts-bg', fallback: '#1e283c', note: 'The toast.' },
      { name: '--ts-fg', fallback: '#fff', note: 'Its text (14.75:1).' },
      { name: '--ts-action', fallback: '#c4b5ff', note: 'The action’s text, underlined (8.01:1).' },
      { name: '--ts-info / --ts-success / --ts-warning / --ts-danger', fallback: '#8cc2ff / #7fdc9c / #ffd166 / #ffa3a3', note: 'Icon colours per kind, each at least 7:1 on the fallback ground.' },
      { name: '--ts-focus', fallback: '#c4b5ff', note: 'Focus ring on the action and close button.' },
      { name: '--ts-radius', fallback: '10px', note: 'Corners.' },
      { name: '--ts-shadow', fallback: '0 0.75rem 2rem rgb(0 0 0 / 0.28)', note: 'Shadow.' },
      { name: '--ts-width', fallback: '24rem', note: 'Width, never wider than the screen.' },
      { name: '--ts-offset', fallback: '1rem', note: 'Distance from the corner.' },
      { name: '--ts-font-size', fallback: '0.95rem', note: 'Text size.' },
      { name: '--ts-z', fallback: '110', note: 'Stacking; the consent bar is 120.' },
    ],
    a11y: [
      'One region per page, role="region" named “Notifications” with aria-live="polite": each toast is read once when it appears, without interrupting. The kind is said in words for success, warning and danger (“Error: …”); icons are aria-hidden.',
      'Timing is adjustable: every timer pauses while the pointer is over a toast, while focus is in one and while the tab is hidden, and resumes with the time it had left. A toast with an action never leaves by itself, so its action can always be reached. Shorter than 4 s is raised to 4 s.',
      'Each toast has a 44px close button named “Dismiss notification”, and Escape closes the toast with focus. When a focused toast leaves, focus goes to the next toast or back to where it was before, never to nowhere.',
      'The region sits at the end of the page, so Tab reaches toasts after the content; screen-reader users can jump to the “Notifications” landmark.',
      'Text is set as text, never parsed as HTML. An action href with a scheme other than http(s), mailto or tel (javascript:) is refused.',
      'prefers-reduced-motion: toasts appear and leave at once, with no slide or fade.',
      'Without JavaScript nothing renders: the region is hidden until the script mounts it, and a toast only exists because a script made one. Use a notice for anything that must exist without JavaScript.',
    ],
    usage: `<!-- Once, near the end of <body> in the layout: -->
<Toast position="bottom-right" />

<!-- Then, from any script after an action: -->
<script>
  const t = window.__superheroToast.show({ text: 'Conversation archived.', kind: 'success',
    action: { label: 'Undo', onClick: () => restore() } });
  // t.dismiss() closes it early.
</script>

<!-- Or with no script of your own: -->
<button data-toast="Link copied to the clipboard." data-toast-kind="success">Copy link</button>
<!-- global.css: .tst { --ts-bg: var(--navy); --ts-action: var(--tint); --ts-radius: var(--radius); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/toast/ (demo)' }],
    file: 'src/library/toast/Toast.astro',
    added: '2026-09-26',
  },
  {
    id: 'loading',
    name: 'Loading',
    aka: ['spinner', 'loading spinner', 'skeleton screen', 'skeleton loader', 'preloader', 'busy indicator', 'loading animation', 'progress spinner'],
    summary:
      'Three ways to say “wait” in one element: an inline spinner with a name (role="status"), skeleton placeholders from CSS gradients (lines, avatar, card; aria-hidden), and a busy wrapper that, while data-busy is set, makes its content aria-busy and inert, covers it with the spinner and says what is happening. No motion under reduced motion; without JavaScript the busy content stays usable.',
    pitch: 'Show people the page heard them: a spinner where something is working, grey shapes where content is on its way, and a form that cannot be clicked twice while it saves.',
    // SE Ranking US, 2026-09-26: css loading animation 480/mo, difficulty 18; css skeleton
    // 390/27; skeleton ui 480/23; loading spinner 720/33. The pre-assigned "skeleton loader
    // css" has no US volume and "skeleton loader" is 20/45; the page targets the loading
    // animation and ranks for the skeleton and spinner variants.
    search: { query: 'css loading animation', alsoRanks: ['css skeleton', 'skeleton ui', 'loading spinner'] },
    replaces: ['page-builder preloaders and loading animations', 'spinner GIFs', 'skeleton screen libraries', 'jQuery BlockUI-style busy overlays'],
    goodFor:
      'A wait longer than about a second: a spinner in a button or beside “Loading results”, a skeleton where a list or card is about to arrive (so the page does not jump when it does), and a busy wrapper round a form or panel while it saves, so it cannot be submitted twice.',
    notFor:
      'A whole-page preloader that hides a page which could already be read: show the content and mark only the part that is waiting. Waits under a second, which feel instant without one (the busy overlay waits 300 ms before it shows for that reason). And progress you can measure: a known percentage is a <progress> bar, not a spinner.',
    props: [
      { name: 'shape', type: "'spinner' | 'skeleton' | 'busy'", default: "'spinner'", note: 'Which indicator.' },
      { name: 'label', type: 'string', default: '“Loading” (skeleton: none)', note: 'What a screen reader says. Spinner: its visually hidden name. Busy: the status while busy. Skeleton: when given, a hidden status beside the hidden shapes; without it the skeleton is silent.' },
      { name: 'showLabel', type: 'boolean', default: 'false', note: 'Spinner: show the label beside the ring.' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", note: 'Spinner and the busy overlay’s ring: 1.25rem, 2rem or 3rem.' },
      { name: 'variant', type: "'lines' | 'avatar' | 'card'", default: "'lines'", note: 'Skeleton: text lines; a circle with two lines; a 16:9 block with a title and lines.' },
      { name: 'lines', type: 'number (1–12)', default: '3', note: 'Skeleton: text lines for lines and card.' },
      { name: 'busy', type: 'boolean', default: 'false', note: 'Busy: start busy once the script runs. Without JavaScript the content is usable whatever this says.' },
      { name: 'slowText / slowAfter', type: 'string / number (ms)', default: '— / 5000', note: 'Busy: shown over the content and said when the wait runs past slowAfter.' },
      { name: 'doneLabel', type: 'string', note: 'Busy: said when it clears (“Saved”). Default: nothing.' },
      { name: 'class', type: 'string', note: 'Class on the root.' },
      { name: 'data-busy / busy(el, on)', type: 'attribute / script API', note: 'Busy: toggle the data-busy attribute on the wrapper, or call window.__superheroLoading.busy(el, on) with the wrapper, anything inside it, or a selector. Returns false when there is no wrapper.' },
    ],
    theming: [
      { name: '--ld-color', fallback: 'currentColor', note: 'The ring. Keep 3:1 against what is behind it.' },
      { name: '--ld-track', fallback: 'rgb(127 127 127 / 0.25)', note: 'The ring’s track.' },
      { name: '--ld-skel-base', fallback: '#e6e9ef', note: 'Skeleton shapes.' },
      { name: '--ld-skel-shine', fallback: '#f5f7fa', note: 'The shimmer.' },
      { name: '--ld-radius', fallback: '6px', note: 'Skeleton corners.' },
      { name: '--ld-overlay', fallback: 'rgb(255 255 255 / 0.72)', note: 'Over busy content.' },
      { name: '--ld-msg-bg / --ld-msg-fg', fallback: '#fff / #1e283c', note: 'The slow message (14.75:1).' },
    ],
    a11y: [
      'Spinner: role="status" with a name (“Loading”, or `label`); the ring is aria-hidden. Rendered in place before the wait, it is read when reached; for an announcement, use busy.',
      'Skeleton: the shapes are aria-hidden, because grey bars mean nothing read aloud. With `label`, a visually hidden status says it instead.',
      'Busy: while data-busy is set the content is aria-busy="true" and inert, so it cannot be clicked, focused or submitted twice. The status that says `label` sits outside the busy content, because screen readers hold back changes inside an aria-busy region. If focus was in the content, it moves to the wrapper and back to the same control when the wait ends. `slowText` is said if the wait runs long; `doneLabel` when it clears.',
      'prefers-reduced-motion: the ring stops turning and fades gently instead, the skeleton does not shimmer, and the busy overlay appears without a fade.',
      'In forced-colours mode the ring and the skeleton shapes take the system text colour.',
      'Without JavaScript a spinner and a skeleton render as given, and a busy wrapper renders its content, usable: the overlay, aria-busy and inert only ever come from the script.',
    ],
    usage: `<button type="submit">Search <Loading size="sm" label="Searching" /></button>

<Loading shape="skeleton" variant="card" />

<Loading shape="busy" label="Saving" doneLabel="Saved" slowText="Still saving…">
  <form>…</form>
</Loading>
<script>
  // Around a real request:
  window.__superheroLoading.busy(form, true);
  await save();
  window.__superheroLoading.busy(form, false);
</script>
<!-- global.css: .ld { --ld-color: var(--brand); --ld-skel-base: var(--tint); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/loading/ (demo)' }],
    file: 'src/library/loading/Loading.astro',
    added: '2026-09-26',
  },
  {
    id: 'menu-button',
    name: 'Menu button',
    aka: ['dropdown button', 'action menu', 'kebab menu', 'three-dot menu', 'more options menu', 'Bootstrap dropdown'],
    summary:
      'The WAI-ARIA menu button: a <button aria-haspopup="menu"> that opens a role="menu" of links or actions (or a radio menu for a setting), with arrow keys, Home/End, type-ahead, Escape back to the button, click-outside to close, and a flip upward when there is no room below. Without JavaScript it is a <details> holding the same links.',
    pitch: 'Tuck a handful of actions — share, export, edit, delete — behind one tidy button that works the same with a mouse, a keyboard or a screen reader.',
    // SE Ranking US, 2026-09-26: menu button 720/mo, difficulty 23; dropdown button 190/27;
    // action menu 170/6; dropdown menu button 10/60 (the phrase the round-4 brief pre-assigned;
    // kept as a variant). "dropdown menu" 2,400/68 is out of reach and mostly means navigation.
    search: { query: 'menu button', alsoRanks: ['dropdown button', 'action menu', 'dropdown menu button'] },
    replaces: ['Bootstrap’s dropdown component', 'page-builder “dropdown button” modules', 'hand-rolled hover dropdowns that a keyboard cannot open'],
    goodFor: 'A few actions that do not each deserve a button: Share, Export, Download as…, the ⋮ on a card or a table row, a Sort by or View as setting on a listing.',
    notFor:
      'Site navigation: a header of pages is a list of links, and role="menu" makes a screen reader expect application keys; use mega-menu (or plain header links). Choosing a value in a form: that is a native <select>, or radio-group when the options deserve to be seen. And more than about ten items, which is a page, not a menu.',
    props: [
      { name: 'label', type: 'string', note: 'The button’s text, or its accessible name when `iconOnly`. Required.' },
      { name: 'items', type: 'MenuItem[]', note: '`{ label, href?, value?, disabled?, checked? }`. With `href` the item is a link; without it, a button that only acts through the `data-selected` event, so give an item an href when it must work without JavaScript.' },
      { name: 'mode', type: "'actions' | 'radio'", default: "'actions'", note: 'Radio makes the items menuitemradio with aria-checked and a check mark, for a setting such as Sort by. At most one item `checked`.' },
      { name: 'iconOnly', type: 'boolean', default: 'false', note: 'A 44px ⋮ button (Font Awesome Free ellipsis-vertical); `label` becomes its aria-label, so write it in full: “More options for Spring newsletter”.' },
      { name: 'align', type: "'start' | 'end'", default: "'start'", note: 'Which edge of the button the menu lines up with. It moves to the other edge by itself if it would leave the viewport.' },
      { name: 'id', type: 'string', default: '“menu-button-<n>”', note: 'Base id: the button is <id>-button, the menu <id>-menu. Also `event.target.id` for a host listening on a parent.' },
      { name: 'data-selected', type: 'event', note: 'Dispatched on the root when an item is activated: bubbles, cancelable, `detail: { value, label, href }`. preventDefault() on a link item keeps the browser from following it.' },
      { name: 'class', type: 'string', note: 'Class on the root, for the host to theme it.' },
    ],
    theming: [
      { name: '--mb-bg', fallback: '#fff', note: 'Button fill.' },
      { name: '--mb-fg', fallback: '#1e283c', note: 'Button text (14.75:1 on the fallback fill).' },
      { name: '--mb-border', fallback: '#c9ccd8', note: 'Button and menu border.' },
      { name: '--mb-radius', fallback: '8px', note: 'Button and menu corners.' },
      { name: '--mb-menu-bg', fallback: '#fff', note: 'Menu fill.' },
      { name: '--mb-menu-fg', fallback: '#1e283c', note: 'Menu text.' },
      { name: '--mb-hover', fallback: '#eef0f7', note: 'Focused and hovered item (menu text stays above 4.5:1 on it).' },
      { name: '--mb-accent', fallback: '#5933d8', note: 'Check mark in a radio menu.' },
      { name: '--mb-muted', fallback: '#6b6f80', note: 'Disabled items.' },
      { name: '--mb-focus', fallback: '#5933d8', note: 'Keyboard focus ring.' },
      { name: '--mb-shadow', fallback: '0 12px 32px rgb(0 0 0 / 0.16)', note: 'Menu shadow.' },
      { name: '--mb-z', fallback: '30', note: 'Menu stacking level.' },
      { name: '--mb-min-width / --mb-max-height', fallback: '12rem / 20rem', note: 'Menu size; past the height it scrolls.' },
    ],
    a11y: [
      'The WAI-ARIA Authoring Practices menu button: the button has aria-haspopup="menu", aria-expanded and aria-controls; the menu is role="menu", labelled by the button, and its items are role="menuitem" (or "menuitemradio" with aria-checked) with tabindex="-1", so the menu is one Tab stop.',
      'On the button, Enter, Space and ↓ open the menu on the first item (the checked one in a radio menu) and ↑ opens it on the last. In the menu, ↓ ↑ move and wrap, Home and End jump, a letter moves to the next item starting with it, Enter and Space activate, Escape closes and returns focus to the button, Tab closes and moves on.',
      'A click outside or focus leaving the element closes the menu. A disabled item is aria-disabled: reachable and announced, not activatable.',
      'The menu opens below the button, or above it when the room below is short and there is more above, measured each time it opens; it never runs off the side of the viewport.',
      'Buttons and items are at least 44px tall; the icon-only button is 44px square with its full label as aria-label.',
      'prefers-reduced-motion: the menu appears without its 120 ms fade.',
      'Without JavaScript it is a <details>: the summary shows the same label and opens the same list, and link items work. No menu roles are rendered until the script can honour them.',
    ],
    usage: `<MenuButton label="Share" items={[
  { label: 'Copy link', value: 'copy' },
  { label: 'Email this page', href: 'mailto:?subject=…' },
]} />

<!-- A setting: links keep it working without JavaScript. -->
<MenuButton label="Sort by" mode="radio" items={[
  { label: 'Newest first', href: '?sort=newest', checked: true },
  { label: 'Price, low to high', href: '?sort=price-asc' },
]} />

<!-- ⋮ on a card -->
<MenuButton label="More options for {post.title}" iconOnly align="end" items={actions} />

<script>
  document.addEventListener('data-selected', (e) => { if (e.detail.value === 'copy') navigator.clipboard.writeText(location.href); });
</script>
<!-- .toolbar { --mb-accent: var(--brand); --mb-focus: var(--brand); --mb-radius: var(--radius); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/menu-button/ (demo)' }],
    file: 'src/library/menu-button/MenuButton.astro',
    added: '2026-09-26',
  },
  {
    id: 'radio-group',
    name: 'Radio group',
    aka: ['chunky radio buttons', 'radio cards', 'card radio buttons', 'segmented control', 'segmented buttons', 'toggle button group', 'custom radio buttons', 'styled radio buttons', 'Gravity Forms radio', 'WPForms multiple choice'],
    summary:
      'One choice from a few, as real <input type="radio">s in a <fieldset> with a <legend>: a styled list, chunky cards with a Font Awesome Free icon, a title and a line, or a segmented pill row. Native keyboard, visible focus, posts name=value in a plain form, and a data-changed event for hosts.',
    pitch: 'Let people pick one option at a glance — as a list, as big cards with an icon, or as a pill switch — and it still posts like the plain form it is.',
    // SE Ranking US, 2026-09-26: radio button css 590/mo, difficulty 21; radio group 480/30;
    // radio button design 390/28; segmented control 260/7 (volatile, 10–590 over the year);
    // styled radio buttons 210/22. "segmented control css", the phrase the round-4 brief
    // pre-assigned, has no measurable volume, so its parent is a variant here instead.
    search: { query: 'radio button css', alsoRanks: ['radio group', 'radio button design', 'segmented control', 'styled radio buttons'] },
    replaces: ['Gravity Forms / WPForms / Contact Form 7 radio fields with a theme’s styling', 'page-builder “radio image” and “card select” add-ons', 'JavaScript segmented controls that replace the inputs with divs'],
    goodFor:
      'Two to six choices people should see side by side: delivery or pickup, a plan, a billing period (segmented), a size, how to be contacted. Chunky cards when each option needs a line of explanation; segmented for two to four short words.',
    notFor:
      'Many options or long labels: over about six, use a native <select>. Several answers at once: that is checkboxes. An action that happens on click (a view switch that is not part of a form is fine, a Delete button is not). And a list of pages: those are links.',
    props: [
      { name: 'legend', type: 'string', note: 'The question, as the fieldset’s <legend>; the group’s accessible name. Required.' },
      { name: 'name', type: 'string', note: 'The field name the form posts. Required.' },
      { name: 'options', type: 'RadioOption[]', note: '`{ value, label, text?, icon?, disabled? }`. `text` is a line under the label and its description (not shown in segmented). `icon` (chunky) is a Font Awesome Free name: "truck", or "regular/clock" for another Free style.' },
      { name: 'value', type: 'string', note: 'The value checked on render. Leave it out to make the visitor choose (with `required`).' },
      { name: 'style', type: "'default' | 'chunky' | 'segmented'", default: "'default'", note: 'A styled list, a card per option, or a pill row.' },
      { name: 'hideLegend', type: 'boolean', default: 'false', note: 'Hide the legend visually; it still names the group. Only when the question is already visible beside it.' },
      { name: 'hint', type: 'string', note: 'A line under the legend, set as the group’s description.' },
      { name: 'required', type: 'boolean', default: 'false', note: 'The browser’s own validation: the form will not submit until one is chosen.' },
      { name: 'id', type: 'string', default: '“rg-<name>-<n>”', note: 'Base of the input ids (<id>-1, <id>-2 …).' },
      { name: 'data-changed', type: 'event', note: 'Dispatched on the fieldset when the choice changes: bubbles, `detail: { name, value, label }`. The fieldset’s `data-value` follows it. The native change event fires too.' },
      { name: 'class', type: 'string', note: 'Class on the fieldset, for the host to theme it.' },
    ],
    theming: [
      { name: '--rg-accent', fallback: '#5933d8', note: 'Checked dot, checked card border, checked segment fill, icons.' },
      { name: '--rg-accent-fg', fallback: '#fff', note: 'Text on a checked segment (7.27:1 on the fallback accent).' },
      { name: '--rg-fg', fallback: 'inherit', note: 'Legend and labels.' },
      { name: '--rg-muted', fallback: '#585c6e', note: 'Descriptions and the hint (6.6:1 on white).' },
      { name: '--rg-border', fallback: '#8a8ea0', note: 'Radio ring and segmented outline (3.25:1 on white; the non-text minimum is 3:1); cards use it at 55%, full on hover.' },
      { name: '--rg-bg', fallback: '#fff', note: 'Card, segment and radio fill.' },
      { name: '--rg-bg-checked', fallback: '#f4f1fd', note: 'Checked card fill.' },
      { name: '--rg-radius', fallback: '10px', note: 'Card and segment corners.' },
      { name: '--rg-focus', fallback: '#5933d8', note: 'Keyboard focus ring.' },
      { name: '--rg-size', fallback: '1.25rem', note: 'The radio circle.' },
      { name: '--rg-card-min', fallback: '13rem', note: 'Narrowest a chunky card gets before the row wraps.' },
    ],
    a11y: [
      'Real radios in a <fieldset> named by its <legend>: nothing is replaced, given a role or hidden from assistive technology, so screen readers announce “radio button, 2 of 3” and the group’s question.',
      'The keyboard is the browser’s: Tab enters the group on the checked radio (or the first), the arrow keys move and select, Space selects, Tab leaves. No script is involved.',
      'Each radio is named by its title only; a chunky card’s line of text is its description (aria-describedby), and the hint describes the group.',
      'A visible 3px focus ring on the radio, or around the whole card or segment in those looks. Every option is at least 44px tall.',
      'Colour is never the only signal: the checked radio has a dot, the checked card a heavier border and a fill, and in forced-colors mode checked cards and segments get a Highlight outline.',
      'prefers-reduced-motion: no colour transition.',
      'Without JavaScript nothing is missing: it is a form control, and it posts `name=value` in a plain form, with `required` validation by the browser. The script only adds the data-changed event for hosts.',
    ],
    usage: `<form method="post" action="/checkout/">
  <RadioGroup legend="How would you like your order?" name="delivery" style="chunky" value="pickup" options={[
    { value: 'delivery', label: 'Delivery', text: 'To your door in 2 to 3 working days.', icon: 'truck' },
    { value: 'pickup', label: 'Pick up', text: 'From the shop, ready in an hour.', icon: 'store' },
  ]} />
  <RadioGroup legend="Billing period" name="billing" style="segmented" value="monthly" options={[
    { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' },
  ]} />
  <button type="submit">Continue</button>
</form>
<!-- chunky icons are read at build: npm i -D @fortawesome/fontawesome-free (as for the icon element) -->
<!-- .checkout { --rg-accent: var(--brand); --rg-focus: var(--brand); --rg-radius: var(--radius); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/radio-group/ (demo)' }],
    file: 'src/library/radio-group/RadioGroup.astro',
    added: '2026-09-26',
  },
  {
    id: 'stepper',
    name: 'Stepper',
    aka: ['step indicator', 'progress steps', 'stepped progress indicator', 'checkout steps', 'wizard steps', 'multi-step form progress bar', 'Gravity Forms progress bar', 'WPForms page break progress'],
    summary:
      'An ordered list of steps, each done (with a check, optionally linked back), current (aria-current="step") or upcoming, joined by connector lines: horizontal when it has 40rem of its own width, vertical below. Static as rendered; window.__superheroStepper.go(id, n) advances it for a form that does not reload.',
    pitch: 'Show people where they are in a checkout or a sign-up, how far they have come and what is left, on a laptop or a phone.',
    // SE Ranking US, 2026-09-26: step indicator 210/mo, difficulty 12; wizard steps 170/12;
    // progress indicator 260/42; steps ui 90/7. "progress steps html", the phrase the round-4
    // brief pre-assigned, has no measurable volume; "stepper" alone is 14,800/78 and mostly
    // exercise machines.
    search: { query: 'step indicator', alsoRanks: ['wizard steps', 'progress indicator', 'steps ui'] },
    replaces: ['Gravity Forms and WPForms multi-page progress bars (the “steps” style)', 'WooCommerce multi-step checkout plugins’ step bars', 'page-builder “process steps” widgets used as a progress bar'],
    goodFor: 'A sequence of three to six steps someone goes through once: a checkout, a booking, an application or quote form split into pages, an onboarding checklist.',
    notFor:
      'A history or a process you describe rather than one the visitor is in: that is a timeline (info-list). Percent-done for a single task: that is a progress bar. More than about six steps: group them. And navigation between pages people can visit in any order: those are tabs or links.',
    props: [
      { name: 'steps', type: 'Step[]', note: '`{ label, href?, text? }`. A done step with an `href` links back to it; current and upcoming steps are never links. `text` is a short line under the label.' },
      { name: 'current', type: 'number', default: '1', note: 'The 1-based current step. `steps.length + 1` marks every step done.' },
      { name: 'label', type: 'string', default: '“Progress”', note: 'Accessible name: of the <nav> when any step has an href, otherwise of the list, so a purely visual stepper adds no landmark.' },
      { name: 'orientation', type: "'auto' | 'vertical'", default: "'auto'", note: 'Auto is horizontal from 40rem of its own width and vertical below, so it turns vertical on a phone and in a sidebar. Vertical always stacks.' },
      { name: 'id', type: 'string', default: '“stepper-<n>”', note: 'The id `window.__superheroStepper.go(id, n)` takes.' },
      { name: 'go(id, n)', type: 'window.__superheroStepper', note: 'Makes step n current (clamped; steps.length + 1 = all done), earlier steps done and linked, later upcoming. Returns true, or false for an unknown id. Moves no focus: move it to your form section’s heading.' },
      { name: 'class', type: 'string', note: 'Class on the root, for the host to theme it.' },
    ],
    theming: [
      { name: '--st-accent', fallback: '#5933d8', note: 'Done and current markers, lines behind the current step.' },
      { name: '--st-accent-fg', fallback: '#fff', note: 'Number or check on a filled marker (7.27:1 on the fallback accent).' },
      { name: '--st-ring', fallback: 'accent at 22%', note: 'Halo around the current marker.' },
      { name: '--st-upcoming', fallback: '#6b6f80', note: 'Upcoming marker ring and number (4.99:1 on white).' },
      { name: '--st-bg', fallback: '#fff', note: 'Upcoming marker fill.' },
      { name: '--st-line', fallback: '#d5d7e0', note: 'Connector ahead of the current step (decorative).' },
      { name: '--st-fg', fallback: 'inherit', note: 'Labels.' },
      { name: '--st-muted', fallback: '#585c6e', note: 'Upcoming labels and step text (6.62:1 on white).' },
      { name: '--st-focus', fallback: '#5933d8', note: 'Focus ring on links to done steps.' },
      { name: '--st-size', fallback: '2rem', note: 'Marker diameter.' },
    ],
    a11y: [
      'An ordered list, so a screen reader announces the count and each step’s position. The current step’s item has aria-current="step"; exactly one does, or none once every step is done.',
      'A done step is announced “Completed: <label>” (visually hidden text) and shows a check, so state is never colour alone: done has a check, current a halo and a bolder label, upcoming an outline.',
      'Only done steps link. The whole stepper is a <nav> named by `label` when any step can link, and just a named list otherwise.',
      'go() changes the states and links in place and moves no focus and announces nothing: the form should move focus to its next section’s heading, which is what a screen reader user needs to hear.',
      'Links have a visible 3px focus ring. In forced-colors mode done and current markers use Highlight.',
      'prefers-reduced-motion: no colour transition when it advances.',
      'Without JavaScript it is exactly as rendered: the static state is right for a page per step, the common case.',
    ],
    usage: `<!-- A page per step: the build renders the right state. -->
<Stepper label="Checkout progress" current={2} steps={[
  { label: 'Basket', href: '/basket/' },
  { label: 'Delivery', href: '/checkout/delivery/' },
  { label: 'Payment' },
  { label: 'Review' },
]} />

<!-- One page, a form that advances: -->
<Stepper id="quote-steps" label="Quote progress" steps={steps} />
<script>
  window.__superheroStepper.go('quote-steps', 3);   // then focus the step's heading
</script>
<!-- .checkout { --st-accent: var(--brand); --st-focus: var(--brand); } -->`,
    license: 'MIT. Pattern from Rocketbelt (Pier 1 Imports, 2020, MIT); reimplemented, no code copied.',
    usedOn: [{ site: 'superherotech.ai', where: '/elements/stepper/ (demo)' }],
    file: 'src/library/stepper/Stepper.astro',
    added: '2026-09-26',
  },
];

export const byId = (id: string) => catalog.find((e) => e.id === id);
