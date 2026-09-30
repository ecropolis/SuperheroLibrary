/**
 * Colour palettes -- SuperheroLibrary, src/data/palettes.ts. THE SOURCE.
 *
 * Two copies live downstream, each with its own header and this file's body:
 *
 *   ecropolis/SuperheroPortal  src/brand/palettes.data.ts   (the questionnaire's palette step and the brand guide)
 *   ecropolis/SuperheroAdmin   src/domain/palettes.data.ts  (the console's brand panel)
 *
 * superherotech.ai vendors it too, for the public /colours/ page.
 *
 * Only this header may differ; below it the file is one file in three repos.
 *
 * Each downstream repo pins the SHA-256 of everything after this comment, the
 * way it pins src/data/styles.ts. `npm run check` here prints the hash
 * (scripts/check-palettes.mjs). Change the body here first, then take it again
 * in the portal and the console in changes that move their pins to the new
 * hash. A pin is moved only together with its copy -- otherwise it records the
 * drift instead of guarding against it.
 */

// Framework-free on purpose: no imports, no DOM, no Astro. The portal and the
// console are Workers, the site is Astro, and all three read this as plain data.
// Rendering stays in each app; this file only says what the palettes ARE.

/**
 * The six directions, in the order every page shows them. Each is also the id
 * of the palette that first stood for it -- the six the portal's questionnaire
 * offered before there were twelve, whose slugs clients have already answered
 * with. Renaming one orphans those answers.
 */
export const DIRECTION_IDS = [
  "classic-professional",
  "warm-earthy",
  "bold-modern",
  "fresh-natural",
  "elegant-neutral",
  "vibrant-playful",
] as const;

export type DirectionId = (typeof DIRECTION_IDS)[number];

/** The twelve ids, in order: each direction's original palette, then its sibling. */
export const PALETTE_IDS = [
  "classic-professional",
  "slate-and-copper",
  "warm-earthy",
  "terracotta-and-sage",
  "bold-modern",
  "ink-and-coral",
  "fresh-natural",
  "forest-and-cream",
  "elegant-neutral",
  "stone-and-charcoal",
  "vibrant-playful",
  "sunshine-and-teal",
] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

/** A client hearts up to two palettes: a primary and an alternative. */
export const PALETTE_PICKS_MAX = 2;

/**
 * The style board ids from src/data/styles.ts, written out rather than
 * imported so this file stays importless. scripts/check-palettes.mjs holds the
 * two lists equal.
 */
type StyleId =
  | "high-tech"
  | "minimal"
  | "classic"
  | "natural"
  | "luxurious"
  | "playful"
  | "childlike"
  | "retro"
  | "bold"
  | "handcrafted";

/** The brand guide's five colours, unchanged from the portal's six. Hex is lowercase #rrggbb. */
export interface PaletteColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

/**
 * The seven colours the /colours/ hero is painted with, always in this order.
 * `background`, `ink`, `primary` and `accent` are the same hexes as `colors`'
 * background, text, primary and accent.
 */
export type PaletteRoleName = "background" | "surface" | "ink" | "muted" | "primary" | "on-primary" | "accent";

export const PALETTE_ROLES: readonly PaletteRoleName[] = [
  "background",
  "surface",
  "ink",
  "muted",
  "primary",
  "on-primary",
  "accent",
];

/**
 * The four pairs every palette is measured on, with their WCAG 2.x floors:
 * body text and button labels at 4.5:1, the accent at 3:1 (large text and
 * non-text marks).
 */
export const CONTRAST_PAIRS: readonly { fg: PaletteRoleName; bg: PaletteRoleName; floor: number }[] = [
  { fg: "ink", bg: "background", floor: 4.5 },
  { fg: "on-primary", bg: "primary", floor: 4.5 },
  { fg: "accent", bg: "background", floor: 3 },
  { fg: "muted", bg: "background", floor: 4.5 },
];

/**
 * One measured pair. `ratio` is truncated (never rounded up) to two places.
 * `passes` is judged against the pair's floor: "AA" at 4.5 or more, "AA-large"
 * at 3 or more when the floor is 3, "fail" below the floor -- so an on-primary
 * at 4.1 is a fail, not AA-large, because button labels are not large text.
 */
