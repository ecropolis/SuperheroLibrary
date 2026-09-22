// @ts-check
import { defineConfig } from 'astro/config';

// No home yet. When the gallery gets a hostname (library.superherotech.ai is the
// obvious one), set it here, then drop the noindex in public/_headers and
// public/robots.txt in the same commit.
export default defineConfig({
  site: 'https://library.superherotech.ai',
  build: { format: 'directory' },
});
