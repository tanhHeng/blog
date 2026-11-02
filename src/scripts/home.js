import { onPageLoad } from "../lib/pageLifecycle"
import { pageEntryRevealing } from "../lib/transitionCoordinator"

onPageLoad((scope) => {
  const snapSections = Array.from(document.querySelectorAll(".scroll-snap-section"))
  const contentSections = Array.from(document.querySelectorAll(".left-container section"))
  const railLinks = Array.from(document.querySelectorAll(".chapter-rail [data-chapter-link]"))
  const chapterLinks = Array.from(document.querySelectorAll("[data-chapter-link]"))
  const sectionKeys = Array.from(document.querySelectorAll(".section-key"))
  const numeral = document.querySelector("[data-chapter-numeral]")
  const circlesGrid = document.querySelector(".main-content .circles-grid")
  const signatureCircles = Array.from(circlesGrid?.querySelectorAll(".circle") ?? [])
  const mainTitle = document.querySelector(".main-content > .title")
  const signature = document.querySelector(".main-content > .signature")
  if (!snapSections.length || !contentSections.length || !mainTitle || !signature || !circlesGrid)
    return
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
  const easeOut = "cubic-bezier(0.16, 1, 0.3, 1)"
  const easeIn = "cubic-bezier(0.55, 0, 0.75, 0.2)"
  let currentIndex = 0
  let displayedSection = contentSections[0]
  let transitionToken = 0
  let runningAnimations = []
  let scrollTarget
  let scrollTargetTimer = 0

  function syncSignaturePosition() {
    if (!mainTitle || !signature) return

    const titleStyle = getComputedStyle(mainTitle)
    const lineHeight = Number.parseFloat(titleStyle.lineHeight)
    const wrapOffset = matchMedia("(max-width: 900px)").matches
      ? Math.max(0, mainTitle.getBoundingClientRect().height - lineHeight)
      : 0
    signature.style.setProperty("--title-wrap-offset", `${wrapOffset}px`)
  }

  const signatureObserver = new ResizeObserver(syncSignaturePosition)
  scope.observe(signatureObserver)
  signatureObserver.observe(mainTitle)
  syncSignaturePosition()

  function syncMainContentWidth() {
    const mainContent = document.querySelector(".main-content")
    if (!mainContent || !mainTitle || !signature) return

    const maxWidth =
      mainTitle.getBoundingClientRect().width + 1 * signature.getBoundingClientRect().width
    mainContent.style.setProperty("--main-content-max-width", `${maxWidth}px`)
  }

  const widthObserver = new ResizeObserver(syncMainContentWidth)
  scope.observe(widthObserver)
  widthObserver.observe(mainTitle)
  widthObserver.observe(signature)
  syncMainContentWidth()

  function syncSignatureCircles() {
    if (!circlesGrid || signatureCircles.length === 0) return

    const isMobile = matchMedia("(max-width: 900px)").matches
    const columns = isMobile ? 8 : 10
    const rows = isMobile ? 3 : 4
    circlesGrid.style.setProperty("--signature-columns", String(columns))
    circlesGrid.style.setProperty("--signature-rows", String(rows))
    signatureCircles.forEach((circle, index) => {
      circle.hidden = index >= columns * rows
    })
  }

  const gridObserver = new ResizeObserver(syncSignatureCircles)
  scope.observe(gridObserver)
  gridObserver.observe(circlesGrid)
  syncSignatureCircles()

  const revealItems = (section) => Array.from(section.querySelectorAll("[data-reveal]"))
  const settle = (animations) =>
    Promise.allSettled(animations.map((animation) => animation.finished))

  function track(animations) {
    runningAnimations.push(...animations)
    return animations
  }

  function cancelRunningAnimations() {
    runningAnimations.forEach((animation) => animation.cancel())
    runningAnimations = []
  }

  function showSection(section) {
    contentSections.forEach((candidate) => {
      candidate.hidden = candidate !== section
      candidate.classList.toggle("is-active", candidate === section)
      candidate.classList.remove("is-leaving")
    })
    displayedSection = section
  }

  // While rows are displaced, the section clips instead of scrolling; otherwise the narrow layout's
  // `overflow-y: auto` sections flash a scrollbar for the length of the animation.
  function guardSection(section, animations) {
    section.classList.add("is-animating")
    void settle(animations).then(() => {
      const busy = runningAnimations.some(
        (animation) =>
          animation.playState === "running" && section.contains(animation.effect?.target),
      )
      if (!busy) section.classList.remove("is-animating")
    })
    return animations
  }

  // Items rise into place line by line, unveiled through a soft clip that opens from the travel side.
  function revealIn(section, direction) {
    const down = direction === "down"
    const hiddenClip = down ? "inset(100% -10% -25% -10%)" : "inset(-25% -10% 100% -10%)"
    return guardSection(
      section,
      track(
        revealItems(section).map((item, index) =>
          item.animate(
            [
              {
                opacity: 0,
                transform: `translateY(${down ? 2.25 : -2.25}rem)`,
                filter: "blur(8px)",
                clipPath: hiddenClip,
              },
              {
                opacity: 1,
                transform: "translateY(0)",
                filter: "blur(0)",
                clipPath: "inset(-25% -10% -25% -10%)",
              },
            ],
            { duration: 820, delay: 120 + index * 85, easing: easeOut, fill: "backwards" },
          ),
        ),
      ),
    )
  }

  function revealOut(section, direction) {
    const down = direction === "down"
    const items = revealItems(section)
    return guardSection(
      section,
      track(
        (down ? items : items.reverse()).map((item, index) =>
          item.animate(
            [
              { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
              { opacity: 0, transform: `translateY(${down ? -1.5 : 1.5}rem)`, filter: "blur(6px)" },
            ],
            { duration: 420, delay: index * 45, easing: easeIn, fill: "forwards" },
          ),
        ),
      ),
    )
  }

  // A glissando of key-shaped light: keys rise from the travel side and leave through the opposite edge.
  function sweepKeys(direction) {
    const down = direction === "down"
    const keys = down ? sectionKeys : [...sectionKeys].reverse()
    const enter = down ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)"
    const leave = down ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)"
    keys.forEach((key, index) =>
      key.animate(
        [
          { clipPath: enter, opacity: 0 },
          { clipPath: "inset(0 0 0 0)", opacity: 1, offset: 0.46 },
          { clipPath: leave, opacity: 0.35 },
        ],
        { duration: 1150, delay: index * 22, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
      ),
    )
  }

  function updateChapter(index, direction) {
    railLinks.forEach((link, linkIndex) => {
      if (linkIndex === index) link.setAttribute("aria-current", "step")
      else link.removeAttribute("aria-current")
    })
    if (!numeral) return

    const label = String(index + 1).padStart(2, "0")
    numeral.getAnimations().forEach((animation) => animation.cancel())
    if (reducedMotion.matches) {
      numeral.textContent = label
      return
    }

    const shift = direction === "down" ? -1 : 1
    const exit = numeral.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: `translateY(${shift * 18}%)` },
      ],
      { duration: 380, easing: easeIn, fill: "forwards" },
    )
    exit.finished.then(
      () => {
        numeral.textContent = label
        exit.cancel()
        numeral.animate(
          [
            { opacity: 0, transform: `translateY(${-shift * 18}%)` },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 900, easing: easeOut },
        )
      },
      () => {},
    )
  }

  async function transitionTo(nextIndex, direction) {
    if (nextIndex === currentIndex) return

    currentIndex = nextIndex
    const token = ++transitionToken
    const nextSection = contentSections[nextIndex]
    const leavingSection = displayedSection
    const interruptedExit = leavingSection.classList.contains("is-leaving")
    updateChapter(nextIndex, direction)
    cancelRunningAnimations()

    if (reducedMotion.matches) {
      showSection(nextSection)
      return
    }

    sweepKeys(direction)
    if (leavingSection !== nextSection && !interruptedExit) {
      leavingSection.classList.remove("is-active")
      leavingSection.classList.add("is-leaving")
      await settle(revealOut(leavingSection, direction))
      if (token !== transitionToken) return
      cancelRunningAnimations()
    }

    showSection(nextSection)
    revealIn(nextSection, direction)
  }

  function indexFromScroll() {
    const index = Math.round(scrollY / innerHeight)
    return Math.min(snapSections.length - 1, Math.max(0, index))
  }

  function releaseScrollTarget() {
    if (scrollTarget === undefined) return
    scrollTarget = undefined
    scope.clearTimeout(scrollTargetTimer)
    const index = indexFromScroll()
    void transitionTo(index, index > currentIndex ? "down" : "up")
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (scrollTarget !== undefined) return
      const visibleEntries = entries.filter(
        (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5,
      )
      if (visibleEntries.length === 0) return

      const nextIndex = snapSections.indexOf(
        visibleEntries.reduce((mostVisible, entry) =>
          entry.intersectionRatio > mostVisible.intersectionRatio ? entry : mostVisible,
        ).target,
      )
      const direction = nextIndex > currentIndex ? "down" : "up"
      void transitionTo(nextIndex, direction)
    },
    { threshold: [0.5] },
  )

  scope.observe(observer)
  snapSections.forEach((section) => observer.observe(section))

  // Chapter links jump straight to their target; intermediate sections passed while scrolling are not replayed.
  chapterLinks.forEach((link) =>
    scope.listen(link, "click", (event) => {
      const index = Number(link.dataset.chapterLink)
      const target = snapSections[index]
      if (!target) return

      event.preventDefault()
      scrollTarget = index
      scope.clearTimeout(scrollTargetTimer)
      scrollTargetTimer = scope.timeout(releaseScrollTarget, 1600)
      void transitionTo(index, index > currentIndex ? "down" : "up")
      target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" })
      if (Math.abs(target.getBoundingClientRect().top) < 1) releaseScrollTarget()
    }),
  )
  scope.listen(window, "scrollend", releaseScrollTarget)

  scope.cleanup(() => {
    transitionToken++
    cancelRunningAnimations()
    for (const element of [...contentSections, ...sectionKeys, numeral]) {
      element?.getAnimations({ subtree: true }).forEach((animation) => animation.cancel())
    }
  })
  const initialIndex = indexFromScroll()
  currentIndex = initialIndex
  showSection(contentSections[initialIndex])
  updateChapter(initialIndex, "down")
  // During a ClientRouter arrival the iris already reveals a snapshot of the finished page; replaying
  // the reveal on the live DOM underneath would jump back to half-hidden rows when the snapshot ends.
  const arrivingThroughTransition = document.documentElement.hasAttribute("data-astro-transition")
  if (!reducedMotion.matches && !arrivingThroughTransition) {
    // On a first visit the reveal waits for the loader to lift; beneath it the reveal would play unseen.
    let live = true
    scope.cleanup(() => (live = false))
    void pageEntryRevealing.then(() => {
      if (live) revealIn(contentSections[initialIndex], "down")
    })
  }
})

