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
// The Worker fires the site's deploy hook when new posts arrive, so the grid refreshes itself.

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
];

export const byId = (id: string) => catalog.find((e) => e.id === id);
