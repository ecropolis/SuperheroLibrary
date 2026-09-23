// @ts-check
import { defineConfig } from 'astro/config';

// No `site`, on purpose. This gallery is a development preview and never gets a hostname.
// The published pages are https://superherotech.ai/elements/, built by the website from
// this repo's tarball (README, "Consumed by superherotech.ai"). The noindex in
// public/_headers, src/layouts/Base.astro and public/robots.txt is permanent.
export default defineConfig({
  build: { format: 'directory' },
});
