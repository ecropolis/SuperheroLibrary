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
    search: { query: 'card slider', alsoRanks: ['card carousel', 'testimonial carousel'] },
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
];

export const byId = (id: string) => catalog.find((e) => e.id === id);
