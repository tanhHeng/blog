import type { TransitionBeforePreparationEvent } from "astro:transitions/client"

import { burstDots, loadingDots, pulseDots } from "./loadingDots"
import { onBeforeSwap } from "./pageLifecycle"
import { routePath, type PageTransition, type PageTransitionVariant } from "./pageTransitions"

type Variant = PageTransitionVariant | "plain"
interface Transition {
  variant: Variant
  direction: string
  veil: HTMLElement
  /** The active variant's layer inside the veil (`.veil-home`, `.veil-article`, …). */
  scope: HTMLElement
  animation?: Animation
  arriving?: boolean
  /** The full-page-load entry, which reveals on its own schedule rather than on `astro:page-load`. */
  entry?: boolean
  signal: AbortSignal
}

const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
let current: Transition | undefined
// Loads that finish within this long after the click (ms) show no loading dots.
const dotsThreshold = 500
// The veil numeral's characters start `min(numeralStagger, numeralStaggerBudget / count)` ms apart, so a
// long numeral spreads its entrance over at most the budget.
const numeralStagger = 45
const numeralStaggerBudget = 250

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const easeInOut = "cubic-bezier(0.65, 0, 0.35, 1)"
const easeOut = "cubic-bezier(0.22, 1, 0.36, 1)"
const rise = (blur: string, offset: string): Keyframe[] => [
  { opacity: 0, filter: `blur(${blur})`, transform: `translateY(${offset})` },
  { opacity: 1, filter: "blur(0)", transform: "translateY(0)" },
]

// The cover starts before the next document is fetched, so its variant and text come from the route
// table `BaseLayout` serializes into every page (see `routeTransitions`).
function routeFor(url: URL): PageTransition | undefined {
  const table = document.querySelector("[data-transition-routes]")?.textContent
  if (!table) return undefined
  const routes: Record<string, PageTransition> = JSON.parse(table)
  return routes[routePath(url.pathname)]
}

// Veil animations run through the Web Animations API rather than CSS: Astro re-inserts the persisted veil
// into the incoming document at swap, which restarts CSS animations and would replay them mid-transition.
function animateEach(
  scope: ParentNode,
  selector: string,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions & { delay?: number },
  stagger = 0,
) {
  return Array.from(scope.querySelectorAll<HTMLElement>(selector), (element, index) =>
    element.animate(keyframes, { ...options, delay: (options.delay ?? 0) + index * stagger }),
  )
}

function enterText({ scope, variant }: Transition): Animation[] {
  if (variant === "article") {
    return animateEach(
      scope,
      ".veil-band",
      [
        { opacity: 0, filter: "blur(6px)", transform: "translate(-50%, calc(-50% + 0.75rem))" },
        { opacity: 1, filter: "blur(0)", transform: "translate(-50%, -50%)" },
      ],
      { duration: 500, easing: "ease", fill: "backwards" },
    )
  }
  if (variant === "novel") {
    return animateEach(
      scope,
      "[data-veil-line]:not([hidden])",
      rise("8px", "0.5rem"),
      { duration: 500, easing: "ease", fill: "backwards" },
      160,
    )
  }
  if (variant === "home") {
    return animateEach(
      scope,
      "[data-veil-kicker], [data-veil-line]:not([hidden])",
      rise("6px", "0.5rem"),
      { duration: 500, easing: "ease", fill: "backwards" },
      140,
    )
  }
  return []
}

// Home reveal companions: the brand text lifts away as the centre hole starts to open, and the rings ripple
// out just ahead of the hole's edge (negative delays put each ring further along the hole's own curve).
function leaveHome({ scope }: Transition) {
  animateEach(
    scope,
    ".veil-stack",
    [
      { opacity: 1, filter: "blur(0)", transform: "translate(-50%, -50%)" },
      { opacity: 0, filter: "blur(6px)", transform: "translate(-50%, calc(-50% - 0.75rem))" },
    ],
    { duration: 360, easing: "ease-in", fill: "forwards" },
  )
  animateEach(
    scope,
    ".veil-ring",
    [
      { width: "0", height: "0", opacity: 1 },
      { opacity: 1, offset: 0.7 },
      { width: "150vmax", height: "150vmax", opacity: 0 },
    ],
    { duration: durations.home[1], delay: -90, easing: easeInOut, fill: "both" },
    -90,
  )
}

function reset(transition: Transition) {
  const isCurrent = current === transition
  transition.animation?.cancel()
  if (isCurrent) {
    const { veil } = transition
    veil.getAnimations({ subtree: true }).forEach((animation) => animation.cancel())
    veil.dataset.phase = "idle"
    current = undefined
  }
  if (transition.entry) endEntry()
}

function clearText(veil: HTMLElement) {
  veil
    .querySelectorAll<HTMLElement>(
      "[data-veil-kicker], [data-veil-numeral], [data-veil-caption], [data-veil-line]",
    )
    .forEach((element) => {
      element.textContent = ""
    })
}

