# Superhero UI library

The reusable UI elements Superhero Technologies builds client sites from, with a gallery
so a client, a designer or an agent can point at one and name it. This is the "standard
component library" from Phase 2 of the Website roadmap, started 2026-09-22 with the two
elements rebuilt for contexture.ai.

- **Public pages**: <https://superherotech.ai/elements/>, one page per element, built by the
  website from this repo (see "Consumed by superherotech.ai").
- **Gallery**: `npm run dev`. It is a development preview with the builder detail (props,
  theming) the public pages leave out. It has no hostname and never will; it is noindexed
  permanently so it cannot compete with the public pages.
- **Elements**: `src/library/<id>/<Name>.astro` — one self-contained file each.
- **Catalogue**: `src/data/catalog.ts` — the names, the search each public page targets, props,
  theming, accessibility notes and where each element is in use. The gallery and the public
  pages are both generated from it.
- **Skill**: `superhero-ui-library` in `ecropolis/agent-skills` (house-stack plugin). Every
  element here has a section there; an element without one is not finished.
- **Check**: `npm run check` holds the rules below and the layout the website depends on.

## Rules for an element

1. **One file, no dependencies.** Script and style inline, so the element copies into a client
   site as a single `.astro` file. Copying is the distribution, and the catalogue's `usedOn` is
   how we know where copies live.
2. **Themed from the host's tokens through `--<prefix>-*` custom properties, each with a
   fallback.** Client sites forbid literal colours in components; the fallbacks live here so the
   element works before it is themed, and the host maps the variables in its `global.css`.
3. **Keyboard operable, screen-reader sensible, reduced-motion aware.** Say how in the catalogue.
4. **Named for what it does, not what WordPress called it.** The `id` is the name people use;
   `aka` carries the WordPress, page-builder and plugin names so the old vocabulary still finds it.
5. **Recorded where it is used.** An element nobody uses is not finished: `usedOn` must name at
   least one site, and when the element goes into another client site, add that site too.
   An element built ahead of client work counts its own public page until a client site uses
   it: `usedOn: [{ site: 'superherotech.ai', where: '/elements/<id>/ (demo)' }]`. When the
   first client site takes it, add that site; the demo line can then go.
6. **One search per page.** `search.query` is the one query the element's public page targets.
   No two elements may claim the same query, as their query or in `alsoRanks`: two of our
   pages in one auction is how both lose.

## Adding an element

An element is finished when it has all of these, in one PR:

