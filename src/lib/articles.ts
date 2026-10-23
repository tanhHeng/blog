import type { MarkdownInstance } from "astro"

interface ArticleFrontmatter {
  title: string
  date: string | Date
  tags?: string[]
  description?: string
  readingTime?: string
  wordCount?: number | string
}

const modules = import.meta.glob<MarkdownInstance<ArticleFrontmatter>>("../pages/articles/*.md", {
  eager: true,
})
const titleOrder = new Intl.Collator("en", { numeric: true })

function estimateReadingMinutes(article: MarkdownInstance<ArticleFrontmatter>) {
  const wordCount = Number(article.frontmatter.wordCount)
  if (!Number.isFinite(wordCount) || wordCount <= 0) return undefined

  const body = article.rawContent()
  const cjk =
    body.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length ?? 0
  const words = body.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length ?? 0
  return Math.max(1, Math.ceil(wordCount / (cjk >= words ? 400 : 200)))
}

/**
 * Markdown articles under `src/pages/articles/`, newest first.
 * Throws at build time when an article lacks a valid `date` or page URL.
 * `tags` maps lowercase keys to the first-seen label, so duplicate tags collapse.
 */
export const articles = Object.values(modules)
  .map((article) => {
    const { frontmatter } = article
    const date =
      frontmatter.date instanceof Date
        ? frontmatter.date.toISOString().slice(0, 10)
        : String(frontmatter.date ?? "").slice(0, 10)
    const timestamp = Date.parse(date)
    if (!Number.isFinite(timestamp)) {
      throw new Error(`Article ${article.file} requires a valid date.`)
    }
    if (!article.url) {
      throw new Error(`Article ${article.file} has no page URL.`)
    }

    const tags = new Map<string, string>()
    for (const value of frontmatter.tags ?? []) {
      const label = value.trim()
      const key = label.toLowerCase()
      if (label && !tags.has(key)) tags.set(key, label)
    }

    return {
      title: frontmatter.title,
      url: article.url,
      date,
      timestamp,
      tags,
      description: frontmatter.description?.trim(),
      readingTime: frontmatter.readingTime?.trim(),
      estimatedMinutes: estimateReadingMinutes(article),
    }
  })
  .sort(
    (a, b) =>
      b.timestamp - a.timestamp ||
      titleOrder.compare(a.title, b.title) ||
      titleOrder.compare(a.url, b.url),
  )

export { titleOrder }
