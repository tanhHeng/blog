import { burstDots, loadingDots, pulseDots } from "./loadingDots"

// Drives the first-visit loader (`SiteLoader.astro`): the loading dots grow in and pulse while the page's
// resources arrive, burst once everything has loaded, and the cover lifts. Runs once per full page load;
// ClientRouter navigations never show the loader.

const root = document.documentElement
// Loads still pending after this long (ms) count as done, so a stalled resource never traps the page.
const giveUpAfter = 8000
const easeInOut = "cubic-bezier(0.65, 0, 0.35, 1)"

function settled(target: EventTarget, events: string[]) {
  return new Promise<void>((resolve) => {
    for (const type of events) target.addEventListener(type, () => resolve(), { once: true })
  })
}

// What "loaded" means: the document and its eager subresources, every eager image, the fonts in use, and
// the first frame of any video. Lazy images and `preload="none"` videos may never load, so they don't count.
function pendingLoads(): Promise<unknown>[] {
  const images = Array.from(document.images)
    .filter((image) => image.loading !== "lazy" && !image.complete)
    .map((image) => settled(image, ["load", "error"]))
  const videos = Array.from(document.querySelectorAll("video"))
    .filter(
      (video) => video.preload !== "none" && video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA,
    )
    .map((video) => settled(video, ["loadeddata", "error"]))
  const page = document.readyState === "complete" ? [] : [settled(window, ["load"])]
  return [...images, ...videos, ...page, document.fonts.ready]
}

// Input would otherwise reach the page under the cover (the novel page glides on wheel, touch, and keys).
const blockInput = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
}
const blockedInputs = ["wheel", "touchmove", "keydown"]

async function run(loader: HTMLElement, lifting: PromiseWithResolvers<void>) {
  blockedInputs.forEach((type) =>
    window.addEventListener(type, blockInput, { capture: true, passive: false }),
  )
  const dots = loadingDots(loader)
  // The dots always finish growing in before they burst, so a cached load still shows them, not a flash.
  const grown = pulseDots(dots)
  const loaded = Promise.race([
    Promise.all(pendingLoads()),
    new Promise((resolve) => window.setTimeout(resolve, giveUpAfter)),
  ])
  await Promise.all([grown, loaded])
  await burstDots(dots)

  lifting.resolve()
  await loader
    .animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 700,
      easing: easeInOut,
      fill: "forwards",
    })
    .finished.catch(() => undefined)
  blockedInputs.forEach((type) => window.removeEventListener(type, blockInput, { capture: true }))
  root.removeAttribute("data-site-loading")
  loader.remove()
}

function start(): Promise<void> {
  const loader = document.querySelector<HTMLElement>("[data-site-loader]")
  if (!root.hasAttribute("data-site-loading") || !loader) return Promise.resolve()
  const lifting = Promise.withResolvers<void>()
  void run(loader, lifting)
  return lifting.promise
}

/** Settles when the first-visit loader starts lifting, or at once when it is not shown. Page entrances
 * that play on the first `astro:page-load` wait for it, or they would finish unseen beneath the cover. */
export const siteLoaderLifting = start()
