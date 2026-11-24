// Rebuilds the site on a schedule (`wrangler.toml` crons) so the homepage's Recent list picks up new
// GitHub activity, which is only fetched at build time. Deploy separately from the site:
//   cd worker && yarn dlx wrangler deploy
//   yarn dlx wrangler secret put DEPLOY_HOOK_URL
// The hook URL comes from the site Worker's Settings > Builds > Deploy Hooks; treat it as a secret.

interface Env {
  DEPLOY_HOOK_URL: string
}

export default {
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    const response = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" })
    // Throwing marks the cron run as failed in the Worker's logs.
    if (!response.ok)
      throw new Error(`Deploy hook answered ${response.status}: ${await response.text()}`)
  },
}