onPageLoad((scope) => {
  const maxConnectionLines = 7
  const mainContent = document.querySelector(".main-content")
  const signatureCircles = Array.from(
    document.querySelectorAll(".main-content .circles-grid .circle"),
  )
  const attractionLines = Array.from(document.querySelectorAll(".circle-attraction-line"))
  if (
    !mainContent ||
    signatureCircles.length === 0 ||
    attractionLines.length !== maxConnectionLines
  )
    return

  const interactivePointer = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 901px)")
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
  const influenceDistance = 96
  const maximumPull = 12
  const lineTurnoverInterval = 500
  const minimumBreakChance = 0.01
  const distanceBreakChance = 0.12
  const minimumFadeDuration = 140
  const maximumFadeDuration = 420
  const pointer = { x: 0, y: 0, present: false }
  const circleStates = signatureCircles.map((element, index) => ({
    index,
    element,
    x: 0,
    y: 0,
    baseX: 0,
    baseY: 0,
    radius: 0,
    distance: 0,
    edgeDistance: Infinity,
    proximity: 0,
    glow: 0,
    attracted: false,
    lineEligible: false,
  }))
  const lineSlots = attractionLines.map((element) => ({
    element,
    owner: undefined,
    opacity: 0,
    baseOpacity: 0.25,
  }))
  const fadingLines = []
  let animationFrame = 0
  let lastFrameTime = performance.now()
  let nextLineTurnoverAt = 0
  let lineTurnoverTimer = 0

  function canInteract() {
    return (
      pointer.present &&
      interactivePointer.matches &&
      !reducedMotion.matches &&
      mainContent.classList.contains("is-active") &&
      !mainContent.hidden &&
      !document.hidden
    )
  }

  function requestAttractionFrame() {
    if (!animationFrame) animationFrame = scope.frame(animateAttraction)
  }

  function cancelLineTurnover() {
    if (lineTurnoverTimer) scope.clearTimeout(lineTurnoverTimer)
    lineTurnoverTimer = 0
    nextLineTurnoverAt = 0
  }

  function scheduleLineTurnover(time) {
    if (lineTurnoverTimer) return
    const delay = Math.max(0, nextLineTurnoverAt - time)
    lineTurnoverTimer = scope.timeout(() => {
      lineTurnoverTimer = 0
      requestAttractionFrame()
    }, delay)
  }
  function clearFadingLines() {
    for (const fadingLine of fadingLines) fadingLine.element.remove()
    fadingLines.length = 0
  }

  function clearLineSlot(slot) {
    slot.owner = undefined
    slot.opacity = 0
    slot.baseOpacity = 0.25
    slot.element.style.opacity = "0"
    slot.element.removeAttribute("data-circle-index")
  }

  function releaseLineSlot(slot) {
    if (!slot.owner) return

    if (slot.opacity > 0.005) {
      const element = slot.element.cloneNode(false)
      element.style.opacity = slot.opacity.toFixed(3)
      element.removeAttribute("data-circle-index")
      slot.element.parentNode?.appendChild(element)
      const opacityRatio = Math.max(0, Math.min(1, (slot.baseOpacity - 0.25) / 0.5))
      const duration =
        minimumFadeDuration + opacityRatio * (maximumFadeDuration - minimumFadeDuration)
      fadingLines.push({
        element,
        opacity: slot.opacity,
        startOpacity: slot.opacity,
        elapsed: 0,
        duration,
      })
    }

    clearLineSlot(slot)
  }

  function assignLineSlot(slot, owner) {
    slot.owner = owner
    slot.opacity = 0
    slot.element.style.opacity = "0"
    slot.baseOpacity = 0.25 + owner.proximity * 0.5
    slot.element.dataset.circleIndex = String(owner.index)
  }

  function updateAttractedCircles() {
    const enabled = canInteract()

    for (const state of circleStates) {
      state.attracted = false
      state.lineEligible = false
      state.proximity = 0
      state.edgeDistance = Infinity
      if (!enabled || state.element.hidden) continue

      const rect = state.element.getBoundingClientRect()
      if (rect.width === 0) continue

      state.baseX = rect.left + rect.width / 2 - state.x
      state.baseY = rect.top + rect.height / 2 - state.y
      state.radius = rect.width / 2
      const deltaX = pointer.x - state.baseX
      const deltaY = pointer.y - state.baseY
      state.distance = Math.hypot(deltaX, deltaY)
      state.edgeDistance = Math.max(0, state.distance - state.radius)

      if (state.edgeDistance <= influenceDistance) {
        state.attracted = true
        state.proximity = 1 - state.edgeDistance / influenceDistance
        state.lineEligible = state.edgeDistance > 0
      }
    }
  }
  function hasLineAvailableArea() {
    return circleStates.some((state) => state.lineEligible)
  }

  function updateLineAssignments(time) {
    const pointerOutsideLineArea = !hasLineAvailableArea()
    if (pointerOutsideLineArea) clearFadingLines()

    for (const slot of lineSlots) {
      if (!slot.owner || slot.owner.lineEligible) continue
      if (pointerOutsideLineArea) clearLineSlot(slot)
      else releaseLineSlot(slot)
    }

    const eligibleCircles = circleStates.filter((state) => state.lineEligible)
    const assignedCircles = new Set(lineSlots.map((slot) => slot.owner).filter(Boolean))
    const waitingCircles = eligibleCircles
      .filter((state) => !assignedCircles.has(state))
      .sort((first, second) => first.distance - second.distance)

    for (const slot of lineSlots) {
      if (slot.owner || waitingCircles.length === 0) continue
      assignLineSlot(slot, waitingCircles.shift())
    }

    const overCapacity = eligibleCircles.length > maxConnectionLines
    if (!overCapacity) {
      cancelLineTurnover()
      return
    }

    if (!nextLineTurnoverAt) nextLineTurnoverAt = time + lineTurnoverInterval
    if (time >= nextLineTurnoverAt) {
      const currentOwners = new Set(lineSlots.map((slot) => slot.owner).filter(Boolean))
      const currentWaitingCircles = eligibleCircles.filter((state) => !currentOwners.has(state))
      const breakableSlots = lineSlots.filter((slot) => {
        if (!slot.owner) return false
        const distanceRatio = Math.min(1, slot.owner.edgeDistance / influenceDistance)
        const breakChance = minimumBreakChance + distanceBreakChance * distanceRatio * distanceRatio
        return Math.random() < breakChance
      })

      if (breakableSlots.length > 0 && currentWaitingCircles.length > 0) {
        const slot = breakableSlots[Math.floor(Math.random() * breakableSlots.length)]
        const nextOwner =
          currentWaitingCircles[Math.floor(Math.random() * currentWaitingCircles.length)]
        releaseLineSlot(slot)
        assignLineSlot(slot, nextOwner)
      }

      nextLineTurnoverAt = time + lineTurnoverInterval
    }

    scheduleLineTurnover(time)
  }

  function animateAttraction(time) {
    animationFrame = 0
    updateAttractedCircles()
    updateLineAssignments(time)

    const elapsed = Math.min(50, time - lastFrameTime)
    lastFrameTime = time
    const attractionBlend = 1 - Math.exp(-elapsed * 0.018)
    const returnBlend = 1 - Math.exp(-elapsed * 0.012)
    let animationOngoing = false

    for (const state of circleStates) {
      let targetX = 0
      let targetY = 0

      if (state.attracted && state.distance > 0.001) {
        const pull = Math.min(
          maximumPull * state.proximity * state.proximity,
          state.distance * 0.55,
        )
        targetX = ((pointer.x - state.baseX) / state.distance) * pull
        targetY = ((pointer.y - state.baseY) / state.distance) * pull
      }

      const blend = state.attracted ? attractionBlend : returnBlend
      const nextX = state.x + (targetX - state.x) * blend
      const nextY = state.y + (targetY - state.y) * blend
      const settled = Math.abs(nextX - targetX) < 0.01 && Math.abs(nextY - targetY) < 0.01

      state.x = settled ? targetX : nextX
      state.y = settled ? targetY : nextY
      if (state.x === 0 && state.y === 0) {
        state.element.style.removeProperty("translate")
      } else {
        state.element.style.translate = `${state.x.toFixed(2)}px ${state.y.toFixed(2)}px`
      }

      if (!settled) animationOngoing = true

      // Nearby dots swell and deepen towards $light-blue (`--glow`, 0–1), easing like the pull.
      const targetGlow = state.attracted ? state.proximity : 0
      state.glow +=
        (targetGlow - state.glow) * (targetGlow > state.glow ? attractionBlend : returnBlend)
      if (Math.abs(state.glow - targetGlow) < 0.005) state.glow = targetGlow
      else animationOngoing = true
      if (state.glow === 0) state.element.style.removeProperty("--glow")
      else state.element.style.setProperty("--glow", state.glow.toFixed(3))
    }

    for (const slot of lineSlots) {
      const owner = slot.owner
      const targetOpacity = owner ? 0.25 + owner.proximity * 0.5 : 0
      if (owner) slot.baseOpacity = targetOpacity
      const blend = targetOpacity > slot.opacity ? attractionBlend : returnBlend
      slot.opacity += (targetOpacity - slot.opacity) * blend
      const settled = Math.abs(slot.opacity - targetOpacity) < 0.005
      if (settled) slot.opacity = targetOpacity

      let lineVisible = false
      if (owner) {
        const circleX = owner.baseX + owner.x
        const circleY = owner.baseY + owner.y
        const deltaX = pointer.x - circleX
        const deltaY = pointer.y - circleY
        const distance = Math.hypot(deltaX, deltaY)
        const directionX = distance > 0.001 ? deltaX / distance : 0
        const directionY = distance > 0.001 ? deltaY / distance : 0
        const startDistance = Math.min(owner.radius, distance)
        lineVisible = distance > startDistance

        slot.element.setAttribute("x1", String(circleX + directionX * startDistance))
        slot.element.setAttribute("y1", String(circleY + directionY * startDistance))
        slot.element.setAttribute("x2", String(pointer.x))
        slot.element.setAttribute("y2", String(pointer.y))
      }

      slot.element.style.opacity = lineVisible ? slot.opacity.toFixed(3) : "0"
      if (!settled) animationOngoing = true
    }

    for (let index = fadingLines.length - 1; index >= 0; index--) {
      const fadingLine = fadingLines[index]
      fadingLine.elapsed += elapsed
      const progress = Math.min(1, fadingLine.elapsed / fadingLine.duration)
      fadingLine.opacity = fadingLine.startOpacity * (1 - progress) ** 2
      if (progress >= 1 || fadingLine.opacity < 0.005) {
        fadingLine.element.remove()
        fadingLines.splice(index, 1)
      } else {
        fadingLine.element.style.opacity = fadingLine.opacity.toFixed(3)
        animationOngoing = true
      }
    }

    if (animationOngoing) requestAttractionFrame()
  }

  function releaseAttraction() {
    pointer.present = false
    requestAttractionFrame()
  }

  scope.listen(
    document,
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") {
        releaseAttraction()
        return
      }

      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.present = true
      requestAttractionFrame()
    },
    { passive: true },
  )
  scope.listen(document.documentElement, "mouseleave", releaseAttraction)
  scope.listen(window, "blur", releaseAttraction)
  scope.listen(window, "resize", requestAttractionFrame)
  scope.listen(interactivePointer, "change", releaseAttraction)
  scope.listen(reducedMotion, "change", releaseAttraction)
  scope.listen(document, "visibilitychange", () => {
    if (document.hidden) releaseAttraction()
  })
  scope.cleanup(() => {
    cancelLineTurnover()
    clearFadingLines()
  })
  const attractionObserver = new MutationObserver(requestAttractionFrame)
  scope.observe(attractionObserver)
  attractionObserver.observe(mainContent, {
    attributes: true,
    attributeFilter: ["class", "hidden"],
  })
})

