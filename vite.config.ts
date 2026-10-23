import { defineConfig } from "vite-plus"

export default defineConfig({
  fmt: {
    ignorePatterns: ["dist/**", ".astro/**", "node_modules/**", "*.md"],
    semi: false,
    sortImports: true,
    sortPackageJson: true,
  },
  lint: {
    ignorePatterns: ["dist/**", ".astro/**", "node_modules/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  staged: {
    // Markdown is matched for `vp check` but ignored by `fmt`; without the flag a Markdown-only commit fails.
    "*.{astro,js,mjs,cjs,ts,mts,cts,tsx,jsx,json,css,scss,md}": [
      "vp fmt --no-error-on-unmatched-pattern",
      "vp check --fix",
    ],
    "*.astro": "yarn check:astro",
  },
})
