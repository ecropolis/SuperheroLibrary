/**
 * Style boards and flavours -- SuperheroLibrary, src/data/styles.ts. THE SOURCE.
 *
 * Two copies live downstream, each with its own header and this file's body:
 *
 *   ecropolis/SuperheroPortal  src/styles/boards.data.ts      (the style step clients pick on)
 *   ecropolis/SuperheroAdmin   src/domain/styleBoards.data.ts (the console's style panel)
 *
 * superherotech.ai vendors it too, for the public /styles/ page.
 *
 * Only this header may differ; below it the file is one file in three repos.
 *
 * Each downstream repo pins the SHA-256 of everything after this comment, the
 * way SuperheroAdmin's scripts/check-dropzone-identity.mjs pins the drop zone.
 * `npm run check` here prints the hash (scripts/check-styles.mjs). Change the
 * body here first, then take it again in the portal and the console in changes
 * that move their pins to the new hash. A pin is moved only together with its
 * copy -- otherwise it records the drift instead of guarding against it.
 */

// Framework-free on purpose: no imports, no DOM, no Astro. The portal and the
// console are Workers, the site is Astro, and all three read this as plain data.
// Rendering stays in each app; this file only says what the boards ARE.

/**
 * The ten ids, in the order every page shows them. The portal stores them on
 * `accounts.style_primary` / `style_secondary`, and its migration 0047 names
 * exactly these in a CHECK -- renaming one is a migration in the portal.
 */
export const STYLE_IDS = [
  "high-tech",
  "minimal",
  "classic",
  "natural",
  "luxurious",
  "playful",
  "childlike",
  "retro",
  "bold",
  "handcrafted",
] as const;

export type StyleId = (typeof STYLE_IDS)[number];

/** A client picks up to two boards, ranked: "mostly this", then "with a bit of this". */
export const STYLE_PICKS_MAX = 2;
/** Up to three flavours on top of the boards. */
export const STYLE_FLAVORS_MAX = 3;
/** The longest "in three words, how should visitors feel" line the portal takes. */
export const STYLE_FEEL_MAX = 80;

/**
 * Font stacks, all of them local. No web font is loaded for a board -- the
 * portal's CSP has no font-src -- so every stack falls through to a generic
 * family and a machine missing the first choice still shows the right kind of
 * type. A board names a key here rather than writing a stack.
 */
export const FONT_STACKS = {
  system: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  geometric: "'Avenir Next', 'Century Gothic', Futura, ui-sans-serif, system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  serif: "Georgia, 'Times New Roman', Times, serif",
  didone: "Didot, 'Bodoni 72', 'Bodoni MT', 'Hoefler Text', Georgia, serif",
  humanist: "Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  rounded: "ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', 'Trebuchet MS', system-ui, sans-serif",
  hand: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Comic Neue', cursive",
  slab: "Rockwell, 'Rockwell Nova', 'Roboto Slab', 'Courier New', Georgia, serif",
  heavy: "'Arial Black', 'Helvetica Neue', Impact, system-ui, sans-serif",
  script: "'Snell Roundhand', 'Segoe Script', 'Brush Script MT', 'Apple Chancery', cursive",
} as const;

export type FontKey = keyof typeof FONT_STACKS;

/**
 * The four colours of a board, always in this order: the page, its text, the
 * one accent, and a second surface for cards. The portal's check measures
 * every text-on-ground pair it draws from these at 4.5:1 or better.
 */
export type PaletteRole = "ground" | "ink" | "accent" | "surface";

/** The one decorative shape each board carries, drawn as inline SVG by the portal. */
export type MarkKind =
  | "hex"
  | "square"
  | "arch"
  | "blob"
  | "diamond"
  | "circles"
  | "star"
  | "badge"
  | "block"
  | "wobble";

/** How much a board moves, as the portal animates it. `motion` on the board is the words. */
export type MotionKind = "none" | "subtle" | "gentle" | "bouncy";