// Signature dots, beyond the pull and lines above: a press on the grid sends a ripple out from the nearest
// dot, and while the pointer stays away a faint wave crosses the columns now and then, like the coda keys.
// The section ignores pointer events (see the attraction above), so presses are matched against the
// dots' boxes.
onPageLoad((scope) => {
  const mainContent = document.querySelector(".main-content")
  const grid = mainContent?.querySelector(".circles-grid")
  const circles = Array.from(grid?.querySelectorAll(".circle") ?? [])
  if (!mainContent || !grid || circles.length === 0) return
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
  const idleInterval = 7000
  const idleAfter = 4000 // ms since the pointer was last near the grid
  const waves = []
  let frame = 0
  let lastNear = -Infinity

  const showing = () =>
    !reducedMotion.matches &&
    !document.hidden &&
    !mainContent.hidden &&
    mainContent.classList.contains("is-active")

  const dots = () =>
    circles
      .filter((element) => !element.hidden)
      .map((element) => {
        const box = element.getBoundingClientRect()
        return { element, x: box.left + box.width / 2, y: box.top + box.height / 2 }
      })

  const nearGrid = (x, y, margin) => {
    const box = grid.getBoundingClientRect()
    return (
      x >= box.left - margin &&
      x <= box.right + margin &&
      y >= box.top - margin &&
      y <= box.bottom + margin
    )
  }

  // Centre-to-centre distance between neighbouring dots, the unit for ripple and wave delays.
  const spacingOf = (list) => {
    const [first, second] = list
    return second ? Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)) : 1
  }

  const ease = (t) => (1 - Math.cos(Math.PI * t)) / 2
  // A dot's swell over its own run (0–1): up for the first 30%, then back down.
  const swell = (t) => (t < 0.3 ? ease(t / 0.3) : 1 - ease((t - 0.3) / 0.7))

  // Each wave keeps its own clock, so a new press never restarts the waves still crossing the grid. A dot
  // takes the strongest tint among the waves passing it (`--wave`) and the strongest swell among the waves
  // that swell (`--wave-scale`; ripples do not), both added to the glow in `index.astro`, and shows every
  // wave's ring at once (`box-shadow`, $light-blue).
  const render = (now) => {
    frame = 0
    for (const element of circles) {
      let tint = 0
      let swellPeak = 0
      const rings = []
      for (const wave of waves) {
        const step = wave.steps.get(element)
        if (!step) continue
        const t = (now - wave.start - step.delay) / wave.duration
        if (t <= 0 || t >= 1) continue
        const shape = swell(t)
        tint = Math.max(tint, step.tint * shape)
        if (wave.scales) swellPeak = Math.max(swellPeak, step.strength * shape)
        const spread = ease(t)
        rings.push(
          `0 0 0 ${(step.strength * 10 * spread).toFixed(2)}px rgba(162, 169, 211, ${(0.5 * step.strength * (1 - spread)).toFixed(3)})`,
        )
      }
      if (tint > 0) element.style.setProperty("--wave", tint.toFixed(3))
      else element.style.removeProperty("--wave")
      if (swellPeak > 0) element.style.setProperty("--wave-scale", swellPeak.toFixed(3))
      else element.style.removeProperty("--wave-scale")
      if (rings.length) element.style.boxShadow = rings.join(", ")
      else element.style.removeProperty("box-shadow")
    }
    for (let index = waves.length - 1; index >= 0; index--) {
      if (now >= waves[index].end) waves.splice(index, 1)
    }
    if (waves.length) frame = scope.frame(render)
  }

  // `steps` maps each dot to its delay (ms), strength (0–1: swell and ring), and tint (0–1: how far its
  // colour runs to $light-blue) in this wave; `scales` lets it swell the dots.
  const launch = (steps, duration, scales) => {
    const start = performance.now()
    const longest = Math.max(...Array.from(steps.values(), (step) => step.delay))
    waves.push({ steps, duration, scales, start, end: start + longest + duration })
    if (!frame) frame = scope.frame(render)
  }

  scope.listen(
    document,
    "pointermove",
    (event) => {
      if (nearGrid(event.clientX, event.clientY, 48)) lastNear = performance.now()
    },
    { passive: true },
  )

  // Slow and soft: 120ms per dot of distance, 1.6s per dot, fading from 0.5 at the origin to 0.12.
  scope.listen(document, "pointerdown", (event) => {
    if (event.button !== 0 || !showing() || !nearGrid(event.clientX, event.clientY, 24)) return
    lastNear = performance.now()
    const list = dots()
    if (list.length === 0) return
    const spacing = spacingOf(list)
    const origin = list.reduce((best, dot) =>
      Math.hypot(dot.x - event.clientX, dot.y - event.clientY) <
      Math.hypot(best.x - event.clientX, best.y - event.clientY)
        ? dot
        : best,
    )
    const steps = new Map()
    for (const dot of list) {
      const distance = Math.hypot(dot.x - origin.x, dot.y - origin.y) / spacing
      steps.set(dot.element, {
        delay: distance * 120,
        strength: Math.max(0.12, 0.5 - distance * 0.06),
        tint: Math.max(0.45, 1 - distance * 0.08),
      })
    }
    launch(steps, 1600, false)
  })

  const idleWave = () => {
    if (showing() && performance.now() - lastNear > idleAfter) {
      const list = dots()
      if (list.length > 0) {
        const spacing = spacingOf(list)
        const left = Math.min(...list.map((dot) => dot.x))
        const top = Math.min(...list.map((dot) => dot.y))
        const steps = new Map()
        for (const dot of list) {
          const column = Math.round((dot.x - left) / spacing)
          const row = Math.round((dot.y - top) / spacing)
          steps.set(dot.element, { delay: column * 150 + row * 70, strength: 0.18, tint: 0.6 })
        }
        launch(steps, 1800, true)
      }
    }
    scope.timeout(idleWave, idleInterval)
  }
  void pageEntryRevealing.then(() => scope.timeout(idleWave, idleInterval / 2))

  scope.cleanup(() => {
    waves.length = 0
    for (const element of circles) {
      element.style.removeProperty("--wave")
      element.style.removeProperty("--wave-scale")
      element.style.removeProperty("box-shadow")
    }
  })
})

// Coda piano: an occasional left-to-right wave over the white keys. Hovering lets the current pass
// finish but holds further passes until the pointer leaves.
onPageLoad((scope) => {
  const keys = document.querySelector(".coda-keys")
  const whites = keys?.querySelectorAll(".coda-white")
  if (!keys || !whites?.length) return
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const interval = 3000
  let waiting = false

  const play = () => {
    if (keys.matches(":hover")) {
      waiting = true
      return
    }
    keys.classList.remove("is-waving")
    void keys.offsetWidth // restart the CSS animation
    keys.classList.add("is-waving")
  }
  scope.listen(whites[whites.length - 1], "animationend", () => {
    keys.classList.remove("is-waving")
    scope.timeout(play, interval)
  })
  scope.listen(keys, "pointerleave", () => {
    if (!waiting) return
    waiting = false
    scope.timeout(play, interval / 3)
  })
  scope.timeout(play, 2000)
  scope.cleanup(() => keys.classList.remove("is-waving"))
})
