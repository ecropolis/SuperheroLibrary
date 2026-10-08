/**
 * fetchCatalog — the Superhero Shop catalogue, for an Astro build. Copy this file into the site's
 * `src/lib/` beside the shop elements (cart, product-list, product-page); it is the one place a
 * shop site talks to the Worker at build time.
 *
 *   ---
 *   import { fetchCatalog } from '../lib/fetchCatalog';
 *   const catalog = await fetchCatalog('domino-works');
 *   ---
 *   <ProductList products={catalog.products} currency={catalog.currency} />
 *
 * and for one page per product (src/pages/shop/[slug].astro):
 *
 *   export async function getStaticPaths() {
 *     const catalog = await fetchCatalog('domino-works');
 *     return catalog.products.map((product) => ({ params: { slug: product.slug }, props: { product, catalog } }));
 *   }
 *
 * GET https://shop.superherotech.ai/v1/shops/<site>/catalog is public (no key) and answers
 * `{ site, open, currency, products: [{ id, slug, name, description, images, variations:
 * [{ id, name, price_cents, tracked }] }] }`. The Worker keeps its last good copy past a Square
 * outage, and answers 503 only when it has never had one (`not_connected`, `no_location`,
 * `no_category`).
 *
 * A failure THROWS, with one sentence, so the build fails and the last good deploy stays live.
 * That is deliberate: a shop page built from nothing would publish an empty shop, and a
 * catalogue edit in Square fires the deploy hook again anyway. Every product is checked
 * against the contract; a malformed one fails the build rather than reaching a page with a
 * missing price. Deploy hooks: the Worker fires the site's on `catalog.version.updated`, at most
 * once per five minutes, with a trailing edge.
 *
 * `description` is Square's item description as PLAIN TEXT (the Worker passes Square's
 * `description` field through and never returns HTML); render it as text.
 */
export interface ShopVariation {
  id: string;
  name: string;
  /** In the currency's minor unit (cents for USD). For display only: the cart never sends it. */
  price_cents: number;
  /** false: Square does not count it, so it is always available. */
  tracked: boolean;
}
export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  /** Plain text; may hold newlines. */
  description: string;
  images: string[];
  variations: ShopVariation[];
}
export interface ShopCatalog {
  site: string;
  /** false unless the shop is live. A build-time snapshot: the checkout's 503 is the truth. */
  open: boolean;
  /** ISO 4217, or null when the shop has no priced variation yet. */
  currency: string | null;
  products: ShopProduct[];
}
export interface FetchCatalogOptions {
  /** The Worker's origin. Default https://shop.superherotech.ai. */
  api?: string;
  /** For tests: a fetch to use instead of the global one. */
  fetch?: typeof globalThis.fetch;
  /** Give up after this many ms. Default 15000. */
  timeoutMs?: number;
}

const SITE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** Throws a sentence naming what is wrong; returns the catalogue as the contract describes it. */
export function parseCatalog(raw: unknown, site: string): ShopCatalog {
  const bad = (why: string): never => {
    throw new Error(`fetchCatalog("${site}"): ${why}`);
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) bad('the answer is not a JSON object.');
  const c = raw as Record<string, unknown>;
  if (!Array.isArray(c.products)) bad('the answer has no `products` list.');
  if (c.currency !== null && (typeof c.currency !== 'string' || !/^[A-Z]{3}$/.test(c.currency))) bad(`currency ${JSON.stringify(c.currency)} is not an ISO 4217 code.`);
  const slugs = new Set<string>();
  const variationIds = new Set<string>();
  const products: ShopProduct[] = (c.products as unknown[]).map((p, i) => {
    const at = `product #${i + 1}`;
    if (!p || typeof p !== 'object') bad(`${at} is not an object.`);
    const q = p as Record<string, unknown>;
    if (typeof q.id !== 'string' || !ID_RE.test(q.id)) bad(`${at} has no Square id.`);
    if (typeof q.slug !== 'string' || !SITE_RE.test(q.slug)) bad(`${at} ("${String(q.name)}") has slug ${JSON.stringify(q.slug)}, which is not a URL segment.`);
    if (slugs.has(q.slug as string)) bad(`slug "${String(q.slug)}" appears twice.`);
    slugs.add(q.slug as string);
    if (typeof q.name !== 'string' || !q.name.trim()) bad(`${at} has no name.`);
    if (q.description !== undefined && typeof q.description !== 'string') bad(`${at} has a description that is not text.`);
    if (q.images !== undefined && (!Array.isArray(q.images) || !q.images.every((u) => typeof u === 'string' && /^https?:\/\//.test(u)))) bad(`${at} has images that are not URLs.`);
    if (!Array.isArray(q.variations) || q.variations.length === 0) bad(`${at} ("${q.name}") has no variations; the Worker leaves out a product with nothing to sell.`);
    const variations = (q.variations as unknown[]).map((v, j) => {
      const vat = `${at} ("${q.name}"), variation #${j + 1}`;
      if (!v || typeof v !== 'object') bad(`${vat} is not an object.`);
      const w = v as Record<string, unknown>;
      if (typeof w.id !== 'string' || !ID_RE.test(w.id)) bad(`${vat} has no Square id.`);
      if (variationIds.has(w.id as string)) bad(`variation id ${String(w.id)} appears twice.`);
      variationIds.add(w.id as string);
      if (typeof w.name !== 'string') bad(`${vat} has no name.`);
      if (typeof w.price_cents !== 'number' || !Number.isInteger(w.price_cents) || w.price_cents < 0) bad(`${vat} has price_cents ${JSON.stringify(w.price_cents)}, not a whole number of minor units.`);
      if (typeof w.tracked !== 'boolean') bad(`${vat} has no \`tracked\` true or false.`);
      return { id: w.id as string, name: w.name as string, price_cents: w.price_cents as number, tracked: w.tracked as boolean };
    });
    return {
      id: q.id as string,
      slug: q.slug as string,
      name: q.name as string,
      description: (q.description as string | undefined) ?? '',
      images: (q.images as string[] | undefined) ?? [],
      variations,
    };
  });
  if (products.length && c.currency === null) bad('the catalogue has products but no currency.');
  return { site: typeof c.site === 'string' ? c.site : site, open: c.open === true, currency: (c.currency as string | null) ?? null, products };
}

export async function fetchCatalog(site: string, options: FetchCatalogOptions = {}): Promise<ShopCatalog> {
  const { api = 'https://shop.superherotech.ai', fetch: f = globalThis.fetch, timeoutMs = 15000 } = options;
  if (!SITE_RE.test(site)) throw new Error(`fetchCatalog: "${site}" is not a site key (lowercase words joined by single hyphens).`);
  const url = `${api.replace(/\/+$/, '')}/v1/shops/${site}/catalog`;
  let res: Response;
  try {
    res = await f(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    throw new Error(`fetchCatalog("${site}"): could not reach ${url} (${(e as Error).message}), so the shop pages cannot be built.`);
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const reason = body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string' ? (body as { error: string }).error : `HTTP ${res.status}`;
    const hint: Record<string, string> = {
      not_found: 'the Worker has no shop for this site key',
      not_connected: 'the seller has not connected Square yet',
      no_location: 'the shop has no Square location chosen',
      no_category: 'the shop has no visible Square category chosen',
    };
    throw new Error(`fetchCatalog("${site}"): ${url} answered ${res.status} (${reason}${hint[reason] ? `: ${hint[reason]}` : ''}), so the shop pages cannot be built.`);
  }
  return parseCatalog(body, site);
}
