import { onPageLoad } from "../lib/pageLifecycle"

// How long the About section must have shown at rest before the identity word changes, and between changes.
const HOLD = 3200
const CHECK = 400

// The About paragraph's identity word cycles through `data-identities`: the old word blurs out while the new
// one fades in from a blur, both at once. The stripe lives on the wrapper, not the words, so it never blurs:
// it wipes away from left to right, then sweeps back in from the left under the new word. It changes only
// while the section is shown and done animating, the tab is visible, and the pointer is not on it.
onPageLoad((scope) => {
  const identity = document.querySelector<HTMLElement>("[data-identities]")
  const word = identity?.querySelector<HTMLElement>(".about-identity-word")
  const section = identity?.closest("section")
  if (!identity || !word || !section) return
  const words: string[] = JSON.parse(identity.dataset.identities ?? "[]")
  if (words.length < 2) return
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
  let index = Math.max(0, words.indexOf(word.textContent ?? ""))
  let animations: Animation[] = []
  let ghost: HTMLElement | undefined
  let restingSince = 0

  const clear = () => {
    animations.forEach((animation) => animation.cancel())
    animations = []
    ghost?.remove()
    ghost = undefined
  }
  scope.cleanup(clear)

  const swap = () => {
    index = (index + 1) % words.length
    clear()
    if (reducedMotion.matches) {
      word.textContent = words[index]
      return
    }
    // The leaving copy stays inline, on the same line and baseline as the new word: placed before it with a
    // negative end margin of its own width, it takes no room, so the new word starts where it does.
    const leaving = word.cloneNode(true) as HTMLElement
    leaving.classList.add("about-identity-ghost")
    leaving.style.marginInlineEnd = `${-word.getBoundingClientRect().width}px`
    word.before(leaving)
    ghost = leaving
    word.textContent = words[index]
    const blur = "blur(6px)"
    animations = [
      leaving.animate(
        [
          { opacity: 1, filter: "blur(0)" },
          { opacity: 0, filter: blur },
        ],
        { duration: 520, fill: "forwards" },
      ),
      word.animate(
        [
          { opacity: 0, filter: blur },
          { opacity: 1, filter: "blur(0)" },
        ],
        { duration: 520 },
      ),
      // Pinned to the right while it shrinks, so its left edge runs off to the right; while it has no width
      // it moves back to the left, unseen, to grow out of there.
      identity.animate(
        [
          {
            backgroundPosition: "right bottom",
            backgroundSize: "100% 45%",
            easing: "cubic-bezier(0.55, 0, 0.75, 0.2)",
          },
          { backgroundPosition: "right bottom", backgroundSize: "0% 45%", offset: 0.36 },
          {
            backgroundPosition: "left bottom",
            backgroundSize: "0% 45%",
            offset: 0.4,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          },
          { backgroundPosition: "left bottom", backgroundSize: "100% 45%" },
        ],
        { duration: 1250 },
      ),
    ]
    animations[0].finished.then(
      () => {
        leaving.remove()
        if (ghost === leaving) ghost = undefined
      },
      () => {},
    )
  }

  const check = () => {
    const resting =
      !document.hidden &&
      section.classList.contains("is-active") &&
      !section.classList.contains("is-animating") &&
      !identity.matches(":hover")
    const now = performance.now()
    if (!resting) restingSince = 0
    else if (!restingSince) restingSince = now
    else if (now - restingSince >= HOLD) {
      swap()
      restingSince = now
    }
    scope.timeout(check, CHECK)
  }
  scope.timeout(check, CHECK)
})