// Fills the active variant's text and plays its entrance. Called shortly after the cover starts, together
// with the dots; the veil's clip-path (or opacity) keeps them hidden wherever the cover has not reached yet.
// Resolves once every entrance animation has finished: the swap must wait for it, because Chromium stops
// painting while Astro swaps inside `startViewTransition` and the running text would visibly jump.
async function populate(transition: Transition, data: PageTransition | undefined) {
  const { scope } = transition
  const entrance: Animation[] = []
  const kicker = scope.querySelector<HTMLElement>("[data-veil-kicker]")
  if (kicker) kicker.textContent = data?.kicker ?? ""
  const caption = scope.querySelector<HTMLElement>("[data-veil-caption]")
  if (caption) caption.textContent = data?.caption ?? ""
  const digits = Array.from(
    new Intl.Segmenter().segment(data?.numeral ?? ""),
    ({ segment }) => segment,
  )
  const stagger = Math.min(numeralStagger, numeralStaggerBudget / Math.max(digits.length, 1))
  scope.querySelector<HTMLElement>("[data-veil-numeral]")?.replaceChildren(
    ...digits.map((char, index) => {
      const digit = document.createElement("span")
      digit.textContent = char
      const offset = transition.direction === "back" ? "-0.45em" : "0.45em"
      entrance.push(
        digit.animate(
          [
            { opacity: 0, transform: `translateY(${offset})` },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 500, delay: index * stagger, easing: easeOut, fill: "backwards" },
        ),
      )
      return digit
    }),
  )
  const lines = data?.lines ?? []
  scope.querySelectorAll<HTMLElement>("[data-veil-line]").forEach((line, index) => {
    line.hidden = index >= lines.length
    line.textContent = lines[index] ?? ""
  })
  entrance.push(...enterText(transition))
  await Promise.all(entrance.map((animation) => animation.finished.catch(() => undefined)))
}

// The variant's one group of dots, below its text: a loading indicator only. Once `start` settles, if the
// document is still loading they grow in and pulse; the moment it arrives they burst. Otherwise they never show.
async function withDots(transition: Transition, start: Promise<unknown>, loading: Promise<void>) {
  const dots = loadingDots(transition.scope)
  let loaded = false
  let shown = false
  void start.then(() => {
    if (loaded || current !== transition) return
    shown = true
    void pulseDots(dots)
  })
  try {
    await loading
  } finally {
    loaded = true
  }
  if (shown && current === transition) void burstDots(dots)
}

// Novel and plain veils animate opacity only, which stays on the compositor; animating `filter`
// repaints the full-screen mist every frame over the novel's video and stutters as the reveal ends.
// Home covers with a growing circle and reveals through a growing hole (`--veil-hole`, a registered
// property masked in `PageTransitionVeil.astro`), so the new page opens from the centre.
function frames(variant: Variant, direction: string, entering: boolean): Keyframe[] {
  if (variant === "novel" || variant === "plain") {
    return entering ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }]
  }
  if (variant === "home") {
    return entering
      ? [
          { opacity: 1, clipPath: "circle(0 at 50% 50%)" },
          { opacity: 1, clipPath: "circle(75vmax at 50% 50%)" },
        ]
      : [
          { opacity: 1, clipPath: "circle(75vmax at 50% 50%)", "--veil-hole": "0vmax" },
          { opacity: 1, clipPath: "circle(75vmax at 50% 50%)", "--veil-hole": "75vmax" },
        ]
  }
  const hidden = {
    opacity: 1,
    clipPath: (direction === "back") !== entering ? "inset(100% 0 0)" : "inset(0 0 100% 0)",
  }
  const covered = { opacity: 1, clipPath: "inset(0)" }
  return entering ? [hidden, covered] : [covered, hidden]
}

const durations: Record<Variant, [entering: number, leaving: number]> = {
  home: [312, 1100],
  article: [312, 780],
  novel: [372, 1100],
  plain: [144, 240],
}
// The text and dots start this far into the cover (as a fraction of its duration), slightly behind the
// cover's leading edge.
const contentLag = 0.3

async function play(transition: Transition, entering: boolean) {
  const { veil, variant, direction } = transition
  const previous = transition.animation
  const animation = veil.animate(frames(variant, direction, entering), {
    duration: durations[variant][entering ? 0 : 1],
    easing: easeInOut,
    fill: "forwards",
  })
  transition.animation = animation
  previous?.cancel()
  await animation.finished.catch(() => undefined)
}

