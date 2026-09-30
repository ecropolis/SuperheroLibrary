/**
 * Type: the house font set and its pairings -- SuperheroLibrary, src/data/type.ts. THE SOURCE.
 *
 * Copies live downstream, each with its own header and this file's body:
 *
 *   ecropolis/SuperheroPortal  src/brand/type.data.ts  (the brand guide's typography, hearts)
 *
 * superherotech.ai vendors it too, for the public /type/ page and for /styles/,
 * which renders each board's type in its real family through `familyFor`.
 *
 * Only this header may differ; below it the file is one file in every repo.
 *
 * Each downstream repo pins the SHA-256 of everything after this comment, the
 * way it pins src/data/styles.ts. `npm run check` here prints the hash
 * (scripts/check-type.mjs). Change the body here first, then take it again
 * downstream in changes that move their pins to the new hash. A pin is moved
 * only together with its copy -- otherwise it records the drift instead of
 * guarding against it.
 *
 * This file is data only. No font file is committed to this repo: a site
 * installs the family's Fontsource `package`, imports its Latin subset and
 * serves it from its own origin.
 */

// Framework-free on purpose: no imports, no DOM, no Astro. The portal is a
// Worker, the site is Astro, and both read this as plain data.
// Rendering stays in each app; this file only says what the type IS.

/**
 * The board classes from src/data/styles.ts (`keyof typeof FONT_STACKS`),
 * written out rather than imported so this file stays importless.
 * scripts/check-type.mjs holds the two lists equal.
 */
type FontKey =
  | "system"
  | "geometric"
  | "mono"
  | "serif"
  | "didone"
  | "humanist"
  | "rounded"
  | "hand"
  | "slab"
  | "heavy"
  | "script";

/** The style board ids from src/data/styles.ts, written out for the same reason. */
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

/** The family ids, grouped by class in FONT_STACKS order. A class's first family is its default. */
export const TYPE_FAMILY_IDS = [
  "system-ui",
  "inter",
  "source-sans-3",
  "nunito-sans",
  "jost",
  "jetbrains-mono",
  "source-serif-4",
  "lora",
  "playfair-display",
  "fraunces",
  "eb-garamond",
  "nunito",
  "comic-neue",
  "roboto-slab",
  "archivo",
  "dancing-script",
] as const;

export type FamilyId = (typeof TYPE_FAMILY_IDS)[number];

/** The twelve pairing ids, in the order every page shows them. Hearts store these. */
export const TYPE_PAIRING_IDS = [
  "system",
  "quiet",
  "precise",
  "counsel",
  "atelier",
  "harvest",
  "old-style",
  "friendly",
  "crayon",
  "diner",
  "loud",
  "workshop",
] as const;

export type PairingId = (typeof TYPE_PAIRING_IDS)[number];

/** A client hearts up to two pairings. */
export const TYPE_PICKS_MAX = 2;

/** The most a pairing's families may weigh together, in KB of Latin woff2. */
export const TYPE_BUDGET_KB = 120;

/** The only two licences a family may carry. Both allow the files to be redistributed and self-hosted. */
export type TypeLicence = "OFL-1.1" | "Apache-2.0";

/**
 * A family. Every web family is a Fontsource package under OFL-1.1 or
 * Apache-2.0, checked against the package's own LICENSE at the version below.
 *
 * One family is not a download: `system-ui`, the device's own sans. It has
 * `source: "system"`, no package, no licence and zero bytes, so the "System"
 * pairing costs nothing and stays a legitimate choice.
 *
 * - `kb` is the Latin-subset upright woff2 a site loads, measured from
 *   Fontsource 5.3.0 (every package here is at 5.3.0), in KB of 1024 bytes to
 *   one decimal. For a variable family that is the `wght` file its default
 *   import (`index.css`) serves, which covers every weight; for a static one
 *   it is the sum of the listed `weights`. Italics are extra and load only
 *   where a page uses them.
 * - `axes` lists the axes the font has; the `wght` file carries only `wght`.
 *   The other axes (opsz, SOFT, wdth, ...) need the package's larger files.
 * - `weights` is what the pairings use, at most four.
 * - `fallback` is a local stack. `metrics` is for a fallback `@font-face`
 *   whose `src` is `local()` of the FIRST face in `fallback`, so the swap to
 *   the web font does not move the layout. The numbers are Capsize's
 *   (`@capsizecss/core` 4.1.3 `createFontStack`) with the web font measured
 *   from the Fontsource woff2 itself by `@capsizecss/unpack` 4.0.1 and the
 *   fallback's from `@capsizecss/metrics` 4.3.0; rounded to two decimals.
 */
