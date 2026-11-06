// `cf deploy --prebuilt` reads the Build Output Specification tree in
// `.cloudflare/output/v0/`. `cf` cannot build a static Astro site itself: it
// delegates to `astro build`, which writes `dist/` but no Build Output. This
// script turns the finished `dist/` into the tree `cf` deploys.
import { cleanBuildOutputDir, writeAssets, writeRootConfig, writeWorkerConfig } from "@cloudflare/build-output-utils"
import { InputWorkerSchema } from "@cloudflare/config"
import { fileURLToPath } from "node:url"
import config from "../cloudflare.config.ts"

const root = fileURLToPath(new URL("..", import.meta.url))
const isPreview = process.env.CLOUDFLARE_PREVIEW_BUILD === "true"
const context = { isPreview, mode: "production" }

const worker = config.worker
if (!worker) throw new Error("cloudflare.config.ts does not define a worker")

await cleanBuildOutputDir(root)
await writeRootConfig(root, undefined, context)
await writeWorkerConfig({ root, config: InputWorkerSchema.parse(worker) })
await writeAssets({ root, sourceDirectory: fileURLToPath(new URL("../dist", import.meta.url)) })
