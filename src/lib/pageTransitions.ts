import type { TransitionDirectionalAnimations } from "astro"

export type PageTransitionVariant = "home" | "article" | "novel"

export interface PageTransition {
  variant: PageTransitionVariant
  kicker?: string
  numeral?: string
  caption?: string
  lines?: string[]
}

const homePair = {
  old: {
    name: "vt-recede",
    duration: "600ms",
    easing: "cubic-bezier(0.55, 0, 0.75, 0.2)",
    fillMode: "both",
  },
  new: {
    name: "vt-iris",
    duration: "1100ms",
    delay: "200ms",
    easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    fillMode: "both",
  },
}

/**
 * Root animation used by ClientRouter when the Home page is entered: the old page recedes while the
 * new page opens through a circular iris. Keyframes live in `PageTransitionVeil.astro`; the veil's
 * `iris` phase ring timings match these durations.
 */
export const homeRootTransition: TransitionDirectionalAnimations = {
  forwards: homePair,
  backwards: homePair,
}