export interface TypeFamily {
  id: FamilyId;
  /** The family's own name: "Inter". The CSS name is `cssFamily(f)`. */
  name: string;
  /** The board class it stands in for. Every FontKey has at least one family. */
  class: FontKey;
  source: "fontsource" | "system";
  /** "@fontsource-variable/inter"; null only for the system family. */
  package: string | null;
  licence: TypeLicence | null;
  /** The LICENSE file shipped in the package, at the version measured. */
  licenceUrl: string | null;
  designer: string;
  variable: boolean;
  axes?: readonly string[];
  weights: readonly number[];
  fallback: string;
  metrics?: { sizeAdjust: string; ascentOverride?: string; descentOverride?: string; lineGapOverride?: string };
  kb: number;
}

export interface TypePairing {
  id: PairingId;
  name: string;
  heading: FamilyId;
  body: FamilyId;
  /** A third face for small labels, eyebrows or figures, when the pairing has one. */
  label?: FamilyId;
  /** One line, at most 120 characters: what the pairing feels like. */
  feel: string;
  /**
   * The recommended heading settings. `scale` multiplies the site's heading
   * sizes; `tracking` is CSS letter-spacing; `lineHeight` is unitless.
   */
  headings: { scale: number; weight: number; tracking: string; upper: boolean; lineHeight: number };
  /** Body text: CSS font-size, unitless line-height, and max-width in ch. */
  bodySettings: { size: string; lineHeight: number; measure: string };
  /** The kinds of business it suits. */
  suits: readonly string[];
  /**
   * The style boards it serves. A board listed here has its heading and body
   * classes matched by this pairing's families, and its label class too when
   * the board names one, so the board's `type.note` stays true of it.
   */
  pairsWith: readonly StyleId[];
}

const SANS = "Arial, Helvetica, sans-serif";
const SERIF = "'Times New Roman', Times, serif";
const MONO = "'Courier New', Courier, monospace";
const LICENCE = (pkg: string) => `https://cdn.jsdelivr.net/npm/${pkg}@5.3.0/LICENSE`;

