#!/usr/bin/env node
/**
 * npm run check (after check-catalog.mjs, which builds dist/) — pins the three shop elements:
 * cart, product-list and product-page, built to the Superhero Shop Worker's contract
 * (ecropolis/SuperheroShop, README "The catalogue contract" and "The checkout contract").
 *
 * cart, its rules: the `<cart-core>` block of src/library/cart/Cart.astro, types stripped, run
 *   against golden cases. The caps (20 lines, 1 to 20 of each), cleaning stored data, the display
 *   subtotal and shipping estimate, money in the currency's minor unit; then the checkout against
 *   a recording fake fetch: stock re-checked before the POST (and a short line stops it), the
 *   POST body exactly { items: [{ variationId, quantity }], fulfillment, pickupPoint?,
 *   idempotencyKey } with NO PRICE in any request, a fresh key per attempt, the 409 `short`
 *   clamp, 503 "This shop is closed for the moment.", a network failure as one sentence, only
 *   an https URL redirected to, and the other refusals named.
 * cart, the built page: the trigger (hidden until the script, aria-haspopup="dialog",
 *   aria-controls on the drawer, aria-expanded), the drawer (a closed native <dialog> named by
 *   its heading, opened with showModal(), focus back to the trigger on close), a named close
 *   button, exactly one aria-live per cart and none in the drawer, the mount script straight
 *   after each cart and the runtime once per page, every add button hidden and aimed at a cart
 *   on the page. The built runtime holds the same caps as the source.
 * product-list: one link per card, images lazy and sized with alt="", the from-price, Sold out
 *   exactly where every tracked variation is at 0 (in the badge and in the link's name).
 * product-page: the Product JSON-LD's shape (one Offer per variation, sku, price as a decimal
 *   string, currency, availability from stock, "<" escaped), the picker only with more than one
 *   variation, quantity 1..20, the add button hidden until the cart runs, the description as
 *   text, and on superherotech.ai's demo the structured data shown, never emitted.
 * fetchCatalog: a good catalogue parses; a malformed one, a 503 and a dead network throw a
 *   sentence. The two demo stubs are one copy.
 *
 * Mutation test: every rule above runs again on deliberately broken copies (a price in the body,
 * a reused key, the clamp undone, a cap moved, aria-live in the drawer, an Offer's price as a
 * number…). Every mutant must be caught, or the check itself is broken.
 *
 * Exits 1 with one line per failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const finish = (stage) => {
  if (!failures.length) return;
  console.error(`check-shop failed (${stage}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};
const read = (rel) => {
  const p = join(root, rel);
  if (!existsSync(p)) {
    failures.push(`${rel} is missing; run astro build (check-catalog.mjs does) first.`);
    return '';
  }
  return readFileSync(p, 'utf8');
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ------------------------------------------------------------------ html helpers
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>/]))`));
  return m ? (m[1] ?? '') : undefined;
};
const decode = (s = '') =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const text = (s) => decode(s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const block = (html, index, tag) => {
  const re = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g');
  re.lastIndex = index;
  let depth = 0;
  for (let t; (t = re.exec(html)); ) {
    depth += t[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(index, re.lastIndex);
  }
  return html.slice(index);
};
const roots = (html, tag, marker) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*\\s${marker}(?=[\\s>=])[^>]*>`, 'g'))].map((m) => ({ open: m[0], index: m.index, html: block(html, m.index, tag) }));
const tags = (html, re) => [...html.matchAll(re)].map((m) => ({ open: m[0], index: m.index }));
const textOfId = (html, id) => {
  const m = html.match(new RegExp(`<([a-z0-9]+)\\b[^>]*\\sid="${id}"[^>]*>`));
  return m ? text(block(html, m.index, m[1])) : null;
};

// ------------------------------------------------------------------ fixtures
const fixture = JSON.parse(read('public/demo/shop-catalog.json'));
const stock = JSON.parse(read('public/demo/shop-stock.json'));
finish('fixtures');
for (const p of fixture.products) for (const img of p.images) if (!existsSync(join(root, 'public/demo', img))) failures.push(`public/demo/shop-catalog.json names image ${img}, which is not in public/demo/.`);
const known = new Set(fixture.products.flatMap((p) => p.variations.map((v) => v.id)));
const priceOf = Object.fromEntries(fixture.products.flatMap((p) => p.variations.map((v) => [v.id, v.price_cents])));

// =================================================================== cart: the rules
const CORE_NAMES = 'MAX_LINES, MAX_QTY, KEY_RE, sanitize, addLine, setQty, removeLine, count, subtotal, shipping, money, newKey, checkoutBody, applyStock, applyShort, checkout, MESSAGES';
const cartSource = read('src/library/cart/Cart.astro');
const coreOf = (source) => source.match(/\/\/ <cart-core>[^\n]*\n([\s\S]*?)\/\/ <\/cart-core>/)?.[1];
const loadCore = async (core) => import(`data:text/javascript;base64,${Buffer.from(`${stripTypeScriptTypes(core, { mode: 'strip' })}\nexport { ${CORE_NAMES} };`).toString('base64')}`);

/** A fake fetch that records every request and answers from `routes`. */
function fakeFetch(routes) {
  const calls = [];
  const f = async (url, init = {}) => {
    const call = { url, method: init.method ?? 'GET', body: init.body === undefined ? undefined : JSON.parse(init.body), headers: init.headers ?? {} };
    calls.push(call);
    const kind = /\/stock\?/.test(url) ? 'stock' : /\/checkout$/.test(url) ? 'checkout' : 'other';
    const r = routes[kind];
    if (!r) throw new Error(`no route for ${url}`);
    const answer = typeof r === 'function' ? r(call, calls) : r;
    if (answer instanceof Error) throw answer;
    return { ok: answer.status >= 200 && answer.status < 300, status: answer.status, json: async () => (answer.raw !== undefined ? JSON.parse(answer.raw) : answer.body) };
  };
  return { f, calls };
}
/** Any key anywhere in a request body that could be a price. */
const PRICEY = /price|cents|amount|total|cost|money/i;
const priceKeys = (v, path = '') => {
  if (!v || typeof v !== 'object') return [];
  return Object.entries(v).flatMap(([k, x]) => [...(PRICEY.test(k) ? [`${path}${k}`] : []), ...priceKeys(x, `${path}${k}.`)]);
};
const okStock = () => ({ status: 200, body: stock });
const oneSentence = (s) => typeof s === 'string' && /^[A-Z][^.!?]*[.!?]$/.test(s);

