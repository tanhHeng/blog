import type { TransitionBeforePreparationEvent } from "astro:transitions/client"

import { onBeforeSwap } from "./pageLifecycle"
import type { PageTransitionVariant } from "./pageTransitions"

type Variant = PageTransitionVariant | "plain"
interface Transition {
  variant: Variant
  direction: string
  veil: HTMLElement
  animation?: Animation
  entering?: Promise<void>
  arriving?: boolean
  signal: AbortSignal
}

const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
let current: Transition | undefined
// Loads faster than this show no loading dots and go straight to the page transition.
const loaderDelay = 200

function loaderElement() {
  return document.querySelector<HTMLElement>("[data-transition-loader]")
}

function hideLoader() {
  const loader = loaderElement()
  if (!loader) return
  loader.getAnimations({ subtree: true }).forEach((animation) => animation.cancel())
  loader.dataset.state = "idle"
}

// Resolves when `loading` settles. Past `loaderDelay` the loading dots loop meanwhile; once loading
// finishes they start leaving and this resolves at once, so the page transition plays alongside the exit.
async function withLoader(transition: Transition, loading: Promise<void>) {
  const loader = loaderElement()
  let shown = false
  const timer = window.setTimeout(() => {
    if (!loader || current !== transition) return
    shown = true
    loader.dataset.state = "loading"
  }, loaderDelay)
  try {
    await loading
  } finally {
    window.clearTimeout(timer)
  }
  if (!shown || !loader || current !== transition) return
  // Each dot leaves from wherever its pulse is, so the exit never jumps in size. The motion is the home
  // veil dots' `veil-dot` burst (scale to 1.6 and fade over its last 40%: 304ms, ease-out, 70ms stagger).
  const dots = Array.from(loader.querySelectorAll<HTMLElement>(".loader-dots span"))
  const from = dots.map((dot) => {
    const style = getComputedStyle(dot)
    return {
      opacity: style.opacity,
      transform: style.transform === "none" ? "scale(1)" : style.transform,
    }
  })
  // Read before `leaving` drops the loading styles, so the cover fades from where its fade-in got to.
  const cover = getComputedStyle(loader)
  const coverFrom = { backgroundColor: cover.backgroundColor, backdropFilter: cover.backdropFilter }
  // The home arrival brings its own brand dots; after the loading dots they would be a second set.
  if (transition.variant === "home") transition.veil.dataset.afterLoader = ""
  loader.dataset.state = "leaving"
  const exits = dots.map(
    (dot, index) =>
      dot.animate([from[index], { opacity: 0, transform: "scale(1.6)" }], {
        duration: 760 * 0.4,
        delay: index * 70,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      }).finished,
  )
  // The cover fades with the Web Animations API: unlike a CSS transition it survives the persisted loader
  // being moved into the incoming document, which for the homepage happens right away.
  const coverFade = loader.animate(
    [coverFrom, { backgroundColor: "rgba(255, 255, 255, 0)", backdropFilter: "blur(0px)" }],
    { duration: 700, easing: "ease-out", fill: "forwards" },
  ).finished
  // A newer navigation cancels these and shows its own dots; only clear the loader if it is still ours.
  void Promise.all([...exits, coverFade]).then(
    () => {
      if (loader.dataset.state === "leaving") hideLoader()
    },
    () => undefined,
  )
}

function variantFor(url: URL): Variant {
  const path = url.pathname.replace(/\/$/, "") || "/"
  if (path === "/") return "home"
  if (path === "/novel") return "novel"
  if (path === "/articles" || path.startsWith("/articles/")) return "article"
  return "plain"
}

function reset(transition: Transition) {
  const isCurrent = current === transition
  transition.animation?.cancel()
  if (isCurrent) {
    transition.veil.getAnimations().forEach((animation) => animation.cancel())
    transition.veil.dataset.phase = "idle"
    transition.veil.style.removeProperty("clip-path")
    transition.veil.style.removeProperty("opacity")
    transition.veil.style.removeProperty("filter")
    current = undefined
    hideLoader()
    delete transition.veil.dataset.afterLoader
  }
}

function populate(transition: Transition, incoming: Document) {
  const { veil } = transition
  const data = incoming.documentElement.dataset
  const variant = data.transitionVariant
  transition.variant =
    variant === "home" || variant === "article" || variant === "novel" ? variant : "plain"
  veil.dataset.variant = transition.variant
  veil.querySelector<HTMLElement>("[data-veil-kicker]")!.textContent = data.transitionKicker ?? ""
  const numeral = veil.querySelector<HTMLElement>("[data-veil-numeral]")!
  if (numeral.textContent !== (data.transitionNumeral ?? "")) {
    numeral.replaceChildren(
      ...Array.from(
        new Intl.Segmenter().segment(data.transitionNumeral ?? ""),
        ({ segment }) => segment,
      ).map((char, index) => {
        const digit = document.createElement("span")
        digit.textContent = char
        const offset = transition.direction === "back" ? "-0.45em" : "0.45em"
        digit.animate(
          [
            { opacity: 0, transform: `translateY(${offset})` },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 620,
            delay: index * 45,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "backwards",
          },
        )
        return digit
      }),
    )
  }
  veil.querySelector<HTMLElement>("[data-veil-caption]")!.textContent = data.transitionCaption ?? ""
  const lines: string[] = JSON.parse(data.transitionLines ?? "[]")
  veil.querySelectorAll<HTMLElement>("[data-veil-line]").forEach((line, index) => {
    line.hidden = index >= lines.length
    line.textContent = lines[index] ?? ""
  })
}