export const TYPE_FAMILIES: readonly TypeFamily[] = [
  /* ------------------------------------------------------------- system */
  {
    id: "system-ui",
    name: "System UI",
    class: "system",
    source: "system",
    package: null,
    licence: null,
    licenceUrl: null,
    designer: "The device's own: San Francisco, Segoe UI, Roboto",
    variable: false,
    weights: [400, 500, 600, 700],
    fallback: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    kb: 0,
  },
  {
    id: "inter",
    name: "Inter",
    class: "system",
    source: "fontsource",
    package: "@fontsource-variable/inter",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/inter"),
    designer: "Rasmus Andersson",
    variable: true,
    axes: ["wght", "opsz"],
    weights: [400, 500, 700],
    fallback: SANS,
    metrics: { sizeAdjust: "107.12%", ascentOverride: "90.44%", descentOverride: "22.52%", lineGapOverride: "0%" },
    kb: 47.1,
  },
  {
    id: "source-sans-3",
    name: "Source Sans 3",
    class: "system",
    source: "fontsource",
    package: "@fontsource-variable/source-sans-3",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/source-sans-3"),
    designer: "Paul D. Hunt for Adobe",
    variable: true,
    axes: ["wght"],
    weights: [400, 600],
    fallback: SANS,
    metrics: { sizeAdjust: "89.28%", ascentOverride: "114.7%", descentOverride: "44.8%", lineGapOverride: "0%" },
    kb: 28.1,
  },
  {
    id: "nunito-sans",
    name: "Nunito Sans",
    class: "system",
    source: "fontsource",
    package: "@fontsource-variable/nunito-sans",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/nunito-sans"),
    designer: "Vernon Adams, Jacques Le Bailly, Manvel Shmavonyan, Alexei Vanyashin",
    variable: true,
    axes: ["wght", "wdth", "opsz", "YTLC"],
    weights: [400, 700],
    fallback: SANS,
    metrics: { sizeAdjust: "97.8%", ascentOverride: "103.37%", descentOverride: "36.09%", lineGapOverride: "0%" },
    kb: 30.3,
  },
  /* ---------------------------------------------------------- geometric */
  {
    id: "jost",
    name: "Jost",
    class: "geometric",
    source: "fontsource",
    package: "@fontsource-variable/jost",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/jost"),
    designer: "Owen Earl (indestructible type*)",
    variable: true,
    axes: ["wght"],
    weights: [400, 500, 600],
    fallback: SANS,
    metrics: { sizeAdjust: "96.01%", ascentOverride: "111.45%", descentOverride: "39.06%", lineGapOverride: "0%" },
    kb: 26,
  },
  /* --------------------------------------------------------------- mono */
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono",
    class: "mono",
    source: "fontsource",
    package: "@fontsource-variable/jetbrains-mono",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/jetbrains-mono"),
    designer: "Philipp Nurullin and Konstantin Bulenkov for JetBrains",
    variable: true,
    axes: ["wght"],
    weights: [400, 500],
    fallback: MONO,
    metrics: { sizeAdjust: "99.98%", ascentOverride: "102.02%", descentOverride: "30%", lineGapOverride: "0%" },
    kb: 39.5,
  },
  /* -------------------------------------------------------------- serif */
  {
    id: "source-serif-4",
    name: "Source Serif 4",
    class: "serif",
    source: "fontsource",
    package: "@fontsource-variable/source-serif-4",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/source-serif-4"),
    designer: "Frank Grießhammer for Adobe",
    variable: true,
    axes: ["wght", "opsz"],
    weights: [400, 600, 700],
    fallback: SERIF,
    metrics: { sizeAdjust: "117.91%", ascentOverride: "87.87%", descentOverride: "28.41%", lineGapOverride: "0%" },
    kb: 49.6,
  },
  {
    id: "lora",
    name: "Lora",
    class: "serif",
    source: "fontsource",
    package: "@fontsource-variable/lora",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/lora"),
    designer: "Olga Karpushina for Cyreal",
    variable: true,
    axes: ["wght"],
    weights: [400, 500, 600],
    fallback: SERIF,
    metrics: { sizeAdjust: "115.2%", ascentOverride: "87.33%", descentOverride: "23.78%", lineGapOverride: "0%" },
    kb: 36.9,
  },
  /* ------------------------------------------------------------- didone */
  {
    id: "playfair-display",
    name: "Playfair Display",
    class: "didone",
    source: "fontsource",
    package: "@fontsource-variable/playfair-display",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/playfair-display"),
    designer: "Claus Eggers Sørensen",
    variable: true,
    axes: ["wght"],
    weights: [400, 600],
    fallback: SERIF,
    metrics: { sizeAdjust: "111.26%", ascentOverride: "97.25%", descentOverride: "22.56%", lineGapOverride: "0%" },
    kb: 37.5,
  },
  /* ----------------------------------------------------------- humanist */
  {
    id: "fraunces",
    name: "Fraunces",
    class: "humanist",
    source: "fontsource",
    package: "@fontsource-variable/fraunces",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/fraunces"),
    designer: "Undercase Type (Phaedra Charles, Flavia Zimbardi)",
    variable: true,
    axes: ["wght", "opsz", "SOFT", "WONK"],
    weights: [400, 600],
    fallback: SERIF,
    metrics: { sizeAdjust: "127.02%", ascentOverride: "77%", descentOverride: "20.08%", lineGapOverride: "0%" },
    kb: 35.8,
  },
  {
    id: "eb-garamond",
    name: "EB Garamond",
    class: "humanist",
    source: "fontsource",
    package: "@fontsource-variable/eb-garamond",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/eb-garamond"),
    designer: "Georg Duffner and Octavio Pardo",
    variable: true,
    axes: ["wght"],
    weights: [400, 500, 600],
    fallback: SERIF,
    metrics: { sizeAdjust: "94.77%", ascentOverride: "106.26%", descentOverride: "31.44%", lineGapOverride: "0%" },
    kb: 43.3,
  },
  /* ------------------------------------------------------------ rounded */
  {
    id: "nunito",
    name: "Nunito",
    class: "rounded",
    source: "fontsource",
    package: "@fontsource-variable/nunito",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/nunito"),
    designer: "Vernon Adams, Cyreal and Jacques Le Bailly",
    variable: true,
    axes: ["wght"],
    weights: [400, 700, 800],
    fallback: SANS,
    metrics: { sizeAdjust: "97.8%", ascentOverride: "103.37%", descentOverride: "36.09%", lineGapOverride: "0%" },
    kb: 38.2,
  },
  /* --------------------------------------------------------------- hand */
  {
    id: "comic-neue",
    name: "Comic Neue",
    class: "hand",
    source: "fontsource",
    package: "@fontsource/comic-neue",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource/comic-neue"),
    designer: "Craig Rozynski",
    variable: false,
    weights: [700],
    fallback: SANS,
    metrics: { sizeAdjust: "98.47%", ascentOverride: "91.39%", descentOverride: "25.39%", lineGapOverride: "0%" },
    kb: 18.8,
  },
  /* --------------------------------------------------------------- slab */
  {
    id: "roboto-slab",
    name: "Roboto Slab",
    class: "slab",
    source: "fontsource",
    package: "@fontsource-variable/roboto-slab",
    licence: "Apache-2.0",
    licenceUrl: LICENCE("@fontsource-variable/roboto-slab"),
    designer: "Christian Robertson",
    variable: true,
    axes: ["wght"],
    weights: [400, 700],
    fallback: SERIF,
    metrics: { sizeAdjust: "116.83%", ascentOverride: "89.69%", descentOverride: "23.2%", lineGapOverride: "0%" },
    kb: 33.4,
  },
  /* -------------------------------------------------------------- heavy */
  {
    id: "archivo",
    name: "Archivo",
    class: "heavy",
    source: "fontsource",
    package: "@fontsource-variable/archivo",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/archivo"),
    designer: "Héctor Gatti for Omnibus-Type",
    variable: true,
    axes: ["wght", "wdth"],
    weights: [700, 900],
    fallback: SANS,
    metrics: { sizeAdjust: "102.29%", ascentOverride: "85.84%", descentOverride: "20.53%", lineGapOverride: "0%" },
    kb: 34.1,
  },
  /* ------------------------------------------------------------- script */
  {
    id: "dancing-script",
    name: "Dancing Script",
    class: "script",
    source: "fontsource",
    package: "@fontsource-variable/dancing-script",
    licence: "OFL-1.1",
    licenceUrl: LICENCE("@fontsource-variable/dancing-script"),
    designer: "Pablo Impallari",
    variable: true,
    axes: ["wght"],
    weights: [500],
    fallback: SERIF,
    metrics: { sizeAdjust: "89.35%", ascentOverride: "102.96%", descentOverride: "31.34%", lineGapOverride: "0%" },
    kb: 41.7,
  },
];

