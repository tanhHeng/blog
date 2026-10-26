// The three loading dots of `LoadingDots.astro`, shared by the page transition veil and the first-visit loader.
// They run through the Web Animations API: the persisted veil is re-inserted at swap, which would restart
// CSS animations.

// Each pulse rises for `dotRise` and falls back for `dotFall`, then rests for `dotPause`. Dot `i` runs
// `i * dotStagger` behind the first. The entrance is the first pulse with the same timing and easing, only
// grown from nothing, so it already reads as the wave.
const dotRise = 444
const dotFall = 429
const dotPause = 425
const dotCycle = dotRise + dotFall + dotPause
const dotStagger = 112
const dotExit = 480
const dotRest = { opacity: 0.35, transform: "scale(0.55)", easing: "ease-in-out" }
const dotPulse: Keyframe[] = [
  dotRest,
  { opacity: 1, transform: "scale(0.8)", easing: "ease-in-out", offset: dotRise / dotCycle },
  { ...dotRest, offset: (dotRise + dotFall) / dotCycle },
  dotRest,
]
const dotEnter: Keyframe[] = [
  { ...dotRest, opacity: 0, transform: "scale(0)" },
  ...dotPulse.slice(1),
]

/** The dots inside `scope`'s `[data-loading-dots]` group, in wave order. */
export function loadingDots(scope: ParentNode): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>("[data-loading-dots] span"))
}

/** Grows the dots in with their first pulse, then pulses them until `burstDots`. Resolves once the
 * last dot has grown in. */
export function pulseDots(dots: HTMLElement[]): Promise<void> {
  const entrances = dots.map((dot, index) => {
    const delay = index * dotStagger
    // The entrance must be created first: it holds its last frame (`fill: "both"`), and a later animation
    // composites above an earlier one, so the other way round it would mask the pulse for good.
    const entrance = dot.animate(dotEnter, { duration: dotCycle, delay, fill: "both" })
    dot.animate(dotPulse, { duration: dotCycle, delay: delay + dotCycle, iterations: Infinity })
    return entrance
  })
  return wait(dots.length ? (dots.length - 1) * dotStagger + dotRise : 0, entrances)
}

/** Stops the pulse and bursts each dot (scale up and fade) from its current size, `dotStagger` apart like
 * the entrance. Resolves as the last dot starts to burst. */
export function burstDots(dots: HTMLElement[]): Promise<void> {
  const bursts = dots.map((dot, index) => {
    const { opacity, transform } = getComputedStyle(dot)
    dot.getAnimations().forEach((animation) => animation.cancel())
    return dot.animate(
      [
        { opacity, transform },
        { opacity: 0, transform: "scale(1.6)" },
      ],
      {
        duration: dotExit,
        delay: index * dotStagger,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      },
    )
  })
  return wait(dots.length ? (dots.length - 1) * dotStagger : 0, bursts)
}

// Resolves `ms` into the given animations' timeline, or early if they are cancelled (the veil resets).
function wait(ms: number, animations: Animation[]) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
    animations.forEach((animation) => void animation.finished.catch(() => resolve()))
  })
}
