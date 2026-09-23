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
3. **The catalogue entry** in `src/data/catalog.ts`, including:
   - `search: { query, alsoRanks? }` — the query from SE Ranking (US) the public page is
     written for, lowercase as people type it, and close variants it should also rank for.
     Record the volume and difficulty in a comment beside it.
   - `pitch` — one sentence in the client's words, the lead of the public page. `summary` stays
     the gallery's technical line.
   - `usedOn` with at least one site, and `added` as `YYYY-MM-DD`.
4. **`npm run check` green.** It verifies every entry's file exists, every entry has a demo in
   the index, every demo asset exists, ids are kebab-case and unique, each `search.query` is
   unique and not another entry's `alsoRanks`, `added` is a date, `usedOn` is non-empty, and
   that `astro build` produces one page per entry. It exits 1 with a sentence naming the entry
   and the rule.
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
| `src/data/catalog.ts` | `catalog` (and `byId`): names, `search`, `pitch`, `aka`, `replaces`, good for / not for, `usedOn` |
| `src/components/demos/index.ts` | `demos`, keyed by element `id` |
| `src/library/<id>/<File>.astro` | each entry's `file`, imported by its demo |
| `public/demo/*` | demo assets, copied to the site's `public/elements-demo/`; the site passes `assetBase="/elements-demo/"` to each demo |

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

## Licence

MIT, Ecropolis LLC. Elements are copied into client sites; see `LICENSE`.
