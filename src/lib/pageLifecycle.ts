import type { TransitionBeforeSwapEvent } from "astro:transitions/client"

export interface PageScope {
  listen<K extends keyof GlobalEventHandlersEventMap>(
    target: EventTarget,
    type: K,
    listener: (event: GlobalEventHandlersEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
  listen(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  observe(observer: { disconnect(): void }): void
  timeout(callback: () => void, delay: number): number
  /**
   * Runs `callback` in the next animation frame. Every page's frame callbacks share one `requestAnimationFrame`,
   * run by phase: all `"read"` callbacks first, then those without a phase, then all `"write"` callbacks. A
   * callback that only reads layout or computed style should be a `"read"`, one that only writes styles,
   * classes, or attributes a `"write"`: the reads then all see the style the last frame left clean, and the
   * frame recalculates style once instead of after every write followed by a read. A callback requested while
   * the frame runs waits for the next frame, so `"read"` and `"write"` halves of one update are requested
   * together.
   */
  frame(callback: FrameRequestCallback, phase?: FramePhase): number
  cancelFrame(id: number): void
  clearTimeout(id: number): void
  cleanup(callback: () => void): void
}

export type FramePhase = "read" | "write"

type Initializer = (scope: PageScope) => void
type BeforeSwapHandler = (event: TransitionBeforeSwapEvent) => void

const initializers = new Set<Initializer>()
const beforeSwapHandlers = new Set<BeforeSwapHandler>()
let activeCleanups: (() => void)[] = []
let installed = false

// The shared frame: callbacks requested since the last one, by id in request order, and the one in progress.
interface FrameTask {
  callback: FrameRequestCallback
  phase?: FramePhase
}
let pendingFrame = new Map<number, FrameTask>()
let runningFrame = new Map<number, FrameTask>()
let frameRequest = 0
let nextFrameId = 1
const framePhases = ["read", undefined, "write"] as const

function runFrame(time: number) {
  frameRequest = 0
  runningFrame = pendingFrame
  pendingFrame = new Map()
  for (const phase of framePhases) {
    for (const [id, task] of runningFrame) {
      if (task.phase !== phase) continue
      runningFrame.delete(id)
      try {
        task.callback(time)
      } catch (error) {
        reportError(error)
      }
    }
  }
}

function requestFrame(callback: FrameRequestCallback, phase?: FramePhase) {
  const id = nextFrameId++
  pendingFrame.set(id, { callback, phase })
  if (!frameRequest) frameRequest = window.requestAnimationFrame(runFrame)
  return id
}

function cancelFrame(id: number) {
  if (!pendingFrame.delete(id)) runningFrame.delete(id)
}

function installLifecycle() {
  if (installed) return
  installed = true

  document.addEventListener("astro:before-swap", (event) => {
    for (const cleanup of activeCleanups.reverse()) cleanup()
    activeCleanups = []
    for (const handler of beforeSwapHandlers) handler(event)
  })

  document.addEventListener("astro:page-load", () => {
    for (const initialize of initializers) {
      const scope = createPageScope()
      activeCleanups.push(() => scope.dispose())
      try {
        initialize(scope)
      } catch (error) {
        scope.dispose()
        console.error("Page initialization failed:", error)
      }
    }
  })
}

function createPageScope() {
  const controller = new AbortController()
  const observers = new Set<{ disconnect(): void }>()
  const timers = new Set<number>()
  const frames = new Set<number>()
  const cleanups: (() => void)[] = []
  let disposed = false

  const scope: PageScope & { dispose(): void } = {
    listen(
      target: EventTarget,
      type: string,
      listener: ((event: never) => void) | EventListenerObject,
      options: boolean | AddEventListenerOptions = {},
    ) {
      const normalized =
        typeof options === "boolean"
          ? { capture: options, signal: controller.signal }
          : { ...options, signal: controller.signal }
      target.addEventListener(type, listener as EventListenerOrEventListenerObject, normalized)
    },
    observe(observer) {
      observers.add(observer)
    },
    timeout(callback, delay) {
      let id = 0
      id = window.setTimeout(() => {
        timers.delete(id)
        if (!disposed) callback()
      }, delay)
      timers.add(id)
      return id
    },
    clearTimeout(id) {
      window.clearTimeout(id)
      timers.delete(id)
    },
    frame(callback, phase) {
      let id = 0
      id = requestFrame((time) => {
        frames.delete(id)
        if (!disposed) callback(time)
      }, phase)
      frames.add(id)
      return id
    },
    cancelFrame(id) {
      cancelFrame(id)
      frames.delete(id)
    },
    cleanup(callback) {
      cleanups.push(callback)
    },
    dispose() {
      if (disposed) return
      disposed = true
      controller.abort()
      for (const observer of observers) observer.disconnect()
      for (const timer of timers) window.clearTimeout(timer)
      for (const frame of frames) cancelFrame(frame)
      for (const cleanup of cleanups.reverse()) cleanup()
    },
  }

  return scope
}

export function onPageLoad(initialize: Initializer) {
  installLifecycle()
  initializers.add(initialize)
}

export function onBeforeSwap(handler: BeforeSwapHandler) {
  installLifecycle()
  beforeSwapHandlers.add(handler)
}
