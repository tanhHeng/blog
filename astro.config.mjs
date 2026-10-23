import react from "@astrojs/react"
// @ts-check
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  markdown: {
    // Token colours come from `--astro-code-*` variables set by `ArticleLayout.astro`, so code blocks
    // follow the site palette instead of a bundled editor theme.
    shikiConfig: { theme: "css-variables" },
  },
})
