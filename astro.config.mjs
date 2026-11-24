import cloudflare from "@astrojs/cloudflare";
import { satteri } from "@astrojs/markdown-satteri";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

import { figureCaptions } from "./src/lib/figureCaptions.ts";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  markdown: {
    // Token colours come from `--astro-code-*` variables set by `ArticleLayout.astro`, so code blocks
    // follow the site palette instead of a bundled editor theme.
    shikiConfig: { theme: "css-variables" },
    processor: satteri({ hastPlugins: [figureCaptions] }),
  },
  adapter: cloudflare({
    imageService: "passthrough",
  }),
});
