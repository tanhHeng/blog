import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';

export interface PageScope {
  listen<K extends keyof GlobalEventHandlersEventMap>(target: EventTarget, type: K, listener: (event: GlobalEventHandlersEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  listen(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  observe(observer: { disconnect(): void }): void;
  timeout(callback: () => void, delay: number): number;
  frame(callback: FrameRequestCallback): number;
  cancelFrame(id: number): void;
  clearTimeout(id: number): void;
  cleanup(callback: () => void): void;
}

type Initializer = (scope: PageScope) => void;
type BeforeSwapHandler = (event: TransitionBeforeSwapEvent) => void;

const initializers = new Set<Initializer>();
const beforeSwapHandlers = new Set<BeforeSwapHandler>();
let activeCleanups: (() => void)[] = [];
let installed = false;

function installLifecycle() {
  if (installed) return;
  installed = true;

  document.addEventListener('astro:before-swap', (event) => {
    for (const cleanup of activeCleanups.reverse()) cleanup();
    activeCleanups = [];
    for (const handler of beforeSwapHandlers) handler(event);
  });

  document.addEventListener('astro:page-load', () => {
    for (const initialize of initializers) {
      const scope = createPageScope();
      activeCleanups.push(() => scope.dispose());
      try {
        initialize(scope);
      } catch (error) {
        scope.dispose();
        console.error('Page initialization failed:', error);
      }
    }
  });
}

function createPageScope() {
  const controller = new AbortController();
  const observers = new Set<{ disconnect(): void }>();
  const timers = new Set<number>();
  const frames = new Set<number>();
  const cleanups: (() => void)[] = [];
  let disposed = false;

  const scope: PageScope & { dispose(): void } = {
    listen(target: EventTarget, type: string, listener: ((event: never) => void) | EventListenerObject, options: boolean | AddEventListenerOptions = {}) {
      const normalized = typeof options === 'boolean'
        ? { capture: options, signal: controller.signal }
        : { ...options, signal: controller.signal };
      target.addEventListener(type, listener as EventListenerOrEventListenerObject, normalized);
    },
    observe(observer) {
      observers.add(observer);
    },
    timeout(callback, delay) {
      let id = 0;
      id = window.setTimeout(() => {
        timers.delete(id);
        if (!disposed) callback();
      }, delay);
      timers.add(id);
      return id;
    },
    clearTimeout(id) {
      window.clearTimeout(id);
      timers.delete(id);
    },
    frame(callback) {
      let id = 0;
      id = window.requestAnimationFrame((time) => {
        frames.delete(id);
        if (!disposed) callback(time);
      });
      frames.add(id);
      return id;
    },
    cancelFrame(id) {
      window.cancelAnimationFrame(id);
      frames.delete(id);
    },
    cleanup(callback) {
      cleanups.push(callback);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      for (const observer of observers) observer.disconnect();
      for (const timer of timers) window.clearTimeout(timer);
      for (const frame of frames) window.cancelAnimationFrame(frame);
      for (const cleanup of cleanups.reverse()) cleanup();
    },
  };

  return scope;
}

export function onPageLoad(initialize: Initializer) {
  installLifecycle();
  initializers.add(initialize);
}

export function onBeforeSwap(handler: BeforeSwapHandler) {
  installLifecycle();
  beforeSwapHandlers.add(handler);
}