export interface PaletteContrast {
  pair: string;
  ratio: number;
  passes: "AA" | "AA-large" | "fail";
}

export interface Palette {
  id: PaletteId;
  /** "Slate and copper". */
  name: string;
  /** The direction it belongs to: the id of that direction's original palette. */
  direction: DirectionId;
  /** One line, at most 120 characters: how it feels. */
  mood: string;
  colors: PaletteColors;
  /** Seven roles, in PALETTE_ROLES order. */
  roles: readonly { name: PaletteRoleName; hex: string }[];
  /** Measured from `roles` by paletteContrast(), never typed. */
  contrast: readonly PaletteContrast[];
  /** At most 300 characters: what the colours say, and where they say something else. */
  culture: string;
  /** Kinds of business or mood it suits, at most six. */
  suits: readonly string[];
  /** Style boards it sits well with. */
  pairsWith: readonly StyleId[];
  /** A live demo site that uses this palette. Set only where one honestly does. */
  demo?: { href: string; label: string };
}

/* ------------------------------------------------------------------ contrast */

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance of a #rrggbb colour. */
export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG 2.x contrast ratio between two #rrggbb colours, unrounded. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** A palette's four measured pairs, in CONTRAST_PAIRS order. Pure. */
export function paletteContrast(p: { roles: readonly { name: PaletteRoleName; hex: string }[] }): PaletteContrast[] {
  const hex = (name: PaletteRoleName): string => {
    const r = p.roles.find((x) => x.name === name);
    if (!r) throw new Error(`palette has no ${name} role`);
    return r.hex;
  };
  return CONTRAST_PAIRS.map(({ fg, bg, floor }) => {
    const ratio = Math.floor(contrastRatio(hex(fg), hex(bg)) * 100) / 100;
    const passes = ratio < floor ? "fail" : ratio >= 4.5 ? "AA" : "AA-large";
    return { pair: `${fg} on ${bg}`, ratio, passes };
  });
}

/* ------------------------------------------------------------------ palettes */

/*
 * The six originals keep the hexes the portal's brand guide has always drawn,
 * and their roles are derived from those colours, not chosen: background, ink,
 * primary and accent are `colors` as they are; on-primary is whichever of
 * background or text reads better on the primary; muted is text mixed 30%
 * toward background; surface is background mixed 6% toward text. Where an
 * original falls under a floor it is measured and shown as a fail, never
 * nudged -- nudging would change brand guides clients already have.
 */