// Each navigation is one sequence on the persisted veil: (1) the cover starts at once; (2) just after it,
// the veil text and its dots enter inside the cover, the dots pulsing while the document is still loading;
// (3) the DOM swaps under the complete cover and the reveal plays after the new page loads.
document.addEventListener("astro:before-preparation", (event: TransitionBeforePreparationEvent) => {
  if (current) reset(current)
  if (motion.matches) return
  const veil = document.querySelector<HTMLElement>("[data-transition-veil]")
  if (!veil) return
  const route = routeFor(event.to)
  const variant: Variant = route?.variant ?? "plain"
  const cover = Promise.withResolvers<void>()
  const transition: Transition = {
    variant,
    direction: event.direction,
    veil,
    scope: veil.querySelector<HTMLElement>(`.veil-${variant}`)!,
    signal: event.signal,
  }
  current = transition
  clearText(veil)
  veil.dataset.variant = variant
  veil.dataset.direction = transition.direction
  veil.dataset.phase = "covering"
  void play(transition, true).then(cover.resolve)
  // The text and dots start together; `content` settles once the text entrance has finished.
  const contentStart = wait(durations[variant][0] * contentLag)
  const content = contentStart.then(() =>
    current === transition ? populate(transition, route) : undefined,
  )
  event.signal.addEventListener(
    "abort",
    () => {
      if (current === transition) reset(transition)
    },
    { once: true },
  )

  const loader = event.loader
  event.loader = async () => {
    try {
      await withDots(transition, Promise.all([contentStart, wait(dotsThreshold)]), loader())
      if (current !== transition || event.signal.aborted) return
      if (event.defaultPrevented) {
        reset(transition)
        return
      }
      // Never swap an uncovered page, nor one whose centre text is still entering.
      await Promise.all([cover.promise, content])
      if (event.signal.aborted) reset(transition)
    } catch (error) {
      if (current === transition) reset(transition)
      throw error
    }
  }
})

onBeforeSwap((event) => {
  const activeHref = event.newDocument
    .querySelector<HTMLAnchorElement>("#site-navbar .nav-link.active")
    ?.getAttribute("href")
  document.querySelectorAll<HTMLAnchorElement>("#site-navbar .nav-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === activeHref)
  })
})

document.addEventListener("astro:page-load", () => {
  const transition = current
  if (!transition || transition.entry) return
  if (motion.matches || transition.signal.aborted) {
    reset(transition)
    return
  }
  if (transition.arriving) return
  transition.arriving = true
  reveal(transition)
})

function reveal(transition: Transition) {
  transition.veil.dataset.phase = "revealing"
  if (transition.variant === "home") leaveHome(transition)
  void play(transition, false).then(() => {
    if (current === transition) reset(transition)
  })
}

// Full page loads (first visit, reload, typed URL): `PageTransitionVeil.astro` marks the document
// `data-page-entering` before anything paints, which shows the route's veil complete, above everything (the
// navbar included). From there the sequence is a navigation's after the cover: the text enters, the dots
// show if loading outlasts `dotsThreshold`, and once everything has loaded the veil reveals the page.

// What "loaded" means: the document and its eager subresources, every eager image, the fonts in use, and
// the first frame of any video. Lazy images and `preload="none"` videos may never load, so they don't count.
function pendingLoads(): Promise<unknown>[] {
  const settled = (target: EventTarget, events: string[]) =>
    new Promise<void>((resolve) => {
      for (const type of events) target.addEventListener(type, () => resolve(), { once: true })
    })
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
// Loads still pending after this long (ms) count as done, so a stalled resource never traps the page.
const giveUpAfter = 8000

// Input would otherwise reach the page under the cover (the novel page glides on wheel, touch, and keys).
const blockInput = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
}
const blockedInputs = ["wheel", "touchmove", "keydown"]

const entryRevealing = Promise.withResolvers<void>()

function endEntry() {
  entryRevealing.resolve()
  blockedInputs.forEach((type) => window.removeEventListener(type, blockInput, { capture: true }))
  document.documentElement.removeAttribute("data-page-entering")
}

function enter() {
  const veil = document.querySelector<HTMLElement>("[data-transition-veil]")
  if (!document.documentElement.hasAttribute("data-page-entering") || !veil || motion.matches) {
    endEntry()
    return
  }
  blockedInputs.forEach((type) =>
    window.addEventListener(type, blockInput, { capture: true, passive: false }),
  )
  const variant = (veil.dataset.variant ?? "plain") as Variant
  const transition: Transition = {
    variant,
    direction: "forward",
    veil,
    scope: veil.querySelector<HTMLElement>(`.veil-${variant}`)!,
    signal: new AbortController().signal,
    entry: true,
  }
  current = transition
  // Hold the complete cover the stylesheet shows, so it stays once the entering mark is gone.
  transition.animation = veil.animate([frames(variant, "forward", true).at(-1)!], {
    fill: "forwards",
  })
  veil.dataset.phase = "covering"
  clearText(veil)
  const content = populate(transition, routeFor(new URL(location.href)))
  const loaded = Promise.race([Promise.all(pendingLoads()), wait(giveUpAfter)]).then(
    () => undefined,
  )
  void Promise.all([withDots(transition, wait(dotsThreshold), loaded), content]).then(() => {
    if (current !== transition) return
    // The mark (and the veil's place above the navbar) stays until the reveal ends, in `reset`.
    entryRevealing.resolve()
    reveal(transition)
  })
}

/** Settles when a full page load's entry veil starts revealing the page, or at once when none is shown.
 * Entrances that play on the first `astro:page-load` wait for it, or they would finish unseen beneath it. */
export const pageEntryRevealing = entryRevealing.promise

enter()