export interface StyleBoard {
  id: StyleId;
  /** The tile's name: "Classic & conservative". */
  label: string;
  /** The same board said in passing: "Classic". A header reads "Style: Classic". */
  word: string;
  /** One line, in the client's words: what it feels like. */
  feel: string;
  /** Four colours, one per role, in the order ground, ink, accent, surface. Hex is lowercase #rrggbb. */
  palette: readonly { name: PaletteRole; hex: string }[];
  /** The faces, by FONT_STACKS key, and `note`: the type in words. `label` is a third face for the small label. */
  type: { heading: FontKey; body: FontKey; label?: FontKey; note: string };
  /** The colour in words. */
  colour: string;
  /** The shape language in words. */
  shape: string;
  /** The motion in words. */
  motion: string;
  /** The kind of business the board is shown for -- its sample's trade. */
  suits: readonly string[];
  /** A live demo site that shows this board. Set only where one honestly does. */
  demo?: { href: string; label: string };
  /** What the portal draws the board with: its thumbnail and its larger sample page. */
  draw: {
    /** Which palette colour a button's label is drawn in, on the accent. */
    onAccent: "ground" | "ink";
    /** Which palette colour the small label above the headline is drawn in, on the ground. */
    eyebrow: "accent" | "ink";
    heading: { weight: number; upper: boolean; tracking: string; scale: number };
    /** A grain over the image, for the boards whose feel is texture. */
    texture?: boolean;
    /** Corner radius for buttons, cards and the image, as CSS. */
    radius: string;
    align: "start" | "center";
    mark: MarkKind;
    motion: MotionKind;
    /** The sample page's words. A made-up business, so no real one is imitated. */
    sample: {
      brand: string;
      eyebrow: string;
      headline: string;
      body: string;
      button: string;
      cardTitle: string;
      cardBody: string;
    };
  };
}

