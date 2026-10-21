import type { TransitionAnimationPair, TransitionAnimationValue } from 'astro';

/**
 * Cross-document view transitions (`@view-transition` in `global.scss`) are styled by the page being
 * entered, so each variant describes how its own page arrives and how the previous page leaves.
 * Keyframe names live in `PageTransitionVeil.astro`; the veil timings there are tuned to these durations.
 */
export type PageTransitionVariant = 'home' | 'article' | 'novel';

export interface PageTransition {
  variant: PageTransitionVariant;
  /** Small caps label above the numeral (article). */
  kicker?: string;
  /** Digits that rise one by one (article). */
  numeral?: string;
  /** Line under the numeral (article). */
  caption?: string;
  /** Lines revealed one by one on the mist veil (novel). */
  lines?: string[];
}

const easeInOut = 'cubic-bezier(0.65, 0, 0.35, 1)';
const easeIn = 'cubic-bezier(0.55, 0, 0.75, 0.2)';

const pairs: Record<PageTransitionVariant, TransitionAnimationPair> = {
  // Old page recedes; the home page opens as an iris from the brand circles at the centre.
  home: {
    old: { name: 'vt-recede', duration: '600ms', easing: easeIn, fillMode: 'both' },
    new: { name: 'vt-iris', duration: '1100ms', delay: '200ms', easing: easeInOut, fillMode: 'both' },
  },
  // Old page lifts away like a turned leaf; the article page is wiped in from the bottom edge.
  article: {
    old: { name: 'vt-lift', duration: '650ms', easing: easeIn, fillMode: 'both' },
    new: { name: 'vt-wipe-up', duration: '950ms', delay: '350ms', easing: easeInOut, fillMode: 'both' },
  },
  // Old page washes out into a white mist; the novel stays hidden until the mist covers the screen,
  // then waits underneath until the mist thins over its opening.
  novel: {
    old: { name: 'vt-mist-fade', duration: '600ms', easing: 'ease', fillMode: 'both' },
    new: { name: 'vt-under-veil', duration: '1700ms', easing: 'linear', fillMode: 'both' },
  },
};

/** Root (`<html>`) animation per variant; without a router only `forwards` ever applies. */
export const rootTransitions: Record<PageTransitionVariant, TransitionAnimationValue> = {
  home: { forwards: pairs.home, backwards: pairs.home },
  article: { forwards: pairs.article, backwards: pairs.article },
  novel: { forwards: pairs.novel, backwards: pairs.novel },
};
