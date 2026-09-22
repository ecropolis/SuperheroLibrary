# Superhero UI library

The reusable UI elements Superhero Technologies builds client sites from, with a gallery
so a client, a designer or an agent can point at one and name it. This is the "standard
component library" from Phase 2 of the Website roadmap, started 2026-09-22 with the two
elements rebuilt for contexture.ai.

- **Gallery**: `npm run dev`, or the deployed site once it has a hostname (none yet;
  `library.superherotech.ai` is the obvious one, on the Ecropolis Cloudflare account).
- **Elements**: `src/library/<id>/<Name>.astro` — one self-contained file each.
- **Catalogue**: `src/data/catalog.ts` — the names, props, theming, accessibility notes and
  where each element is in use. The gallery is generated from it.
- **Skill**: `superhero-ui-library` in `ecropolis/agent-skills` (house-stack plugin). Every
  element here has a section there; an element without one is not finished.

## Rules for an element

1. **One file, no dependencies.** Script and style inline, so the element copies into a client
   site as a single `.astro` file. (Packaging as an npm dependency is a later decision; until
   then copying is the distribution, and the catalogue's `usedOn` is how we know where copies
   live.)
2. **Themed from the host's tokens through `--<prefix>-*` custom properties, each with a
   fallback.** Client sites forbid literal colours in components; the fallbacks live here so the
   element works before it is themed, and the host maps the variables in its `global.css`.
3. **Keyboard operable, screen-reader sensible, reduced-motion aware.** Say how in the catalogue.
4. **Named for what it does, not what WordPress called it.** The `id` is the name people use;
   `aka` carries the WordPress, page-builder and plugin names so the old vocabulary still finds it.
5. **Recorded where it is used.** When an element goes into a client site, add the site to
   `usedOn`.

## Adding an element

1. Put the component in `src/library/<id>/`.
2. Add a demo in `src/components/demos/` using neutral assets from `public/demo/` — never a
   client's images.
3. Add the catalogue entry, and register the demo in the `demos` maps in `src/pages/index.astro`
   and `src/pages/[id].astro`.
4. Write its section in the `superhero-ui-library` skill and bump the plugin version.

## Using one in a client build

Copy the file into `src/components/`, set its theming variables from the site's tokens, and
follow the element's page for any stacking or sizing rule. The skill says the same, for agents.