// Novel and plain veils animate opacity only, which stays on the compositor; animating `filter`
// repaints the full-screen mist every frame over the novel's video and stutters as the reveal ends.
function frames(variant: Variant, direction: string, entering: boolean): Keyframe[] {
  if (variant === "novel" || variant === "plain") {
    return entering ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }]
  }
  const hidden =
    variant === "home"
      ? { opacity: 1, clipPath: "circle(0 at 50% 50%)" }
      : {
          opacity: 1,
          clipPath: (direction === "back") !== entering ? "inset(100% 0 0)" : "inset(0 0 100% 0)",
        }
  const covered =
    variant === "home"
      ? { opacity: 1, clipPath: "circle(75vmax at 50% 50%)" }
      : { opacity: 1, clipPath: "inset(0)" }
  return entering ? [hidden, covered] : [covered, hidden]
}

async function play(transition: Transition, entering: boolean) {
  const { veil, variant, direction } = transition
  const duration = entering
    ? variant === "novel"
      ? 620
      : variant === "article"
        ? 520
        : variant === "home"
          ? 460
          : 240
    : variant === "novel"
      ? 1100
      : variant === "article"
        ? 780
        : variant === "home"
          ? 760
          : 240
  const previous = transition.animation
  const animation = veil.animate(frames(variant, direction, entering), {
    duration,
    easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    fill: "forwards",
  })
  transition.animation = animation
  previous?.cancel()
  await animation.finished.catch(() => undefined)
}

document.addEventListener("astro:before-preparation", (event: TransitionBeforePreparationEvent) => {
  if (current) reset(current)
  if (motion.matches) return
  const veil = document.querySelector<HTMLElement>("[data-transition-veil]")
  if (!veil) return
  const transition: Transition = {
    variant: variantFor(event.to),
    direction: event.direction,
    veil,
    signal: event.signal,
  }
  current = transition
  veil.dataset.variant = transition.variant
  veil.dataset.direction = transition.direction
  event.signal.addEventListener(
    "abort",
    () => {
      if (current === transition) reset(transition)
    },
    { once: true },
  )

  // Loading runs first (with the loading dots past the threshold); the page transition starts once the
  // next document is ready, so the cover never sits on screen while the network is still pending.
  const loader = event.loader
  event.loader = async () => {
    try {
      await withLoader(transition, loader())
      if (current !== transition || event.signal.aborted) return
      if (event.defaultPrevented) {
        reset(transition)
        return
      }
      // Home opens through the root view-transition iris (`homeRootTransition`); swap right away.
      if (transition.variant === "home") return

      // Filled before the cover so its text and digit animations play with it; never swap an uncovered page.
      populate(transition, event.newDocument)
      veil.dataset.phase = "covering"
      transition.entering = play(transition, true)
      await transition.entering
      if (event.signal.aborted) reset(transition)
    } catch (error) {
      if (current === transition) reset(transition)
      throw error
    }
  }

  if (transition.variant !== "home") {
    veil
      .querySelectorAll<HTMLElement>(
        "[data-veil-kicker], [data-veil-numeral], [data-veil-caption], [data-veil-line]",
      )
      .forEach((element) => {
        element.textContent = ""
      })
  }
})

onBeforeSwap((event) => {
  const activeHref = event.newDocument
    .querySelector<HTMLAnchorElement>("#site-navbar .nav-link.active")
    ?.getAttribute("href")
  document.querySelectorAll<HTMLAnchorElement>("#site-navbar .nav-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === activeHref)
  })
  if (!current) return
  if (current.variant === "home") {
    const transition = current
    transition.veil.dataset.phase = "iris"
    window.setTimeout(() => {
      if (current === transition) reset(transition)
    }, 1500)
    return
  }
  populate(current, event.newDocument)
})

document.addEventListener("astro:page-load", () => {
  const transition = current
  if (!transition) return
  if (motion.matches || transition.signal.aborted) {
    reset(transition)
    return
  }
  if (transition.arriving || transition.variant === "home") return
  transition.arriving = true
  transition.veil.dataset.phase = "revealing"
  void transition.entering
    ?.then(() => {
      if (current !== transition || transition.signal.aborted) return
      return play(transition, false)
    })
    .then(() => {
      if (current === transition) reset(transition)
    })
})
