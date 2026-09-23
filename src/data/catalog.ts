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
];

export const byId = (id: string) => catalog.find((e) => e.id === id);