1. **The component** in `src/library/<id>/<PascalName>.astro`.
2. **A demo** in `src/components/demos/`, registered in `src/components/demos/index.ts` under the
   element's `id`. Both gallery pages and the website render demos from that index; nothing
   else keeps a list. A demo imports only from `src/library/`. Its assets are neutral files in
   `public/demo/` — never a client's images — referenced through `asset('<file>')` so the
   `assetBase` prop can move them. Give every host token a fallback (`var(--purple, #5933d8)`);
   the website defines `--purple`, `--purple-dark`, `--navy`, `--white`, `--radius`, `--tint`,
   `--line` and `--ink`, so tell the website session before using any other.
   Demos also take `quiet?: boolean` (default false). `quiet` — the demo is one of many on a
   page: nothing may open, move, play sound or steal focus by itself. A demo without automatic
   behaviour ignores it. The gallery index and the website's hub pass it; an element's own page
   does not. A demo that opens something by delay, scroll or exit intent (as `modal`'s does) must
   offer it on a press instead when `quiet`.
3. **The catalogue entry** in `src/data/catalog.ts`, including:
   - `search: { query, alsoRanks? }` — the query from SE Ranking (US) the public page is
     written for, lowercase as people type it, and close variants it should also rank for.
     Record the volume and difficulty in a comment beside it.
   - `pitch` — one sentence in the client's words, the lead of the public page. `summary` stays
     the gallery's technical line.
   - `usedOn` with at least one site, and `added` as `YYYY-MM-DD`.
   - `asks` — what the client has to give us before it can be built on their site (the hours,
     the date, the photos), as `{ key, label, hint?, required? }`, at most six, labels written
     for the client in sentence case. Leave it out when the element needs nothing beyond what
     the brief covers. The portal makes each ask a field on the request form and the request
     engine names a missing required one, so treat a `key` as a field name: never reuse one
     for a different question. The element's gallery page lists the asks under the demo as
     "What the client needs to give you". If the element cannot be built without one of them,
     mark it `required` and add the element to `NEEDS_INPUT` in `scripts/check-catalog.mjs`.
   - `category` — one of `CATEGORIES`. It decides the element's section on the
     superherotech.ai hub and its mega-menu column, and the skill mirrors it. Add the element to
     `GOLDEN` in `scripts/check-categories.mjs` in the same category; the check fails until you do.
4. **`npm run check` green.** It verifies every entry's file exists, every entry has a demo in
   the index, every demo asset exists, ids are kebab-case and unique, each `search.query` is
   unique and not another entry's `alsoRanks`, `added` is a date, `usedOn` is non-empty, `asks`
   has the shape above and every `NEEDS_INPUT` element has a required ask, and that `astro build`
   produces one page per entry whose client-needs list is exactly its asks. It exits 1 with a
   sentence naming the entry and the rule. `scripts/check-categories.mjs` runs first: every
   element has a known category, every category has at least three elements, the assignment
   matches `GOLDEN`, and the categories' order and labels are unchanged.
5. **Its section in the `superhero-ui-library` skill**, with the plugin version bumped. The
   check cannot see agent-skills, so this one is on you; it is still part of "finished".

Merging to `main` rebuilds superherotech.ai, so the new element's public page goes live with it.

## Consumed by superherotech.ai

The website (the L2 chip) builds `/elements/` and `/elements/<id>/`
from this repo. At build time it downloads the public tarball of `main`:

```
https://codeload.github.com/ecropolis/SuperheroLibrary/tar.gz/main
```

and imports exactly these paths:

| Path | What the website takes from it |
| --- | --- |
| `src/data/catalog.ts` | `catalog` (and `byId`): names, `search`, `pitch`, `aka`, `replaces`, good for / not for, `usedOn`, `category`, `asks` (once the site's pass lands: each page's "You'll need to give us" list, and `/elements/index.json`); `CATEGORIES` for the hub sections and mega-menu columns |
| `src/components/demos/index.ts` | `demos`, keyed by element `id` |
| `src/library/<id>/<File>.astro` | each entry's `file`, imported by its demo |
| `public/demo/*` | demo assets, copied to the site's `public/elements-demo/`; the site passes `assetBase="/elements-demo/"` to each demo, and `quiet` on the `/elements/` hub, where every demo shares one page |

The public pages show no builder tables; props and theming stay on this gallery.

**Renaming or moving any of those paths breaks the website build.** That is the intended
failure mode: a loud build failure on the website is better than a page that silently loses
its demo. Change the layout only together with the website, in paired PRs.

Demo assets are published on superherotech.ai, so they must be neutral — never a client's
images. That was already the rule; now the whole internet sees them.

`npm run build` does not run the check, and the website's fetch does not either. The
`Rebuild website` workflow runs `npm ci && npm run check` on every push and pull request, and on
a push to `main` that passes it calls the `superherotech` Pages deploy hook (repo secret
`PAGES_DEPLOY_HOOK`), so a broken catalogue never triggers a site build.

## Using one in a client build

Copy the file into `src/components/`, set its theming variables from the site's tokens, and
follow the element's page for any stacking or sizing rule. The skill says the same, for agents.

## Synced, not copied: cookie-consent

One element is not owned here. `src/library/cookie-consent/CookieConsent.astro` is a synced copy
of `src/CookieConsent.astro` in [ecropolis/ecropolis-consent](https://github.com/ecropolis/ecropolis-consent),
which runs on seven sites and keeps one version number for all of them. This repo is one more
sync target in that repo's `sites.json`, exactly like a site:

```bash
# in ecropolis-consent
node bin/consent-sync.mjs check                     # reports SuperheroLibrary with the sites
node bin/consent-sync.mjs update SuperheroLibrary   # refreshes this copy
```

**Never edit the file here.** Fix it upstream, bump its version, sync, and commit the refreshed
copy in a PR of its own. `scripts/check-cookie-consent.mjs` fails `npm run check` if the header
naming the canonical source is gone, and, when ecropolis-consent is checked out beside this repo,
if the copy is behind its version or differs from it byte for byte. CI has no checkout of that
repo, so there it holds the header only.

Its catalogue entry carries `source`, which makes the gallery say "sync", not "copy". Its demo
runs the real widget inside sandboxed frames rather than on the page, because the widget is live
code: on superherotech.ai, which runs it too, a demo click would otherwise change the visitor's
real consent. The demo's header comment has the detail.

## Style boards

`src/data/styles.ts` is the source for the ten style boards and sixteen flavours a client picks
from: ids, labels, palettes, type, the words for colour, shape and motion, what each board
suits, the demo site that shows it where one honestly does, and the detail the portal draws a
board with. It is plain data with no imports, so any app can copy it.

It is consumed by:

- **SuperheroPortal**, `src/styles/boards.data.ts`: the style step clients pick on.
- **SuperheroAdmin**, `src/domain/styleBoards.data.ts`: the console's style panel.
- **superherotech.ai**, which vendors it for the public `/styles/` page.

Only the file header may differ between copies. Below it, the three files are one file, and the
portal and console each pin its SHA-256. `scripts/check-styles.mjs` holds the data's rules and
prints that hash. **A change here must be followed by the portal and the console taking the file
again and moving their pins to the new hash.** Until they do, their checks fail.

## Type

`src/data/type.ts` is the source for the house font set and the twelve pairings a client picks
from. It holds sixteen families: fifteen Fontsource packages and the device's own sans. Each
family records its board class (a `FontKey` from styles.ts), package, licence, designer, axes,
the weights the pairings use, a metric-matched fallback with its `size-adjust` and overrides, and
the kilobytes of its Latin woff2. Each pairing records a heading, a body and an optional label
family, a feel, recommended heading and body settings, what it suits, and the style boards it
serves. `familyFor(key)` gives the family a board class renders in. It is plain data with no
imports, so any app can copy it. **No font file is committed here.** A site installs the
package, imports the Latin subset and serves it from its own origin.

The rules are strict. Only SIL OFL 1.1 and Apache 2.0 are allowed, because both let the files be
redistributed and self-hosted. A pairing's families weigh at most 120 KB together. "System"
costs nothing and stays on the list. A pairing serves a board only when its families match the
board's heading and body classes, and its label class when the board has one, so the board's
`type.note` stays true. `kb` and `metrics` were measured from the Fontsource 5.3.0 files with
Capsize. The header of `type.ts` says how.

It is consumed by:

- **SuperheroPortal**, `src/brand/type.data.ts`: the brand guide's typography and hearts.
- **superherotech.ai**, which vendors it for the public `/type/` page and to render `/styles/`.

The pin rule is the same as for style boards. Only the file header may differ between copies, each
copy pins the SHA-256 of the body, and `scripts/check-type.mjs` prints it. **A change here must
be followed by the copies taking the file again and moving their pins to the new hash.**

## Licence

MIT, Ecropolis LLC. Elements are copied into client sites; see `LICENSE`.
