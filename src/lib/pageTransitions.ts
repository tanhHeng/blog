export type PageTransitionVariant = "home" | "article" | "novel"

export interface PageTransition {
  variant: PageTransitionVariant
  kicker?: string
  numeral?: string
  caption?: string
  lines?: string[]
}

/** The About page's motto, shown on the page and on its transition veil. */
export const motto = "风雪拂枕，北星饮尘。"

/** Route key for the table below: the pathname without a trailing slash (`/` for the root). */
export function routePath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/"
}

/**
 * Veil variant and text for every route, keyed by `routePath`. The coordinator starts the cover before
 * the next page is fetched, so the veil text comes from this table (serialized into every page by
 * `BaseLayout`) rather than from the incoming document. Routes not listed get the plain fade.
 * Takes the article list as an argument: importing `lib/articles` here would evaluate every article
 * module from `BaseLayout`, which articles themselves import.
 */
export function routeTransitions(
  articles: readonly { url: string; date: string; title: string }[],
): Record<string, PageTransition> {
  const count = articles.length
  const routes: Record<string, PageTransition> = {
    "/": { variant: "home", kicker: "TANH.MOE", lines: ["Life is Piano.", "You are Pianist."] },
    "/about": { variant: "article", kicker: "关于", numeral: "tanh丶桁", caption: motto },
    "/articles": {
      variant: "article",
      kicker: "Archive",
      numeral: String(count).padStart(2, "0"),
      caption: `${count} ${count === 1 ? "article" : "articles"}`,
    },
    "/novel": { variant: "novel", lines: ["星与月交响的诗篇，", "书写、兴与落轮转的流连"] },
  }
  for (const article of articles) {
    routes[routePath(article.url)] = {
      variant: "article",
      kicker: "Article",
      numeral: article.date.replaceAll("-", "."),
      caption: article.title,
    }
  }
  return routes
}