export const TYPE_PAIRINGS: readonly TypePairing[] = [
  {
    id: "system",
    name: "System",
    heading: "system-ui",
    body: "system-ui",
    feel: "Nothing to download: the device's own sans, quick and familiar on every screen.",
    headings: { scale: 1, weight: 500, tracking: "-0.01em", upper: false, lineHeight: 1.15 },
    bodySettings: { size: "1rem", lineHeight: 1.55, measure: "68ch" },
    suits: ["Any site where speed matters most", "Portals and internal tools"],
    pairsWith: ["minimal"],
  },
  {
    id: "quiet",
    name: "Quiet",
    heading: "inter",
    body: "inter",
    feel: "One neutral sans at light weights; the work and the white space do the talking.",
    headings: { scale: 0.95, weight: 500, tracking: "-0.02em", upper: false, lineHeight: 1.15 },
    bodySettings: { size: "1rem", lineHeight: 1.6, measure: "66ch" },
    suits: ["Architects and designers", "Studios and consultancies"],
    pairsWith: ["minimal"],
  },
  {
    id: "precise",
    name: "Precise",
    heading: "jost",
    body: "inter",
    label: "jetbrains-mono",
    feel: "Geometric headings over a neutral text face, with a monospace detail for figures and labels.",
    headings: { scale: 1, weight: 600, tracking: "-0.02em", upper: false, lineHeight: 1.1 },
    bodySettings: { size: "1rem", lineHeight: 1.6, measure: "68ch" },
    suits: ["Software and tech services", "Engineering firms"],
    pairsWith: ["high-tech"],
  },
  {
    id: "counsel",
    name: "Counsel",
    heading: "source-serif-4",
    body: "source-sans-3",
    feel: "A serif and a sans drawn as one family: steady, legible and unfussy.",
    headings: { scale: 1, weight: 600, tracking: "0", upper: false, lineHeight: 1.2 },
    bodySettings: { size: "1.0625rem", lineHeight: 1.6, measure: "66ch" },
    suits: ["Accountants, lawyers and advisors", "Charities and member bodies"],
    pairsWith: ["classic"],
  },
  {
    id: "atelier",
    name: "Atelier",
    heading: "playfair-display",
    body: "source-serif-4",
    feel: "A high-contrast display serif, spaced out in capitals, over a calm text serif.",
    headings: { scale: 0.85, weight: 400, tracking: "0.08em", upper: true, lineHeight: 1.2 },
    bodySettings: { size: "1.0625rem", lineHeight: 1.65, measure: "64ch" },
    suits: ["Jewelers and fine goods", "Boutique hotels and restaurants"],
    pairsWith: ["luxurious"],
  },
  {
    id: "harvest",
    name: "Harvest",
    heading: "fraunces",
    body: "nunito-sans",
    feel: "A soft, warm serif with a gentle sans: grown rather than built.",
    headings: { scale: 1, weight: 600, tracking: "-0.01em", upper: false, lineHeight: 1.15 },
    bodySettings: { size: "1.0625rem", lineHeight: 1.6, measure: "66ch" },
    suits: ["Farms and food producers", "Cafés and bakeries"],
    pairsWith: ["natural"],
  },
  {
    id: "old-style",
    name: "Old style",
    heading: "eb-garamond",
    body: "nunito-sans",
    feel: "A Renaissance book face over a soft sans: warm, literate and unhurried.",
    headings: { scale: 1.1, weight: 500, tracking: "0", upper: false, lineHeight: 1.15 },
    bodySettings: { size: "1.0625rem", lineHeight: 1.6, measure: "66ch" },
    suits: ["Wineries and heritage estates", "Bookstores and publishers"],
    pairsWith: ["natural"],
  },
  {
    id: "friendly",
    name: "Friendly",
    heading: "nunito",
    body: "nunito",
    feel: "One round-ended sans, heavy for headings and light for text: cheerful and easy to read.",
    headings: { scale: 1.05, weight: 800, tracking: "-0.01em", upper: false, lineHeight: 1.1 },
    bodySettings: { size: "1.0625rem", lineHeight: 1.6, measure: "64ch" },
    suits: ["Local shops and repairs", "Pet care and family services"],
    pairsWith: ["playful"],
  },
  {
    id: "crayon",
    name: "Crayon",
    heading: "comic-neue",
    body: "nunito",
    feel: "Big hand-lettered headings over a round sans that children and parents both find easy.",
    headings: { scale: 1.1, weight: 700, tracking: "0", upper: false, lineHeight: 1.1 },
    bodySettings: { size: "1.125rem", lineHeight: 1.6, measure: "60ch" },
    suits: ["Preschools and children's services", "Schools and clubs"],
    pairsWith: ["childlike"],
  },
  {
    id: "diner",
    name: "Diner",
    heading: "roboto-slab",
    body: "inter",
    feel: "A sturdy slab for signs and headings, a plain sans for the menu.",
    headings: { scale: 1, weight: 700, tracking: "0.02em", upper: true, lineHeight: 1.1 },
    bodySettings: { size: "1rem", lineHeight: 1.6, measure: "66ch" },
    suits: ["Diners, cafés and bars", "Hardware stores and trades"],
    pairsWith: ["retro"],
  },
  {
    id: "loud",
    name: "Loud",
    heading: "archivo",
    body: "inter",
    feel: "Huge, heavy, tight capitals over a plain sans that stays out of the way.",
    headings: { scale: 1.35, weight: 900, tracking: "-0.03em", upper: true, lineHeight: 0.95 },
    bodySettings: { size: "1rem", lineHeight: 1.55, measure: "64ch" },
    suits: ["Gyms and fitness", "Events and promoters"],
    pairsWith: ["bold"],
  },
  {
    id: "workshop",
    name: "Workshop",
    heading: "lora",
    body: "source-sans-3",
    label: "dancing-script",
    feel: "A brushed, calligraphic serif and a clear sans, with a script for the maker's signature.",
    headings: { scale: 1, weight: 600, tracking: "0", upper: false, lineHeight: 1.2 },
    bodySettings: { size: "1.0625rem", lineHeight: 1.6, measure: "66ch" },
    suits: ["Makers and craft studios", "Florists and gift shops"],
    pairsWith: ["handcrafted"],
  },
];

