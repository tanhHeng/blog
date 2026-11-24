import { bindings, defineConfig, triggers } from "cf/config"

// A separate Worker that rebuilds the site every 12 hours (UTC) through the site Worker's Deploy Hook,
// so the homepage's Recent list, fetched at build time, picks up new GitHub activity. See `rebuild.ts`.
export default defineConfig({
  worker: {
    name: "tanh-blog-rebuild",
    entrypoint: "./rebuild.ts",
    compatibilityDate: "2026-11-06",
    workersDev: false,
    env: {
      DEPLOY_HOOK_URL: bindings.secret(),
    },
    triggers: [triggers.scheduled({ schedule: "0 */12 * * *" })],
    observability: { enabled: true, logs: { enabled: true } },
  },
})