async function coreFailures(core) {
  const out = [];
  if (!core) return ['src/library/cart/Cart.astro has no `// <cart-core>` … `// </cart-core>` block.'];
  let c;
  try {
    c = await loadCore(core);
  } catch (e) {
    return [`the cart's <cart-core> block does not load: ${e.message}`];
  }
  const expect = (cond, msg) => cond || out.push(`cart: ${msg}`);
  const run = async (label, fn) => {
    try {
      await fn();
    } catch (e) {
      out.push(`cart: ${label}: threw ${e.message}`);
    }
  };
  const isKnown = (id) => known.has(id);
  const L = (...pairs) => pairs.map(([id, q]) => ({ id, q }));

  await run('caps', () => {
    expect(c.MAX_LINES === 20 && c.MAX_QTY === 20, `the caps are ${c.MAX_LINES} lines and ${c.MAX_QTY} of each; the Worker's are 20 and 20.`);
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `VAR${i}`, q: 1 }));
    const r = c.addLine(many, 'VARNEW', 1);
    expect(r.note === 'line_cap' && r.lines.length === 20, 'a 21st line is not refused with line_cap.');
    const r2 = c.addLine(L(['VARMUGCREAM', 19]), 'VARMUGCREAM', 5);
    expect(r2.note === 'qty_cap' && r2.lines[0].q === 20, '19 + 5 of one variation does not clamp to 20 with qty_cap.');
    const r3 = c.addLine(L(['VARMUGCREAM', 20]), 'VARMUGCREAM', 1);
    expect(r3.note === 'qty_cap' && r3.lines[0].q === 20, 'an add at 20 is not refused with qty_cap.');
    const r4 = c.addLine([], 'VARMUGCREAM', 25);
    expect(r4.lines[0]?.q === 20 && r4.note === 'qty_cap', 'a first add of 25 is not clamped to 20 with qty_cap.');
    const r5 = c.addLine(L(['VARMUGCREAM', 2]), 'VARMUGSLATE', 3);
    expect(eq(r5.lines, L(['VARMUGCREAM', 2], ['VARMUGSLATE', 3])) && r5.note === null, 'a plain add does not append the line.');
    expect(eq(c.setQty(L(['A', 3]), 'A', '0'), L(['A', 1])), 'setQty 0 does not clamp to 1.');
    expect(eq(c.setQty(L(['A', 3]), 'A', '25'), L(['A', 20])), 'setQty 25 does not clamp to 20.');
    expect(eq(c.setQty(L(['A', 3]), 'A', 'abc'), L(['A', 3])) && eq(c.setQty(L(['A', 3]), 'A', ''), L(['A', 3])), 'setQty with something that is not a number changes the line.');
    expect(eq(c.setQty(L(['A', 3]), 'A', '4.7'), L(['A', 4])), 'setQty 4.7 is not 4.');
    expect(eq(c.removeLine(L(['A', 1], ['B', 2]), 'A'), L(['B', 2])), 'removeLine does not remove exactly the line.');
    expect(c.count(L(['A', 2], ['B', 3])) === 5, 'count is not the sum of quantities.');
  });
  await run('sanitize', () => {
    expect(eq(c.sanitize(null, isKnown).lines, []) && eq(c.sanitize('junk', isKnown).lines, []) && eq(c.sanitize({ lines: 'x' }, isKnown).lines, []), 'stored garbage does not give an empty cart.');
    const s = c.sanitize({ lines: [{ id: 'VARMUGCREAM', q: 12 }, { id: 'VARMUGCREAM', q: 12 }, { id: 'VARGONE', q: 1 }, { id: 'bad id!', q: 1 }, { id: 'VARNOTEBOOK', q: 0 }, { id: 'VARCANDLESM', q: 25 }, { id: 'VARTOTENAT', q: '2' }] }, isKnown);
    expect(eq(s.lines, L(['VARMUGCREAM', 20], ['VARCANDLESM', 20], ['VARTOTENAT', 2])), `cleaning gave ${JSON.stringify(s.lines)}; duplicates merge (capped at 20), 25 clamps, 0 and bad ids go.`);
    expect(eq(s.dropped, ['VARGONE']), 'an id the catalogue does not know is not reported as dropped.');
    const lots = { lines: Array.from({ length: 25 }, (_, i) => ({ id: `V${i}`, q: 1 })) };
    expect(c.sanitize(lots, () => true).lines.length === 20, 'a stored cart of 25 lines is not cut to 20.');
  });
  await run('money', () => {
    const sub = c.subtotal(L(['VARMUGSLATE', 3], ['VARNOTEBOOK', 2], ['VARGONE', 9]), (id) => priceOf[id]);
    expect(sub === 7800, `the subtotal of 3 × $20.00 and 2 × $9.00 is ${sub} cents, not 7800.`);
    expect(eq(c.shipping(4999, 'ship', 800, 5000), { cents: 800, free: false }), 'shipping under the threshold is not the flat rate.');
    expect(eq(c.shipping(5000, 'ship', 800, 5000), { cents: 0, free: true }), 'shipping at the threshold is not free (the Worker waives it at subtotal >= free_shipping_over_cents).');
    expect(c.shipping(9000, 'pickup', 800, 5000).cents === null && c.shipping(10, 'ship', null, null).cents === null, 'pickup, or a shop that does not ship, shows a shipping amount.');
    expect(c.shipping(10, 'ship', 0, null).free === true, 'a flat rate of 0 is not shown as free.');
    expect(c.money(1800, 'USD') === '$18.00' && c.money(1800, 'JPY') === '¥1,800', `money is not in the currency's minor unit: ${c.money(1800, 'USD')}, ${c.money(1800, 'JPY')}.`);
  });
  await run('keys and body', () => {
    const k1 = c.newKey(globalThis.crypto);
    const k2 = c.newKey(globalThis.crypto);
    const k3 = c.newKey({ getRandomValues: (a) => globalThis.crypto.getRandomValues(a) });
    expect(k1 !== k2 && c.KEY_RE.test(k1) && c.KEY_RE.test(k3), 'newKey does not give a fresh key the Worker accepts (8 to 128 of A-Z a-z 0-9 - _).');
    const ship = c.checkoutBody(L(['VARMUGCREAM', 2]), 'ship', 'market', 'k-12345678');
    expect(eq(Object.keys(ship).sort(), ['fulfillment', 'idempotencyKey', 'items']), `a ship body has keys ${Object.keys(ship)}; exactly items, fulfillment, idempotencyKey.`);
    expect(eq(ship.items, [{ variationId: 'VARMUGCREAM', quantity: 2 }]), 'an item is not exactly { variationId, quantity }.');
    const pick = c.checkoutBody(L(['VARMUGCREAM', 2]), 'pickup', 'market', 'k-12345678');
    expect(pick.pickupPoint === 'market' && eq(Object.keys(pick).sort(), ['fulfillment', 'idempotencyKey', 'items', 'pickupPoint']), 'a pickup body does not carry exactly the four fields.');
  });
  await run('stock', () => {
    const r = c.applyStock(L(['VARMUGSLATE', 5], ['VARTOTENAT', 1], ['VARNOTEBOOK', 20], ['VARMUGCREAM', 2], ['VARGONE', 1]), { ...stock });
    expect(eq(r.lines, L(['VARMUGSLATE', 2], ['VARNOTEBOOK', 20], ['VARMUGCREAM', 2])), `stock gave ${JSON.stringify(r.lines)}; short clamps, 0 goes, untracked (null) stays.`);
    expect(eq(r.changes.map((x) => [x.id, x.kind, x.available]), [['VARMUGSLATE', 'short', 2], ['VARTOTENAT', 'sold_out', 0], ['VARGONE', 'gone', 0]]), 'the stock changes are not short, sold_out and gone, with the counts.');
  });

  // ---- the checkout, against the fake Worker
  const base = { api: 'https://shop.example.test', shop: 'demo-shop', fulfillment: 'ship', point: null };
  const keys = () => c.newKey(globalThis.crypto);
  const allBodies = [];
  const go = async (lines, routes, extra = {}) => {
    const { f, calls } = fakeFetch(routes);
    const res = await c.checkout({ ...base, lines, fetch: f, key: keys, ...extra });
    for (const call of calls) allBodies.push(call);
    return { res, calls };
  };
  await run('checkout ok', async () => {
    const { res, calls } = await go(L(['VARMUGCREAM', 2], ['VARNOTEBOOK', 1]), { stock: okStock, checkout: { status: 200, body: { url: 'https://square.link/u/abc' } } });
    expect(res.kind === 'redirect' && res.url === 'https://square.link/u/abc', 'a 200 { url } is not a redirect to that url.');
    expect(eq(calls.map((x) => x.method), ['GET', 'POST']), `the calls were ${calls.map((x) => x.method)}; the stock re-check (GET) comes before the POST.`);
    expect(calls[0].url === 'https://shop.example.test/v1/shops/demo-shop/stock?ids=VARMUGCREAM,VARNOTEBOOK' && calls[0].body === undefined, `the stock call is ${calls[0].url}.`);
    expect(calls[1].url === 'https://shop.example.test/v1/shops/demo-shop/checkout' && calls[1].headers['Content-Type'] === 'application/json', 'the POST is not JSON to /v1/shops/<shop>/checkout.');
    const b = calls[1].body;
    expect(eq(Object.keys(b).sort(), ['fulfillment', 'idempotencyKey', 'items']) && b.fulfillment === 'ship' && c.KEY_RE.test(b.idempotencyKey), `the POST body is ${JSON.stringify(b)}.`);
    expect(eq(b.items, [{ variationId: 'VARMUGCREAM', quantity: 2 }, { variationId: 'VARNOTEBOOK', quantity: 1 }]), 'the POST items are not the lines.');
  });
  await run('fresh key per attempt', async () => {
    const a = await go(L(['VARMUGCREAM', 1]), { stock: okStock, checkout: { status: 503, body: { error: 'shop_closed' } } });
    const b = await go(L(['VARMUGCREAM', 1]), { stock: okStock, checkout: { status: 503, body: { error: 'shop_closed' } } });
    expect(a.calls[1]?.body.idempotencyKey !== b.calls[1]?.body.idempotencyKey, 'two checkout attempts sent the same idempotencyKey; the README requires a new one each time.');
  });
  await run('pickup', async () => {
    const { calls } = await go(L(['VARMUGCREAM', 1]), { stock: okStock, checkout: { status: 200, body: { url: 'https://square.link/u/p' } } }, { fulfillment: 'pickup', point: 'market' });
    expect(calls[1]?.body.pickupPoint === 'market' && calls[1]?.body.fulfillment === 'pickup', 'a pickup checkout does not send the point.');
  });
  await run('short before the POST', async () => {
    const { res, calls } = await go(L(['VARMUGSLATE', 5]), { stock: okStock, checkout: { status: 200, body: { url: 'https://square.link/u/x' } } });
    expect(res.kind === 'changed' && eq(res.lines, L(['VARMUGSLATE', 2])) && calls.length === 1, 'a line short on the re-check still reached the POST, or was not clamped.');
  });
  await run('stock unreachable', async () => {
    const { res, calls } = await go(L(['VARMUGSLATE', 1]), { stock: () => new TypeError('Failed to fetch'), checkout: { status: 200, body: { url: 'https://square.link/u/y' } } });
    expect(res.kind === 'redirect' && calls.length === 2, 'an unreachable /stock stops the checkout; the Worker re-checks, so it must go on.');
  });
  await run('409 short', async () => {
    const { res } = await go(L(['VARMUGCREAM', 5], ['VARCANDLELG', 3], ['VARNOTEBOOK', 2]), {
      stock: () => ({ status: 503, body: {} }),
      checkout: { status: 409, body: { ok: false, error: 'short', short: [{ variationId: 'VARMUGCREAM', available: 2 }, { variationId: 'VARCANDLELG', available: 0 }] } },
    });
    expect(res.kind === 'changed', '409 short is not a change to the cart.');
    expect(eq(res.lines, L(['VARMUGCREAM', 2], ['VARNOTEBOOK', 2])), `409 short gave ${JSON.stringify(res.lines)}; clamp to available, take out 0, leave the rest.`);
    expect(eq(res.changes.map((x) => [x.id, x.kind, x.available]), [['VARMUGCREAM', 'short', 2], ['VARCANDLELG', 'sold_out', 0]]), 'the 409 changes are not named per line with the available count.');
  });
  await run('503', async () => {
    const { res } = await go(L(['VARMUGCREAM', 1]), { stock: okStock, checkout: { status: 503, body: { ok: false, error: 'shop_closed' } } });
    expect(res.kind === 'error' && res.message === 'This shop is closed for the moment.', `a 503 reads "${res.message}".`);
  });
  await run('network', async () => {
    const { res } = await go(L(['VARMUGCREAM', 1]), { stock: okStock, checkout: () => new TypeError('Failed to fetch') });
    expect(res.kind === 'error' && res.code === 'network' && oneSentence(res.message), `a network failure reads "${res.message}"; it is one sentence.`);
  });
  await run('redirect only to https', async () => {
    for (const url of ['javascript:alert(1)', 'http://square.link/u/a', '', 'not a url']) {
      const { res } = await go(L(['VARMUGCREAM', 1]), { stock: okStock, checkout: { status: 200, body: { url } } });
      expect(res.kind === 'error', `a 200 with url "${url}" is redirected to.`);
    }
  });
  await run('other refusals', async () => {
    const unk = await go(L(['VARMUGCREAM', 1], ['VARNOTEBOOK', 1]), { stock: okStock, checkout: { status: 400, body: { error: 'unknown_variation', ids: ['VARNOTEBOOK'] } } });
    expect(unk.res.kind === 'changed' && eq(unk.res.lines, L(['VARMUGCREAM', 1])) && unk.res.changes[0]?.kind === 'gone', '400 unknown_variation does not take out exactly the named lines.');
    const said = {};
    for (const [status, error] of [[429, 'rate_limited'], [403, 'origin_not_allowed'], [400, 'bad_pickup_point'], [400, 'shipping_unavailable'], [502, 'checkout_failed'], [409, 'checkout_used']]) {
      const { res } = await go(L(['VARMUGCREAM', 1]), { stock: okStock, checkout: { status, body: { error } } });
      said[error] = res.code;
      expect(res.kind === 'error' && oneSentence(res.message), `${status} ${error} is not one sentence for the buyer.`);
    }
    expect(eq(said, { rate_limited: 'rate', origin_not_allowed: 'origin', bad_pickup_point: 'pickup', shipping_unavailable: 'noship', checkout_failed: 'failed', checkout_used: 'failed' }), `the refusals map to ${JSON.stringify(said)}.`);
    const bad = await go(L(['VARMUGCREAM', 1]), { stock: okStock, checkout: { status: 502, raw: '<html>' } });
    expect(bad.res.kind === 'error', 'a body that is not JSON is not a failure.');
    const empty = await go([], { stock: okStock, checkout: { status: 200, body: { url: 'https://square.link/u/e' } } });
    expect(empty.res.kind === 'error' && empty.calls.length === 0, 'an empty cart reaches the Worker.');
  });
  // No price, anywhere, in any request the cart made above.
  for (const call of allBodies) {
    const p = priceKeys(call.body);
    if (p.length) out.push(`cart: a request to ${call.url} carried ${p.join(', ')}; the cart never sends a price.`);
    if (call.method === 'GET' && /price|cents/i.test(call.url)) out.push(`cart: ${call.url} carries a price.`);
  }
  if (!allBodies.some((x) => x.method === 'POST')) out.push('cart: no POST was made in the checkout cases.');
  return out;
}

