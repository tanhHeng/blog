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
    // `fmt` skips Markdown (ignored above) and Astro files; without the flag a commit of only those fails.
    "*.{astro,js,mjs,cjs,ts,mts,cts,tsx,jsx,json,css,scss,md}":
      "vp fmt --no-error-on-unmatched-pattern",
  },
})
