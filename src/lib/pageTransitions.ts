export type PageTransitionVariant = 'home' | 'article' | 'novel';

export interface PageTransition {
  variant: PageTransitionVariant;
  kicker?: string;
  numeral?: string;
  caption?: string;
  lines?: string[];
}