export const STYLE_BOARDS: readonly StyleBoard[] = [
  {
    id: "high-tech",
    label: "High tech",
    word: "High tech",
    feel: "precise, dark or cool palettes, geometric type, subtle motion",
    palette: [
      { name: "ground", hex: "#0b1220" },
      { name: "ink", hex: "#e6edf7" },
      { name: "accent", hex: "#38bdf8" },
      { name: "surface", hex: "#16213a" },
    ],
    type: { heading: "geometric", body: "system", label: "mono", note: "Geometric sans, a monospace detail" },
    colour: "Dark and cool, one bright signal",
    shape: "Precise lines, crisp corners",
    motion: "Subtle",
    suits: ["Software and tech services"],
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 600, upper: false, tracking: "-0.02em", scale: 1 },
      radius: "4px",
      align: "start",
      mark: "hex",
      motion: "subtle",
      sample: {
        brand: "Northwind Labs",
        eyebrow: "Platform 3.0",
        headline: "Systems that think ahead.",
        body: "Monitoring, alerts and reports in one quiet dashboard, so your team sees the problem before the customer does.",
        button: "Book a demo",
        cardTitle: "99.98% uptime",
        cardBody: "Measured every minute, reported every month.",
      },
    },
  },
  {
    id: "minimal",
    label: "Minimal",
    word: "Minimal",
    feel: "lots of white space, one accent, quiet type, no decoration",
    palette: [
      { name: "ground", hex: "#ffffff" },
      { name: "ink", hex: "#1a1a1a" },
      { name: "accent", hex: "#2f5bea" },
      { name: "surface", hex: "#f3f3f1" },
    ],
    type: { heading: "system", body: "system", note: "Quiet sans, light weights" },
    colour: "White, black, one accent",
    shape: "Square, almost no decoration",
    motion: "None to speak of",
    suits: ["Architects and designers"],
    demo: { href: "https://mainstreet.superherotech.ai", label: "Mainstreet, our studio demo" },
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 500, upper: false, tracking: "-0.01em", scale: 0.95 },
      radius: "2px",
      align: "start",
      mark: "square",
      motion: "none",
      sample: {
        brand: "Field Studio",
        eyebrow: "Architecture",
        headline: "Less, done well.",
        body: "Homes and small workplaces, designed around light and the way you actually live.",
        button: "See our work",
        cardTitle: "Three rooms, one idea",
        cardBody: "A 1920s row house, opened up without losing its bones.",
      },
    },
  },
  {
    id: "classic",
    label: "Classic & conservative",
    word: "Classic",
    feel: "serif headings, navy/burgundy/cream, symmetry, no motion",
    palette: [
      { name: "ground", hex: "#fbf7ee" },
      { name: "ink", hex: "#1b2a4a" },
      { name: "accent", hex: "#7a1f2b" },
      { name: "surface", hex: "#efe6d2" },
    ],
    type: { heading: "serif", body: "system", note: "Serif headings, plain body" },
    colour: "Navy, burgundy and cream",
    shape: "Symmetrical, arches and rules",
    motion: "None",
    suits: ["Accountants, lawyers and advisors"],
    demo: { href: "https://supper.superherotech.ai", label: "Supper, our restaurant demo" },
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 700, upper: false, tracking: "0", scale: 1 },
      radius: "0",
      align: "center",
      mark: "arch",
      motion: "none",
      sample: {
        brand: "Whitmore & Hale",
        eyebrow: "Since 1987",
        headline: "Sound advice, plainly given.",
        body: "Tax, estates and family business planning from a firm that answers its own phone.",
        button: "Arrange a meeting",
        cardTitle: "Estate planning",
        cardBody: "Wills, trusts and the conversations around them.",
      },
    },
  },
  {
    id: "natural",
    label: "Natural & organic",
    word: "Natural",
    feel: "earth tones, soft edges, photography-led, gentle motion",
    palette: [
      { name: "ground", hex: "#f4efe4" },
      { name: "ink", hex: "#2f3a2c" },
      { name: "accent", hex: "#4e6b34" },
      { name: "surface", hex: "#e4dccb" },
    ],
    type: { heading: "humanist", body: "system", note: "Warm serif headings, soft sans body" },
    colour: "Earth tones, moss and clay",
    shape: "Soft, rounded, organic",
    motion: "Gentle",
    suits: ["Farms and food producers"],
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 600, upper: false, tracking: "-0.01em", scale: 1 },
      radius: "18px",
      align: "start",
      mark: "blob",
      motion: "gentle",
      sample: {
        brand: "Greenfold Farm",
        eyebrow: "Grown nearby",
        headline: "Food that tastes like somewhere.",
        body: "Vegetables, eggs and honey from our fields, at the market on Saturdays and at your door on Tuesdays.",
        button: "Order a box",
        cardTitle: "This week's box",
        cardBody: "Chard, new potatoes, scallions and a dozen eggs.",
      },
    },
  },
  {
    id: "luxurious",
    label: "Luxurious",
    word: "Luxurious",
    feel: "deep tones with gold or cream, elegant serif, restraint",
    palette: [
      { name: "ground", hex: "#141115" },
      { name: "ink", hex: "#f3ead8" },
      { name: "accent", hex: "#c9a45c" },
      { name: "surface", hex: "#221d24" },
    ],
    type: { heading: "didone", body: "serif", note: "Elegant high-contrast serif" },
    colour: "Deep tones with gold and cream",
    shape: "Fine lines, generous space",
    motion: "Slow and restrained",
    suits: ["Jewelers and fine goods"],
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 400, upper: true, tracking: "0.08em", scale: 0.85 },
      radius: "0",
      align: "center",
      mark: "diamond",
      motion: "subtle",
      sample: {
        brand: "Maison Aurèle",
        eyebrow: "By appointment",
        headline: "Made to be kept.",
        body: "Fine jewelry, designed and finished by hand in our own atelier.",
        button: "Book a private viewing",
        cardTitle: "The Solstice ring",
        cardBody: "Eighteen-carat gold, a single hand-set stone.",
      },
    },
  },
  {
    id: "playful",
    label: "Playful",
    word: "Playful",
    feel: "bright colors, rounded shapes, bouncy motion, friendly type",
    palette: [
      { name: "ground", hex: "#fff8ec" },
      { name: "ink", hex: "#2a1a4a" },
      { name: "accent", hex: "#ff6b5e" },
      { name: "surface", hex: "#ffd84d" },
    ],
    type: { heading: "rounded", body: "rounded", note: "Round, friendly sans" },
    colour: "Bright and warm",
    shape: "Rounded, bubbly",
    motion: "Bouncy",
    suits: ["Local shops and repairs"],
    draw: {
      onAccent: "ink",
      eyebrow: "ink",
      heading: { weight: 800, upper: false, tracking: "-0.01em", scale: 1.05 },
      radius: "999px",
      align: "start",
      mark: "circles",
      motion: "bouncy",
      sample: {
        brand: "Pop & Pedal",
        eyebrow: "Bike repairs",
        headline: "Flat tire? We've got you.",
        body: "Same-day fixes, friendly advice and a free coffee while you wait.",
        button: "Book a fix",
        cardTitle: "Spring tune-up",
        cardBody: "Gears, brakes and a shine, done by lunchtime.",
      },
    },
  },
  {
    id: "childlike",
    label: "Childlike",
    word: "Childlike",
    feel: "primary colors, illustrations, big rounded type, hand-drawn",
    palette: [
      { name: "ground", hex: "#fffdf5" },
      { name: "ink", hex: "#161616" },
      { name: "accent", hex: "#1f4fd1" },
      { name: "surface", hex: "#ffd60a" },
    ],
    type: { heading: "hand", body: "rounded", note: "Big, rounded, hand-lettered feel" },
    colour: "Primary colors",
    shape: "Illustrated, hand-drawn",
    motion: "Lively",
    suits: ["Preschools and children's services"],
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 700, upper: false, tracking: "0", scale: 1.1 },
      radius: "22px",
      align: "center",
      mark: "star",
      motion: "bouncy",
      sample: {
        brand: "Little Acorns",
        eyebrow: "Childcare and preschool",
        headline: "Big days for small people.",
        body: "Play, paint, stories and a garden to dig in, for children from two to five.",
        button: "Come and visit",
        cardTitle: "Messy Mondays",
        cardBody: "Paint, clay and a very big sink.",
      },
    },
  },
  {
    id: "retro",
    label: "Retro",
    word: "Retro",
    feel: "period palettes, display type, grain and badges",
    palette: [
      { name: "ground", hex: "#f3e3c3" },
      { name: "ink", hex: "#3b2317" },
      { name: "accent", hex: "#1f5f5b" },
      { name: "surface", hex: "#e8b64c" },
    ],
    type: { heading: "slab", body: "system", note: "Slab and display faces" },
    colour: "Period palette, mustard and teal",
    shape: "Badges, stripes, grain",
    motion: "A little swing",
    suits: ["Diners, cafés and bars"],
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 700, upper: true, tracking: "0.02em", scale: 1 },
      texture: true,
      radius: "6px",
      align: "center",
      mark: "badge",
      motion: "gentle",
      sample: {
        brand: "Hi-Fi Diner",
        eyebrow: "Est. 1962",
        headline: "Good coffee, better pie.",
        body: "Breakfast all day, milkshakes thick enough to stand a spoon in, and records on the jukebox.",
        button: "See the menu",
        cardTitle: "Blue plate special",
        cardBody: "Meatloaf, mashed potatoes and gravy, every Thursday.",
      },
    },
  },
  {
    id: "bold",
    label: "Bold & loud",
    word: "Bold",
    feel: "huge headlines, high contrast, blocks of color",
    palette: [
      { name: "ground", hex: "#ffffff" },
      { name: "ink", hex: "#0a0a0a" },
      { name: "accent", hex: "#0033ff" },
      { name: "surface", hex: "#ffe500" },
    ],
    type: { heading: "heavy", body: "system", note: "Huge, heavy headlines" },
    colour: "High contrast, blocks of color",
    shape: "Hard edges, big blocks",
    motion: "Snappy",
    suits: ["Gyms and fitness"],
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 900, upper: true, tracking: "-0.03em", scale: 1.35 },
      radius: "0",
      align: "start",
      mark: "block",
      motion: "subtle",
      sample: {
        brand: "LOUDHOUSE",
        eyebrow: "Gym and boxing",
        headline: "No excuses.",
        body: "Open 5am to midnight. Real coaches, real classes, no contracts.",
        button: "Start free",
        cardTitle: "Fight club Fridays",
        cardBody: "Pads, bags and sparring for every level.",
      },
    },
  },
  {
    id: "handcrafted",
    label: "Handcrafted",
    word: "Handcrafted",
    feel: "textures, script accents, warm neutrals, imperfect edges",
    palette: [
      { name: "ground", hex: "#f7f1e8" },
      { name: "ink", hex: "#3d2b1f" },
      { name: "accent", hex: "#8c4a2f" },
      { name: "surface", hex: "#ebdfcc" },
    ],
    type: { heading: "serif", body: "system", label: "script", note: "Serif with a script accent" },
    colour: "Warm neutrals, terracotta",
    shape: "Imperfect, hand-drawn edges",
    motion: "Gentle",
    suits: ["Makers and craft studios"],
    draw: {
      onAccent: "ground",
      eyebrow: "accent",
      heading: { weight: 600, upper: false, tracking: "0", scale: 1 },
      texture: true,
      radius: "255px 15px 225px 15px / 15px 225px 15px 255px",
      align: "start",
      mark: "wobble",
      motion: "gentle",
      sample: {
        brand: "Kiln & Thread",
        eyebrow: "Made by hand",
        headline: "Pieces with a maker's mark.",
        body: "Pottery and woven goods from our workshop, each one a little different from the last.",
        button: "Visit the shop",
        cardTitle: "Workshop Saturdays",
        cardBody: "Throw your first bowl with us, clay and tea included.",
      },
    },
  },
];

