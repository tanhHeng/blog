import { defineConfig } from "cf/config";

// The site is fully pre-rendered by `astro build` into `dist/`, so the Worker
// only serves static assets: there is no `entrypoint`.
export default defineConfig({
  worker: {
    name: "tanh-blog",
    compatibilityDate: "2026-11-06",
    assets: { notFoundHandling: "404-page" },
    domains: ["tanh.moe"],
    workersDev: true,
    previewUrls: true,
    observability: { enabled: true, issues: { enabled: true }, logs: { enabled: true } },
    placement: { mode: "smart" },
  },
});
