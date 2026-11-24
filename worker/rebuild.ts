// Triggers a build of the site Worker on the schedule in `cloudflare.config.ts`. This is its own
// project, deployed separately from the site (`cf auth login` first):
//   cd worker && yarn install && yarn cf deploy
//   yarn cf workers secrets update DEPLOY_HOOK_URL
// The hook URL comes from the site Worker's Settings > Builds > Deploy Hooks, which requires the site
// Worker to be connected to the Git repository (Workers Builds). Treat the URL as a secret.

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