/* ------------------------------------------------------------------- helpers */

export function isFamilyId(v: unknown): v is FamilyId {
  return typeof v === "string" && (TYPE_FAMILY_IDS as readonly string[]).includes(v);
}

export function isPairingId(v: unknown): v is PairingId {
  return typeof v === "string" && (TYPE_PAIRING_IDS as readonly string[]).includes(v);
}

/** A family by id, or null for anything that is not one. */
export function familyById(id: string | null | undefined): TypeFamily | null {
  if (typeof id !== "string") return null;
  return TYPE_FAMILIES.find((f) => f.id === id) ?? null;
}

/** A pairing by id, or null for anything that is not one of the twelve. Never the nearest pairing. */
export function pairingById(id: string | null | undefined): TypePairing | null {
  if (typeof id !== "string") return null;
  return TYPE_PAIRINGS.find((p) => p.id === id) ?? null;
}

/**
 * The family a board class renders in: the first family of that class, in
 * TYPE_FAMILIES order. Every FontKey has one (scripts/check-type.mjs holds it),
 * and `system` resolves to the device's own sans, as the boards always drew it.
 */
export function familyFor(key: FontKey): TypeFamily {
  return TYPE_FAMILIES.find((f) => f.class === key)!;
}

/**
 * The CSS name Fontsource registers the family under: "Inter Variable" for a
 * variable package, "Comic Neue" for a static one. Null for the system family,
 * which is its `fallback` stack alone.
 */
export function cssFamily(f: TypeFamily): string | null {
  if (f.source === "system") return null;
  return f.variable ? `${f.name} Variable` : f.name;
}

/** The families a pairing loads -- heading, body and label, each once. */
export function pairingFamilies(p: TypePairing): TypeFamily[] {
  const ids = [p.heading, p.body, ...(p.label ? [p.label] : [])];
  return [...new Set(ids)].map((id) => familyById(id)!);
}

/** What a pairing costs to load, in KB of Latin woff2, to one decimal. */
export function pairingKb(p: TypePairing): number {
  return Math.round(pairingFamilies(p).reduce((sum, f) => sum + f.kb, 0) * 10) / 10;
}
