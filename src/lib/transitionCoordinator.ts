import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { onBeforeSwap } from './pageLifecycle';
import type { PageTransitionVariant } from './pageTransitions';

type Variant = PageTransitionVariant | 'plain';
interface Transition {
  variant: Variant;
  direction: string;
  veil: HTMLElement;
  animation?: Animation;
  entering?: Promise<void>;
  arriving?: boolean;
  signal: AbortSignal;
}

const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current: Transition | undefined;

function variantFor(url: URL): Variant {
  const path = url.pathname.replace(/\/$/, '') || '/';
  if (path === '/') return 'home';
  if (path === '/novel') return 'novel';
  if (path === '/articles' || path.startsWith('/articles/')) return 'article';
  return 'plain';
}

function reset(transition: Transition) {
  const isCurrent = current === transition;
  transition.animation?.cancel();
  if (isCurrent) {
    transition.veil.getAnimations().forEach((animation) => animation.cancel());
    transition.veil.dataset.phase = 'idle';
    transition.veil.style.removeProperty('clip-path');
    transition.veil.style.removeProperty('opacity');
    transition.veil.style.removeProperty('filter');
    current = undefined;
  }
}

function populate(transition: Transition, incoming: Document) {
  const { veil } = transition;
  const data = incoming.documentElement.dataset;
  const variant = data.transitionVariant;
  transition.variant = variant === 'home' || variant === 'article' || variant === 'novel' ? variant : 'plain';
  veil.dataset.variant = transition.variant;
  veil.querySelector<HTMLElement>('[data-veil-kicker]')!.textContent = data.transitionKicker ?? '';
  const numeral = veil.querySelector<HTMLElement>('[data-veil-numeral]')!;
  if (numeral.textContent !== (data.transitionNumeral ?? '')) {
    numeral.replaceChildren(...[...(data.transitionNumeral ?? '')].map((char, index) => {
      const digit = document.createElement('span');
      digit.textContent = char;
      const offset = transition.direction === 'back' ? '-0.45em' : '0.45em';
      digit.animate([
        { opacity: 0, transform: `translateY(${offset})` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 620, delay: index * 45, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
      return digit;
    }));
  }
  veil.querySelector<HTMLElement>('[data-veil-caption]')!.textContent = data.transitionCaption ?? '';
  const lines: string[] = JSON.parse(data.transitionLines ?? '[]');
  veil.querySelectorAll<HTMLElement>('[data-veil-line]').forEach((line, index) => {
    line.hidden = index >= lines.length;
    line.textContent = lines[index] ?? '';
  });
}

// Novel and plain veils animate opacity only, which stays on the compositor; animating `filter`
// repaints the full-screen mist every frame over the novel's video and stutters as the reveal ends.
function frames(variant: Variant, direction: string, entering: boolean): Keyframe[] {
  if (variant === 'novel' || variant === 'plain') {
    return entering ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
  }
  const hidden = variant === 'home'
    ? { opacity: 1, clipPath: 'circle(0 at 50% 50%)' }
    : { opacity: 1, clipPath: (direction === 'back') !== entering ? 'inset(100% 0 0)' : 'inset(0 0 100% 0)' };
  const covered = variant === 'home' ? { opacity: 1, clipPath: 'circle(75vmax at 50% 50%)' } : { opacity: 1, clipPath: 'inset(0)' };
  return entering ? [hidden, covered] : [covered, hidden];
}

async function play(transition: Transition, entering: boolean) {
  const { veil, variant, direction } = transition;
  const duration = entering
    ? variant === 'novel' ? 620 : variant === 'article' ? 520 : variant === 'home' ? 460 : 240
    : variant === 'novel' ? 1100 : variant === 'article' ? 780 : variant === 'home' ? 760 : 240;
  const previous = transition.animation;
  const animation = veil.animate(frames(variant, direction, entering), {
    duration,
    easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
    fill: 'forwards',
  });
  transition.animation = animation;
  previous?.cancel();
  await animation.finished.catch(() => undefined);
}

document.addEventListener('astro:before-preparation', (event: TransitionBeforePreparationEvent) => {
  if (current) reset(current);
  if (motion.matches) return;
  const veil = document.querySelector<HTMLElement>('[data-transition-veil]');
  if (!veil) return;
  const transition: Transition = { variant: variantFor(event.to), direction: event.direction, veil, signal: event.signal };
  current = transition;
  veil.dataset.variant = transition.variant;
  veil.dataset.direction = transition.direction;
  event.signal.addEventListener('abort', () => { if (current === transition) reset(transition); }, { once: true });

  // Home opens through the root view-transition iris (`homeRootTransition`); swap as soon as it loads.
  if (transition.variant === 'home') return;

  veil.dataset.phase = 'covering';
  veil.querySelectorAll<HTMLElement>('[data-veil-kicker], [data-veil-numeral], [data-veil-caption], [data-veil-line]').forEach((element) => { element.textContent = ''; });

  // Fetch and cover concurrently; never swap an uncovered page, even when loading is cached.
  const loader = event.loader;
  event.loader = async () => {
    try {
      transition.entering = play(transition, true);
      await Promise.all([
        loader().then(() => {
          if (current === transition && !event.defaultPrevented) populate(transition, event.newDocument);
        }),
        transition.entering,
      ]);
      if (event.defaultPrevented || event.signal.aborted) reset(transition);
    } catch (error) {
      if (current === transition) reset(transition);
      throw error;
    }
  };
});

onBeforeSwap((event) => {
  const activeHref = event.newDocument.querySelector<HTMLAnchorElement>('#site-navbar .nav-link.active')?.getAttribute('href');
  document.querySelectorAll<HTMLAnchorElement>('#site-navbar .nav-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === activeHref);
  });
  if (!current) return;
  if (current.variant === 'home') {
    const transition = current;
    transition.veil.dataset.phase = 'iris';
    window.setTimeout(() => { if (current === transition) reset(transition); }, 1500);
    return;
  }
  populate(current, event.newDocument);
});

document.addEventListener('astro:page-load', () => {
  const transition = current;
  if (!transition) return;
  if (motion.matches || transition.signal.aborted) {
    reset(transition);
    return;
  }
  if (transition.arriving || transition.variant === 'home') return;
  transition.arriving = true;
  transition.veil.dataset.phase = 'revealing';
  void transition.entering?.then(() => {
    if (current !== transition || transition.signal.aborted) return;
    return play(transition, false);
  }).then(() => {
    if (current === transition) reset(transition);
  });
});