/* ------------------------------------------------------------------ flavours */

/**
 * The sixteen flavour ids. A flavour is a note on top of a board -- "Natural,
 * with a bit of Minimal, and a cottagecore flavour" -- not an eleventh style,
 * which is why it carries no palette. The portal stores them as a JSON array
 * on `accounts.style_flavors` (migration 0047).
 */
export const FLAVOR_IDS = [
  "cottagecore",
  "art-deco",
  "brutalist",
  "y2k",
  "pop-art",
  "editorial",
  "boho",
  "coastal",
  "industrial",
  "scandinavian",
  "americana",
  "street",
  "maximalist",
  "gallery",
  "cyberpunk",
  "farmhouse",
] as const;

export type FlavorId = (typeof FLAVOR_IDS)[number];

/**
 * `pairsWith` is the two or three boards a flavour sits with naturally. It
 * refuses nothing: when a chosen flavour pairs with neither pick, the portal
 * says one gentle line and saves anyway.
 */
export interface StyleFlavor {
  id: FlavorId;
  label: string;
  meaning: string;
  pairsWith: readonly StyleId[];
}

export const STYLE_FLAVORS: readonly StyleFlavor[] = [
  { id: "cottagecore", label: "Cottagecore", meaning: "soft florals, linen, warm daylight, handwritten touches", pairsWith: ["natural", "handcrafted"] },
  { id: "art-deco", label: "Art deco", meaning: "geometric gold lines, symmetry, 1920s glamor", pairsWith: ["luxurious", "classic", "retro"] },
  { id: "brutalist", label: "Brutalist", meaning: "raw type, hard edges, no ornament, honest structure", pairsWith: ["bold", "minimal"] },
  { id: "y2k", label: "Y2K / pop culture", meaning: "chrome, gradients, stickers, early-web fun", pairsWith: ["playful", "bold", "high-tech"] },
  { id: "pop-art", label: "Pop art", meaning: "halftones, bold outlines, comic color", pairsWith: ["bold", "playful", "retro"] },
  { id: "editorial", label: "Editorial", meaning: "magazine layout, big serif headlines, generous margins", pairsWith: ["classic", "minimal", "luxurious"] },
  { id: "boho", label: "Boho", meaning: "layered textures, rust and mustard, woven patterns", pairsWith: ["natural", "handcrafted", "retro"] },
  { id: "coastal", label: "Coastal", meaning: "sea blues, sand, light wood, open air", pairsWith: ["natural", "minimal"] },
  { id: "industrial", label: "Industrial", meaning: "concrete, steel, exposed grid, stencil type", pairsWith: ["high-tech", "bold", "minimal"] },
  { id: "scandinavian", label: "Scandinavian", meaning: "pale wood, quiet color, function first", pairsWith: ["minimal", "natural"] },
  { id: "americana", label: "Vintage Americana", meaning: "badges, red-white-blue, hand-painted signs", pairsWith: ["retro", "classic", "handcrafted"] },
  { id: "street", label: "Street", meaning: "graffiti energy, stickers, high contrast, motion", pairsWith: ["bold", "playful"] },
  { id: "maximalist", label: "Maximalist", meaning: "more of everything, pattern on pattern, color on color", pairsWith: ["playful", "bold", "childlike"] },
  { id: "gallery", label: "Artsy / gallery", meaning: "white walls, art-first, sparse captions", pairsWith: ["minimal", "luxurious"] },
  { id: "cyberpunk", label: "Cyberpunk", meaning: "neon on black, glitch, grids", pairsWith: ["high-tech", "bold"] },
  { id: "farmhouse", label: "Farmhouse", meaning: "shiplap whites, black iron, warm wood", pairsWith: ["natural", "handcrafted", "classic"] },
];