// =================================================================== cart: the built page
function cartPageFailures(html, where, { demoAdds = 0 } = {}) {
  const out = [];
  const found = roots(html, 'div', 'data-crt');
  if (!found.length) return [`${where}: no cart rendered.`];
  const shops = new Set();
  for (const r of found) {
    const id = attr(r.open, 'id');
    let cfg = {};
    try {
      cfg = JSON.parse(decode(attr(r.open, 'data-crt') ?? ''));
    } catch {
      out.push(`${where} #${id}: data-crt is not JSON.`);
    }
    shops.add(cfg.shop);
    if (priceKeys({ ...cfg, v: undefined }).length) out.push(`${where} #${id}: the config carries a price field outside the display map.`);
    const trig = tags(r.html, /<button\b[^>]*\sdata-crt-trigger[^>]*>/g)[0]?.open;
    const dlg = tags(r.html, /<dialog\b[^>]*>/g)[0];
    if (!trig) out.push(`${where} #${id}: no cart button.`);
    if (!dlg) {
      out.push(`${where} #${id}: the drawer is not a <dialog>.`);
      continue;
    }
    const dlgId = attr(dlg.open, 'id');
    const dlgHtml = block(r.html, dlg.index, 'dialog');
    if (trig) {
      if (attr(trig, 'hidden') === undefined) out.push(`${where} #${id}: the cart button is not hidden before the script (it cannot work without it).`);
      if (attr(trig, 'aria-haspopup') !== 'dialog') out.push(`${where} #${id}: the cart button has no aria-haspopup="dialog".`);
      if (attr(trig, 'aria-controls') !== dlgId) out.push(`${where} #${id}: the cart button's aria-controls is not the drawer.`);
      if (attr(trig, 'aria-expanded') !== 'false') out.push(`${where} #${id}: the cart button is not aria-expanded="false".`);
      if (attr(trig, 'type') !== 'button') out.push(`${where} #${id}: the cart button is not type="button".`);
      if (!/^\S.*, 0 items$/.test(attr(trig, 'aria-label') ?? '')) out.push(`${where} #${id}: the cart button is not named with its count ("Cart, 0 items").`);
    }
    if (attr(dlg.open, 'open') !== undefined) out.push(`${where} #${id}: the drawer is rendered open.`);
    const lab = attr(dlg.open, 'aria-labelledby');
    if (!lab || !textOfId(dlgHtml, lab)) out.push(`${where} #${id}: the drawer is not named by a heading with text (aria-labelledby).`);
    const close = tags(dlgHtml, /<button\b[^>]*\sdata-crt-close[^>]*>/g)[0]?.open;
    if (!close || !attr(close, 'aria-label') || attr(close, 'hidden') === undefined || attr(close, 'type') !== 'button') out.push(`${where} #${id}: the drawer's close button is missing, unnamed, or shown before the script.`);
    const lives = tags(r.html, /<[a-z]+\b[^>]*\saria-live=[^>]*>/g);
    if (lives.length !== 1 || attr(lives[0].open, 'data-crt-live') === undefined) out.push(`${where} #${id}: ${lives.length} aria-live regions; exactly one, the count.`);
    if (/\saria-live=|\srole="(status|alert|log)"/.test(dlgHtml)) out.push(`${where} #${id}: a live region inside the drawer; only the count is live.`);
    if (!/<noscript>/.test(r.html)) out.push(`${where} #${id}: no <noscript> line saying the cart needs JavaScript.`);
    const after = html.slice(r.index + r.html.length, r.index + r.html.length + 120000);
    if (!/^\s*<script>(?:window\.__superheroCart=window\.__superheroCart\|\|[\s\S]*?)?window\.__superheroCart\.mount\(document\.currentScript\.previousElementSibling\);<\/script>/.test(after)) out.push(`${where} #${id}: the mount script is not straight after the cart.`);
    const radios = tags(dlgHtml, /<input\b[^>]*type="radio"[^>]*>/g);
    if (!radios.length || !/<fieldset\b[^>]*>\s*<legend\b[^>]*>/.test(dlgHtml)) out.push(`${where} #${id}: ship-or-pickup is not radios in a fieldset with a legend.`);
  }
  const defs = (html.match(/window\.__superheroCart=window\.__superheroCart\|\|/g) || []).length;
  if (defs !== 1) out.push(`${where}: the cart runtime is defined ${defs} times; once per page.`);
  const runtime = html.match(/window\.__superheroCart=window\.__superheroCart\|\|([\s\S]*?)window\.__superheroCart\.mount/)?.[1] ?? '';
  for (const [re, what] of [
    [/\.showModal\(\)/, 'opens the drawer with showModal() (focus kept in, the page inert)'],
    [/MAX_LINES\s*=\s*20\b/, 'caps lines at 20'],
    [/MAX_QTY\s*=\s*20\b/, 'caps a line at 20'],
    [/trigger\.focus\(\)/, 'returns focus to the cart button on close'],
    [/"cart-checkout",\s*\{\s*bubbles:\s*true,\s*cancelable:\s*true/, 'dispatches a cancelable cart-checkout before the redirect'],
    [/location\.assign\(/, 'redirects to the checkout link'],
    [/localStorage\.setItem\(/, 'keeps the cart in localStorage'],
    [/replaceChildren\(/, 'gives an add button its own markup back after "Added"'],
  ]) {
    if (!re.test(runtime)) out.push(`${where}: the built cart runtime no longer ${what}.`);
  }
  if (/\.show\(\)/.test(runtime)) out.push(`${where}: the built cart runtime opens a dialog with show(); the drawer is modal.`);
  const adds = tags(html, /<button\b[^>]*\sdata-cart-add=[^>]*>/g);
  if (adds.length < demoAdds) out.push(`${where}: ${adds.length} add buttons; the demo has ${demoAdds}.`);
  for (const a of adds) {
    if (attr(a.open, 'hidden') === undefined) out.push(`${where}: an add button is shown before a cart's script has run.`);
    if (!shops.has(attr(a.open, 'data-cart-shop'))) out.push(`${where}: an add button names shop "${attr(a.open, 'data-cart-shop')}", which no cart on the page serves.`);
  }
  return out;
}

// =================================================================== product-list
const money = (c) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c / 100);
function listFailures(html, where) {
  const out = [];
  const lists = roots(html, 'ul', 'aria-label').filter((l) => /class="pl\b/.test(l.open));
  if (!lists.length) return [`${where}: no product list.`];
  for (const l of lists) {
    if (attr(l.open, 'role') !== 'list') out.push(`${where}: the product list has no role="list".`);
    const cards = roots(l.html, 'li', 'data-pl-product');
    if (cards.length !== fixture.products.length) out.push(`${where}: ${cards.length} cards for ${fixture.products.length} products.`);
    for (const card of cards) {
      const p = fixture.products.find((x) => x.id === attr(card.open, 'data-pl-product'));
      if (!p) continue;
      const links = tags(card.html, /<a\b[^>]*>/g);
      if (links.length !== 1) out.push(`${where} ${p.slug}: ${links.length} links; a card is one link.`);
      const img = tags(card.html, /<img\b[^>]*>/g)[0]?.open;
      if (!img || attr(img, 'loading') !== 'lazy' || attr(img, 'decoding') !== 'async' || !attr(img, 'width') || !attr(img, 'height') || attr(img, 'alt') !== '') out.push(`${where} ${p.slug}: the image is not lazy, async, sized and alt="".`);
      const prices = p.variations.map((v) => v.price_cents);
      const want = prices.every((x) => x === prices[0]) ? money(prices[0]) : `From ${money(Math.min(...prices))}`;
      const got = text(card.html.match(/<p class="pl__price"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '');
      if (got !== want) out.push(`${where} ${p.slug}: the price reads "${got}", not "${want}".`);
      const out0 = p.variations.every((v) => v.tracked && stock[v.id] === 0);
      const badge = tags(card.html, /<p\b[^>]*\sdata-pl-sold[\s>][^>]*>|<p\b[^>]*\sdata-pl-sold\b[^>]*>/g)[0]?.open;
      const sr = tags(card.html, /<span\b[^>]*\sdata-pl-sold-sr\b[^>]*>/g)[0]?.open;
      const shown = (t) => t && attr(t, 'hidden') === undefined;
      if (!!shown(badge) !== out0 || !!shown(sr) !== out0) out.push(`${where} ${p.slug}: Sold out is ${shown(badge) ? 'shown' : 'hidden'}, but the product is ${out0 ? '' : 'not '}sold out.`);
      if (out0 && !/, sold out/.test(text(block(card.html, links[0].index, 'a')))) out.push(`${where} ${p.slug}: the link's name does not say it is sold out.`);
    }
  }
  return out;
}

// =================================================================== product-page
function pageFailures(html, where, { visible }) {
  const out = [];
  const arts = roots(html, 'article', 'data-pp');
  if (!arts.length) return [`${where}: no product page.`];
  if (visible && /application\/ld\+json/.test(html.replace(/<details\b[\s\S]*?<\/details>/g, '').match(/<article\b[^>]*data-pp[\s\S]*$/)?.[0] ?? '')) out.push(`${where}: the demo emits Product JSON-LD; superherotech.ai must only show it.`);
  for (const a of arts) {
    const name = text(a.html.match(/<h[1-3] class="pp__name"[^>]*>([\s\S]*?)<\/h[1-3]>/)?.[1] ?? '');
    const p = fixture.products.find((x) => x.name === name);
    if (!p) {
      out.push(`${where}: a product page for "${name}", which the fixture does not have.`);
      continue;
    }
    const at = `${where} ${p.slug}`;
    const radios = tags(a.html, /<input\b[^>]*type="radio"[^>]*name="variation"[^>]*>/g);
    const hidden = tags(a.html, /<input\b[^>]*type="hidden"[^>]*name="variation"[^>]*>/g);
    if (p.variations.length > 1) {
      if (radios.length !== p.variations.length || !/<fieldset\b[^>]*>\s*<legend\b[^>]*>[^<]+<\/legend>/.test(a.html)) out.push(`${at}: ${p.variations.length} variations but not a radio per variation in a fieldset with a legend.`);
      if (radios.filter((r) => attr(r.open, 'checked') !== undefined).length !== 1) out.push(`${at}: the picker does not start with exactly one variation chosen.`);
    } else if (radios.length || hidden.length !== 1 || /<fieldset/.test(a.html)) out.push(`${at}: one variation, so no picker and one hidden variation field.`);
    const qty = tags(a.html, /<input\b[^>]*name="quantity"[^>]*>/g)[0]?.open;
    if (!qty || attr(qty, 'min') !== '1' || attr(qty, 'max') !== '20' || attr(qty, 'type') !== 'number') out.push(`${at}: quantity is not a number input from 1 to 20.`);
    const form = tags(a.html, /<form\b[^>]*>/g)[0]?.open;
    if (!form || attr(form, 'data-cart-form') === undefined || attr(form, 'data-cart-shop') === undefined) out.push(`${at}: the form does not carry the cart's data-cart-form and data-cart-shop.`);
    const add = tags(a.html, /<button\b[^>]*type="submit"[^>]*>/g)[0]?.open;
    if (!add || attr(add, 'hidden') === undefined || attr(add, 'data-cart-needs-js') === undefined || attr(add, 'data-cart-shop') !== attr(form ?? '', 'data-cart-shop')) out.push(`${at}: Add to cart is not hidden until the cart runs, or not aimed at the form's shop.`);
    if (p.description.includes('<') && !/&lt;/.test(a.html.match(/<div class="pp__desc"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '')) out.push(`${at}: the description's "<" is not shown as text.`);
    if (/<script type="application\/ld\+json"/.test(a.html)) out.push(`${at}: JSON-LD inside the article.`);
    // The structured data: the <details> after this article (visible), or the emitted script.
    const tail = html.slice(a.index + a.html.length, a.index + a.html.length + 20000);
    const raw = visible ? decode(tail.match(/<details\b[^>]*data-pp-ld[^>]*>[\s\S]*?<code\b[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? '') : tail.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '';
    if (!raw) {
      out.push(`${at}: no Product JSON-LD after the article.`);
      continue;
    }
    if (/</.test(raw)) out.push(`${at}: the JSON-LD holds a raw "<"; escape it (\\u003c) so no description can close the script.`);
    let ld;
    try {
      ld = JSON.parse(raw);
    } catch {
      out.push(`${at}: the JSON-LD is not JSON.`);
      continue;
    }
    if (ld['@context'] !== 'https://schema.org' || ld['@type'] !== 'Product' || ld.name !== p.name || ld.productID !== p.id) out.push(`${at}: the JSON-LD is not a schema.org Product with the name and productID.`);
    if (p.description && ld.description !== p.description) out.push(`${at}: the JSON-LD description is not the catalogue's.`);
    if (!Array.isArray(ld.image) || ld.image.length !== p.images.length) out.push(`${at}: the JSON-LD images are not the product's.`);
    if (!Array.isArray(ld.offers) || ld.offers.length !== p.variations.length) {
      out.push(`${at}: offers is not an array of one Offer per variation.`);
      continue;
    }
    p.variations.forEach((v, i) => {
      const o = ld.offers[i];
      const want = !v.tracked ? 'https://schema.org/InStock' : stock[v.id] > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
      if (o['@type'] !== 'Offer' || o.sku !== v.id || o.price !== (v.price_cents / 100).toFixed(2) || o.priceCurrency !== 'USD' || o.availability !== want || !o.url)
        out.push(`${at}: offer ${i + 1} is ${JSON.stringify(o)}; want sku ${v.id}, price "${(v.price_cents / 100).toFixed(2)}" (a string), USD, ${want}, a url.`);
    });
  }
  return out;
}
const pageSource = read('src/library/product-page/ProductPage.astro');
function pageSourceFailures(src) {
  const out = [];
  if (!/\{ld && jsonLd !== 'visible' && <script type="application\/ld\+json" set:html=\{ld\} \/>\}/.test(src)) out.push('ProductPage.astro: a real page no longer emits the same `ld` string the demo shows.');
  if (!/\.replace\(\/<\/g, '\\\\u003c'\)/.test(src)) out.push('ProductPage.astro: the JSON-LD is not escaped with .replace(/</g, \'\\\\u003c\').');
  return out;
}

// =================================================================== fetchCatalog
async function fetchCatalogFailures(src) {
  const out = [];
  let mod;
  try {
    mod = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(src, { mode: 'strip' })).toString('base64')}`);
  } catch (e) {
    return [`fetchCatalog.ts does not load: ${e.message}`];
  }
  const good = { ...fixture, products: fixture.products.map((p) => ({ ...p, images: p.images.map((i) => `https://items-images-production.s3.us-west-2.amazonaws.com/files/${i}`) })) };
  const answer = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  const throws = async (label, fn, re) => {
    try {
      await fn();
      out.push(`fetchCatalog: ${label} did not throw.`);
    } catch (e) {
      if (!re.test(e.message)) out.push(`fetchCatalog: ${label} threw "${e.message}", which does not say ${re}.`);
      if (!/^fetchCatalog/.test(e.message) || !/[.)]$/.test(e.message)) out.push(`fetchCatalog: ${label} threw "${e.message}", not one sentence naming fetchCatalog.`);
    }
  };
  let seen = '';
  const c = await mod.fetchCatalog('demo-shop', { fetch: async (url, init) => ((seen = url), answer(200, good)(url, init)) });
  if (seen !== 'https://shop.superherotech.ai/v1/shops/demo-shop/catalog') out.push(`fetchCatalog fetched ${seen}.`);
  if (!eq(c.products, good.products) || c.currency !== 'USD' || c.open !== true) out.push('fetchCatalog does not return the catalogue as fetched.');
  const broken = (fn) => {
    const copy = structuredClone(good);
    fn(copy);
    return answer(200, copy);
  };
  await throws('a variation with no price', () => mod.fetchCatalog('demo-shop', { fetch: broken((x) => delete x.products[0].variations[0].price_cents) }), /price_cents/);
  await throws('a price that is not whole cents', () => mod.fetchCatalog('demo-shop', { fetch: broken((x) => (x.products[0].variations[0].price_cents = 18.5)) }), /price_cents/);
  await throws('a repeated slug', () => mod.fetchCatalog('demo-shop', { fetch: broken((x) => (x.products[1].slug = x.products[0].slug)) }), /appears twice/);
  await throws('no tracked flag', () => mod.fetchCatalog('demo-shop', { fetch: broken((x) => delete x.products[0].variations[0].tracked) }), /tracked/);
  await throws('products with no currency', () => mod.fetchCatalog('demo-shop', { fetch: broken((x) => (x.currency = null)) }), /currency/);
  await throws('a 503 not_connected', () => mod.fetchCatalog('demo-shop', { fetch: answer(503, { ok: false, error: 'not_connected' }) }), /503.*not connected Square/);
  await throws('a dead network', () => mod.fetchCatalog('demo-shop', { fetch: async () => { throw new TypeError('fetch failed'); } }), /could not reach/);
  await throws('a bad site key', () => mod.fetchCatalog('Demo Shop', { fetch: answer(200, good) }), /not a site key/);
  return out;
}

// =================================================================== the two demo stubs
const stubOf = (src) => src.match(/const stub = `([\s\S]*?)`;\n/)?.[1];
const cartDemo = read('src/components/demos/CartDemo.astro');
const pageDemo = read('src/components/demos/ProductPageDemo.astro');
function stubFailures(a, b) {
  const s = stubOf(a);
  if (!s) return ['CartDemo.astro has no `const stub` fetch stub.'];
  if (stubOf(b) !== s) return ['ProductPageDemo.astro\'s fetch stub is not CartDemo.astro\'s, byte for byte; on the hub whichever runs first serves both.'];
  if (!/if \(!url\.startsWith\(API \+ '\/'\)\) return real\(input, init\);/.test(s) || !/const API = 'https:\/\/shop\.demo\.invalid';/.test(s)) return ['the demo fetch stub must answer only https://shop.demo.invalid and pass every other request through.'];
  return [];
}

// =================================================================== run
const pages = {
  cart: read('dist/cart/index.html'),
  list: read('dist/product-list/index.html'),
  page: read('dist/product-page/index.html'),
  hub: read('dist/index.html'),
};
const fetchSrc = read('src/library/product-list/fetchCatalog.ts');
finish('inputs');

const DEMO_ADDS = fixture.products.reduce((n, p) => n + p.variations.length, 0);
const all = async (o = {}) => [
  ...(await coreFailures(o.core ?? coreOf(cartSource))),
  ...cartPageFailures(o.cart ?? pages.cart, 'dist/cart/', { demoAdds: DEMO_ADDS }),
  ...cartPageFailures(o.hub ?? pages.hub, 'dist/ (hub)', { demoAdds: DEMO_ADDS }),
  ...cartPageFailures(o.page ?? pages.page, 'dist/product-page/'),
  ...listFailures(o.list ?? pages.list, 'dist/product-list/'),
  ...pageFailures(o.page ?? pages.page, 'dist/product-page/', { visible: true }),
  ...pageSourceFailures(o.pageSource ?? pageSource),
  ...(await fetchCatalogFailures(o.fetchSrc ?? fetchSrc)),
  ...stubFailures(o.cartDemo ?? cartDemo, o.pageDemo ?? pageDemo),
  ...(/connect-src https:\/\/shop\.superherotech\.ai/.test(o.cartSource ?? cartSource) ? [] : ['Cart.astro no longer names the CSP line the site needs: connect-src https://shop.superherotech.ai.']),
];
failures.push(...(await all()));
finish('the shop elements');

// ------------------------------------------------------------------ mutants
const core = coreOf(cartSource);
const sub = (s, a, b) => {
  if (!s.includes(a)) throw new Error(`mutant anchor not found: ${a}`);
  return s.replace(a, b);
};
const MUTANTS = [
  ['a price in the POST body', { core: sub(core, '      idempotencyKey: key,\n    };', '      idempotencyKey: key,\n      price: 1,\n    };') }],
  ['a price on each item', { core: sub(core, "items: lines.map((l) => ({ variationId: l.id, quantity: l.q }))", "items: lines.map((l) => ({ variationId: l.id, quantity: l.q, price_cents: 1 }))") }],
  ['one key for every attempt', { core: sub(core, 'const key = o.key();', "const key = 'fixed-key-123';") }],
  ['the 409 clamp undone', { core: sub(core, 'out.push({ id: l.id, q: left });', 'out.push({ ...l });') }],
  ['sold out kept in the cart', { core: sub(core, "if (left === 0) changes.push({ id: l.id, kind: 'sold_out', available: 0 });", "if (left === 0) { changes.push({ id: l.id, kind: 'sold_out', available: 0 }); out.push({ ...l }); }") }],
  ['21 lines', { core: sub(core, 'const MAX_LINES = 20;', 'const MAX_LINES = 21;') }],
  ['21 of each', { core: sub(core, 'const MAX_QTY = 20;', 'const MAX_QTY = 21;') }],
  ['no stock re-check before the POST', { core: sub(core, 'if (st.ok) {', 'if (false) {') }],
  ['free shipping only above the threshold', { core: sub(core, 'sub >= freeOver', 'sub > freeOver') }],
  ['the closed sentence reworded', { core: sub(core, "closed: 'This shop is closed for the moment.'", "closed: 'Closed.'") }],
  ['a network failure in two sentences', { core: sub(core, "network: 'We could not reach the shop, so check your connection and try again.'", "network: 'We could not reach the shop. Try again.'") }],
  ['any URL redirected to', { core: sub(core, "if (new URL(url).protocol === 'https:')", 'if (url)') }],
  ['an unreachable stock check stops the sale', { core: sub(core, '    if (st.ok) {\n', "    if (!st.ok) return fault('failed');\n    if (st.ok) {\n") }],
  ['the trigger shown before the script', { cart: pages.cart.replace(/(<button[^>]*data-crt-trigger[^>]*?) hidden(?=[\s>])/, '$1') }],
  ['no aria-haspopup', { cart: pages.cart.replace(/(data-crt-trigger[^>]*?) aria-haspopup="dialog"/, '$1') }],
  ['an unnamed drawer', { cart: pages.cart.replace(/(<dialog\b[^>]*?) aria-labelledby="[^"]*"/, '$1') }],
  ['a live region in the drawer', { cart: pages.cart.replace('data-crt-msg tabindex="-1"', 'data-crt-msg aria-live="polite" tabindex="-1"') }],
  ['a second live region', { cart: pages.cart.replace('<noscript>', '<span aria-live="polite"></span><noscript>') }],
  ['the drawer opened with show()', { cart: pages.cart.replace('.showModal()', '.show()') }],
  ['no focus back to the cart button', { cart: pages.cart.replace('trigger.focus()', 'void 0') }],
  ['an add button shown without JavaScript', { cart: pages.cart.replace(/(<button[^>]*data-cart-add="VARMUGCREAM"[^>]*?) hidden/, '$1') }],
  ['the runtime twice', { hub: pages.hub.replace('window.__superheroCart.mount(', 'window.__superheroCart=window.__superheroCart||(()=>{})();window.__superheroCart.mount(') }],
  ['an eager card image', { list: pages.list.replace('loading="lazy"', 'loading="eager"') }],
  ['a card image with alt text', { list: pages.list.replace(/(class="pl__img"[^>]*?) alt=""/, '$1 alt="Enamel mug"') }],
  ['Sold out on a product in stock', { list: pages.list.replace(/(data-pl-product="ITEMMUG"[\s\S]*?data-pl-sold aria-hidden="true") hidden/, '$1') }],
  ['the from-price lost', { list: pages.list.replace(/(<p class="pl__price"[^>]*>)From \$18\.00/, '$1$$18.00') }],
  ['an Offer price as a number', { page: pages.page.replace('&quot;price&quot;:&quot;18.00&quot;', '&quot;price&quot;:18') }],
  ['one Offer for all variations', { page: pages.page.replace(/(&quot;offers&quot;:\[)(\{[^\]]*?\}),\{[^\]]*?\}\]/, '$1$2]') }],
  ['an unescaped "<" in the JSON-LD', { page: pages.page.replace('\\u003c 350', '&lt; 350') }],
  ['a sku dropped', { page: pages.page.replace('&quot;sku&quot;:&quot;VARMUGSLATE&quot;,', '') }],
  ['a picker for one variation', { page: pages.page.replace(/<input type="hidden" name="variation" value="VARNOTEBOOK"[^>]*>/, '<fieldset><legend>Choose</legend><input type="radio" name="variation" value="VARNOTEBOOK" checked></fieldset>') }],
  ['quantity up to 99', { page: pages.page.replace('max="20"', 'max="99"') }],
  ['JSON-LD emitted on the demo', { page: pages.page.replace('<details class="pp__ld"', '<script type="application/ld+json">{}</script><details class="pp__ld"') }],
  ['the JSON-LD unescaped in the source', { pageSource: pageSource.replace(".replace(/</g, '\\\\u003c')", '') }],
  ['fetchCatalog accepts any price', { fetchSrc: fetchSrc.replace('|| !Number.isInteger(w.price_cents) || w.price_cents < 0', '') }],
  ['fetchCatalog lets a 503 through', { fetchSrc: fetchSrc.replace('if (!res.ok) {', 'if (false) {') }],
  ['the demo stubs drifted', { pageDemo: pageDemo.replace("const API = 'https://shop.demo.invalid';", "const API = 'https://shop.demo.invalid'; ") }],
  ['the CSP line gone', { cartSource: cartSource.replace(/connect-src https:\/\/shop\.superherotech\.ai/g, 'connect-src (the Worker)') }],
];
let caught = 0;
for (const [name, o] of MUTANTS) {
  for (const [k, v] of Object.entries(o)) {
    const baseline = { core, cart: pages.cart, hub: pages.hub, list: pages.list, page: pages.page, pageSource, fetchSrc, pageDemo, cartSource }[k];
    if (v === baseline) failures.push(`mutant "${name}" changed nothing; its anchor no longer matches the page or source.`);
  }
  const got = await all(o);
  if (got.length) caught++;
  else failures.push(`mutant "${name}" was not caught; the check no longer pins that rule.`);
}
finish('mutation test');

console.log(`check-shop ok: cart rules (caps, cleaning, money, the checkout against a fake Worker, no price in any request, a fresh key per attempt, the 409 clamp, 503 and network sentences); cart markup on 3 pages; product-list ${fixture.products.length} cards; product-page JSON-LD for 2 products; fetchCatalog; ${caught}/${MUTANTS.length} mutants caught.`);