const PALETTE_DATA: readonly Omit<Palette, "contrast">[] = [
  {
    id: "classic-professional",
    name: "Classic professional",
    direction: "classic-professional",
    mood: "steady, confident, a little formal",
    colors: { primary: "#1f3a5f", secondary: "#4a6fa5", accent: "#c9a227", background: "#f7f9fc", text: "#1c2733" },
    roles: [
      { name: "background", hex: "#f7f9fc" },
      { name: "surface", hex: "#eaecf0" },
      { name: "ink", hex: "#1c2733" },
      { name: "muted", hex: "#5e666f" },
      { name: "primary", hex: "#1f3a5f" },
      { name: "on-primary", hex: "#f7f9fc" },
      { name: "accent", hex: "#c9a227" },
    ],
    culture:
      "Navy is the color of uniforms, banks and courtrooms in the US and UK, so it reads as trust and authority, and can read as cold. Gold says quality; at Chinese New Year or an Indian wedding it says prosperity and celebration, so the accent may feel warmer to some visitors than you meant.",
    suits: ["Law", "Finance", "Consulting", "Accounting", "Insurance"],
    pairsWith: ["classic", "minimal"],
  },
  {
    id: "slate-and-copper",
    name: "Slate and copper",
    direction: "classic-professional",
    mood: "grounded, modern, quietly expert",
    colors: { primary: "#33475b", secondary: "#6b7f94", accent: "#a8552a", background: "#f5f6f8", text: "#1e2530" },
    roles: [
      { name: "background", hex: "#f5f6f8" },
      { name: "surface", hex: "#ffffff" },
      { name: "ink", hex: "#1e2530" },
      { name: "muted", hex: "#566070" },
      { name: "primary", hex: "#33475b" },
      { name: "on-primary", hex: "#ffffff" },
      { name: "accent", hex: "#a8552a" },
    ],
    culture:
      "Slate is roofs, suits and steel: neutral almost everywhere, which is its strength and its risk, because neutral can read as dull. Copper points to trades and workmanship, pans, pipes and stills, and warms the page without gold's sense of ceremony.",
    suits: ["Engineering", "Architecture", "Financial advice", "Business services", "Trades"],
    pairsWith: ["high-tech", "minimal", "classic"],
  },
  {
    id: "warm-earthy",
    name: "Warm & earthy",
    direction: "warm-earthy",
    mood: "warm, homey, rooted",
    colors: { primary: "#9c4a2f", secondary: "#6f7d4d", accent: "#e0a458", background: "#faf6f0", text: "#33302b" },
    roles: [
      { name: "background", hex: "#faf6f0" },
      { name: "surface", hex: "#eeeae4" },
      { name: "ink", hex: "#33302b" },
      { name: "muted", hex: "#6f6b66" },
      { name: "primary", hex: "#9c4a2f" },
      { name: "on-primary", hex: "#faf6f0" },
      { name: "accent", hex: "#e0a458" },
    ],
    culture:
      "Terracotta and olive are the clay pots, roof tiles and groves of the Mediterranean, and to many visitors they mean food and hospitality. Olive also has a military edge in the US, and browns can look dated unless the photography is warm too.",
    suits: ["Restaurants", "Bakeries", "Craft", "Wellness", "Delis"],
    pairsWith: ["natural", "handcrafted", "retro"],
  },
  {
    id: "terracotta-and-sage",
    name: "Terracotta and sage",
    direction: "warm-earthy",
    mood: "sunlit, calm, made by hand",
    colors: { primary: "#a3472a", secondary: "#8a9a7b", accent: "#5f7a55", background: "#fbf5ee", text: "#2f2a25" },
    roles: [
      { name: "background", hex: "#fbf5ee" },
      { name: "surface", hex: "#f3e9dc" },
      { name: "ink", hex: "#2f2a25" },
      { name: "muted", hex: "#6b6157" },
      { name: "primary", hex: "#a3472a" },
      { name: "on-primary", hex: "#ffffff" },
      { name: "accent", hex: "#5f7a55" },
    ],
    culture:
      "Sage has become the shorthand for calm in UK and US wellness and interiors, popular enough now to look generic on its own. In Mexico or Spain terracotta is simply what floors and roofs are made of, so it reads as home rather than as a trend.",
    suits: ["Pottery", "Yoga and therapy", "Garden design", "Cafés", "Interiors"],
    pairsWith: ["natural", "handcrafted"],
  },
  {
    id: "bold-modern",
    name: "Bold & modern",
    direction: "bold-modern",
    mood: "confident, electric, of the moment",
    colors: { primary: "#6d28d9", secondary: "#111827", accent: "#f43f5e", background: "#ffffff", text: "#1f2937" },
    roles: [
      { name: "background", hex: "#ffffff" },
      { name: "surface", hex: "#f2f2f3" },
      { name: "ink", hex: "#1f2937" },
      { name: "muted", hex: "#626973" },
      { name: "primary", hex: "#6d28d9" },
      { name: "on-primary", hex: "#ffffff" },
      { name: "accent", hex: "#f43f5e" },
    ],
    culture:
      "Violet reads as creative and digital because so much software uses it. It has older meanings: in Catholic churches it marks Lent and Advent, a color of waiting and penitence, and in Thailand it is traditionally worn in mourning. The hot pink-red accent reads as urgent, so use it sparingly.",
    suits: ["Software", "Agencies", "Startups", "Events", "Music"],
    pairsWith: ["high-tech", "bold"],
  },
  {
    id: "ink-and-coral",
    name: "Ink and coral",
    direction: "bold-modern",
    mood: "sharp, editorial, warm at the edges",
    colors: { primary: "#1b1f3b", secondary: "#3d4270", accent: "#e04e39", background: "#ffffff", text: "#14172b" },
    roles: [
      { name: "background", hex: "#ffffff" },
      { name: "surface", hex: "#f4f4f7" },
      { name: "ink", hex: "#14172b" },
      { name: "muted", hex: "#5b5f75" },
      { name: "primary", hex: "#1b1f3b" },
      { name: "on-primary", hex: "#ffffff" },
      { name: "accent", hex: "#e04e39" },
    ],
    culture:
      "Near-black ink with one coral note is the look of magazines and newer banks: assured, with a human touch. Red-orange also means stop, sale and error on most screens, so keep it to one action per view or it starts to read as an alert.",
    suits: ["Publishing", "Fintech", "Agencies", "Consultancies", "Fashion"],
    pairsWith: ["bold", "minimal", "high-tech"],
  },
  {
    id: "fresh-natural",
    name: "Fresh & natural",
    direction: "fresh-natural",
    mood: "fresh, healthy, out of doors",
    colors: { primary: "#2f7d47", secondary: "#7fb069", accent: "#f4a259", background: "#f6faf4", text: "#24382a" },
    roles: [
      { name: "background", hex: "#f6faf4" },
      { name: "surface", hex: "#e9eee8" },
      { name: "ink", hex: "#24382a" },
      { name: "muted", hex: "#637267" },
      { name: "primary", hex: "#2f7d47" },
      { name: "on-primary", hex: "#f6faf4" },
      { name: "accent", hex: "#f4a259" },
    ],
    culture:
      "Green says growth, health and go on most traffic lights, and money in the US, where the notes are green. In many Muslim communities green carries religious weight, and on packaging it implies environmental claims, so be ready to back them.",
    suits: ["Landscaping", "Outdoors", "Health", "Garden centers", "Vets"],
    pairsWith: ["natural", "playful"],
  },
  {
    id: "forest-and-cream",
    name: "Forest and cream",
    direction: "fresh-natural",
    mood: "deep, established, quietly rural",
    colors: { primary: "#1f4d36", secondary: "#4f7a5f", accent: "#a65f1c", background: "#faf6ea", text: "#1f2d24" },
    roles: [
      { name: "background", hex: "#faf6ea" },
      { name: "surface", hex: "#f0ead6" },
      { name: "ink", hex: "#1f2d24" },
      { name: "muted", hex: "#5a6a5e" },
      { name: "primary", hex: "#1f4d36" },
      { name: "on-primary", hex: "#faf6ea" },
      { name: "accent", hex: "#a65f1c" },
    ],
    culture:
      "Dark green on cream is British racing green and the old railway liveries, so in the UK it reads as heritage and quality. Elsewhere it simply reads as woods and fields. The rust accent keeps it from looking like a bank.",
    suits: ["Farms", "Garden centers", "Real estate agents", "Outdoor gear", "Distilleries"],
    pairsWith: ["natural", "classic", "luxurious"],
  },
  {
    id: "elegant-neutral",
    name: "Elegant neutrals",
    direction: "elegant-neutral",
    mood: "restrained, refined, lets the work speak",
    colors: { primary: "#423e37", secondary: "#8a817c", accent: "#b08d57", background: "#faf9f7", text: "#2b2926" },
    roles: [
      { name: "background", hex: "#faf9f7" },
      { name: "surface", hex: "#eeedea" },
      { name: "ink", hex: "#2b2926" },
      { name: "muted", hex: "#696765" },
      { name: "primary", hex: "#423e37" },
      { name: "on-primary", hex: "#faf9f7" },
      { name: "accent", hex: "#b08d57" },
    ],
    culture:
      "Warm grays step back so photographs lead, which is why galleries and interior designers use them. Neutrals carry few cultural meanings of their own, but gray alone can feel somber or unfinished; the bronze warms it and hints at craft rather than luxury.",
    suits: ["Interiors", "Photography", "Boutiques", "Architecture"],
    pairsWith: ["minimal", "luxurious"],
  },
  {
    id: "stone-and-charcoal",
    name: "Stone and charcoal",
    direction: "elegant-neutral",
    mood: "quiet, architectural, monochrome with warmth",
    colors: { primary: "#2e3136", secondary: "#a39e94", accent: "#8a6a4a", background: "#f4f2ee", text: "#24262a" },
    roles: [
      { name: "background", hex: "#f4f2ee" },
      { name: "surface", hex: "#e9e5de" },
      { name: "ink", hex: "#24262a" },
      { name: "muted", hex: "#62605b" },
      { name: "primary", hex: "#2e3136" },
      { name: "on-primary", hex: "#f4f2ee" },
      { name: "accent", hex: "#8a6a4a" },
    ],
    culture:
      "Near-monochrome reads as considered and premium in fashion and in Japanese and Scandinavian design. Black is worn for mourning in Britain and the US; white is, in China and in Hindu tradition. Here neither dominates: stone and a leather brown keep it warm.",
    suits: ["Architecture", "Fashion", "Photography", "Furniture", "Salons"],
    pairsWith: ["minimal", "luxurious", "high-tech"],
  },
  {
    id: "vibrant-playful",
    name: "Vibrant & playful",
    direction: "vibrant-playful",
    mood: "loud, happy, ready for a party",
    colors: { primary: "#e63946", secondary: "#457b9d", accent: "#ffb703", background: "#fffdf7", text: "#22223b" },
    roles: [
      { name: "background", hex: "#fffdf7" },
      { name: "surface", hex: "#f2f0ec" },
      { name: "ink", hex: "#22223b" },
      { name: "muted", hex: "#646473" },
      { name: "primary", hex: "#e63946" },
      { name: "on-primary", hex: "#fffdf7" },
      { name: "accent", hex: "#ffb703" },
    ],
    culture:
      "Red is luck and celebration at Chinese New Year and the color of the bride at a Hindu wedding; in most shops it means sale, and on forms it means error. With sunshine yellow it can recall fast food, which the steadier blue helps to offset.",
    suits: ["Events", "Children's activities", "Festivals", "Creative studios", "Toy stores"],
    pairsWith: ["playful", "childlike", "bold"],
  },
  {
    id: "sunshine-and-teal",
    name: "Sunshine and teal",
    direction: "vibrant-playful",
    mood: "sunny, relaxed, a day at the coast",
    colors: { primary: "#ffc529", secondary: "#f08a4b", accent: "#0f766e", background: "#fffaf0", text: "#12343b" },
    roles: [
      { name: "background", hex: "#fffaf0" },
      { name: "surface", hex: "#fff0c2" },
      { name: "ink", hex: "#12343b" },
      { name: "muted", hex: "#4f6a70" },
      { name: "primary", hex: "#ffc529" },
      { name: "on-primary", hex: "#12343b" },
      { name: "accent", hex: "#0f766e" },
    ],
    culture:
      "Yellow is optimism and warmth to most visitors and also caution, from road signs to hazard tape, so a calm teal carries the text. Saffron-yellow is the robe of Buddhist monks in Thailand and Sri Lanka, worth knowing if your visitors include those communities.",
    suits: ["Swim and surf schools", "Cafés", "Vacation rentals", "Kids' classes", "Florists"],
    pairsWith: ["playful", "natural", "retro"],
  },
];

export const PALETTES: readonly Palette[] = PALETTE_DATA.map((p) => ({ ...p, contrast: paletteContrast(p) }));

/* ------------------------------------------------------------------- helpers */

export function isPaletteId(v: unknown): v is PaletteId {
  return typeof v === "string" && (PALETTE_IDS as readonly string[]).includes(v);
}

/** A palette by id, or null for anything that is not one of the twelve. Never the nearest palette. */
export function paletteById(id: string | null | undefined): Palette | null {
  if (typeof id !== "string") return null;
  return PALETTES.find((p) => p.id === id) ?? null;
}