/* ------------------------------------------------------------------- helpers */

export function isStyleId(v: unknown): v is StyleId {
  return typeof v === "string" && (STYLE_IDS as readonly string[]).includes(v);
}

export function isFlavorId(v: unknown): v is FlavorId {
  return typeof v === "string" && (FLAVOR_IDS as readonly string[]).includes(v);
}

/** A board by id, or null for anything that is not one of the ten. Never the nearest board. */
export function styleBoard(id: string | null | undefined): StyleBoard | null {
  if (typeof id !== "string") return null;
  return STYLE_BOARDS.find((b) => b.id === id) ?? null;
}

/** A flavour by id, or null for anything that is not one of the sixteen. */
export function styleFlavor(id: string | null | undefined): StyleFlavor | null {
  if (typeof id !== "string") return null;
  return STYLE_FLAVORS.find((f) => f.id === id) ?? null;
}

/**
 * One word for a pick: the board's `word`, or the id itself when it names a
 * board this copy does not know yet. Null for absent or blank.
 */
export function styleWord(id: string | null | undefined): string | null {
  if (typeof id !== "string" || !id.trim()) return null;
  return styleBoard(id)?.word ?? id;
}

/** A flavour's label, or the id itself when it names a flavour this copy does not know yet. */
export function flavorLabel(id: string): string {
  return styleFlavor(id)?.label ?? id;
}

/** A board's feel as its parts: "earth tones, soft edges, ..." becomes ["earth tones", "soft edges", ...]. */
export function feelParts(b: StyleBoard): string[] {
  return b.feel.split(", ");
}
