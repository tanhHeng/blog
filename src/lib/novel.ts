import type { MarkdownInstance } from "astro"

/**
 * The novel lives in `src/novel/` as one Markdown file per part, each with a frontmatter header:
 * `index.md` (book `title`, `tagline`), `prologue.md` (`title`), `volume-NN/chapter-NN.md` (`title`,
 * `volume`, `chapter` number; `##` headings are its sections), `codex/index.md` (`title`; body is the
 * note), `codex/world.md` (`title`, `label`), and `codex/characters/NN-name.md` (`name`, `affinity`;
 * body is an optional `*epithet*` paragraph, then `label：value` fields and free remarks). File names
 * order the characters; the `chapter` number orders chapters.
 */
type Part = MarkdownInstance<Record<string, unknown>>

const parts = import.meta.glob<Part>("../novel/**/*.md", { eager: true })

interface Block {
  level: number
  title: string
  html: string
  children: Block[]
}

export interface ChapterSection {
  title: string
  html: string
}

export interface Chapter {
  id: string
  volume: string
  number: string
  name: string
  html: string
  sections: ChapterSection[]
}

export interface CharacterField {
  label: string
  html: string
  /** Short values share a grid row; long ones span the card. */
  short: boolean
}

export interface Character {
  id: string
  affinity: string
  name: string
  latinName?: string
  epithet?: string
  fields: CharacterField[]
  remarks: string[]
}

const headingPattern = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/g
const paragraphPattern = /<p>([\s\S]*?)<\/p>/g
const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  "#x27": "'",
}

const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, name: string) => entities[name])
    .trim()

/** Nests the compiled draft by heading level (h1 → h3); text before a heading belongs to its parent. */
function outline(html: string) {
  const root: Block = { level: 0, title: "", html: "", children: [] }
  const stack = [root]
  let cursor = 0
  for (const match of html.matchAll(headingPattern)) {
    stack[stack.length - 1].html += html.slice(cursor, match.index)
    cursor = match.index + match[0].length
    const level = Number(match[1])
    while (stack[stack.length - 1].level >= level) stack.pop()
    const block: Block = { level, title: textOf(match[2]), html: "", children: [] }
    stack[stack.length - 1].children.push(block)
    stack.push(block)
  }
  stack[stack.length - 1].html += html.slice(cursor)
  return root
}

/** Build-time guard: a missing file or header field must fail the build, not ship an empty panel. */
function ensure<T>(value: T | undefined, description: string): T {
  if (value === undefined || value === "")
    throw new Error(`Novel content in src/novel/ is missing ${description}.`)
  return value
}

const part = (path: string) => ensure(parts[`../novel/${path}`], `\`${path}\``)

const field = (file: Part, name: string) => {
  const value = file.frontmatter[name]
  return ensure(
    value === undefined ? undefined : String(value),
    `\`${name}\` in the header of ${file.file}`,
  )
}

async function parseCharacter(file: Part): Promise<Character> {
  const name = field(file, "name")
  const affinity = field(file, "affinity")
  const fields: CharacterField[] = []
  const remarks: string[] = []
  let epithet: string | undefined

  for (const [, inner] of (await file.compiledContent()).matchAll(paragraphPattern)) {
    const text = textOf(inner)
    const field = text.match(/^([^：:]{1,12})[：:]\s*([\s\S]+)$/)
    if (!epithet && fields.length === 0 && /^<em>[\s\S]*<\/em>$/.test(inner.trim())) {
      epithet = inner
    } else if (field) {
      const value = inner.replace(/^[^：:<]{1,12}[：:]\s*/, "")
      fields.push({ label: field[1].trim(), html: value, short: textOf(value).length <= 14 })
    } else {
      remarks.push(inner)
    }
  }

  const fullName = fields.find((field) => field.label === "姓名")
  const latinName = fullName
    ? textOf(fullName.html).match(/[（(]\s*([A-Za-z][A-Za-z\s'-]*)\s*[)）]/)?.[1]
    : undefined
  return {
    id: `character-${(latinName ?? name).toLowerCase().replace(/[^a-z0-9\p{Script=Han}]+/gu, "-")}`,
    affinity,
    name,
    latinName,
    epithet,
    fields: fields.filter((field) => field !== fullName),
    remarks,
  }
}

const book = part("index.md")
export const title = field(book, "title")
export const tagline = field(book, "tagline")

const prologueFile = part("prologue.md")
export const prologue = {
  title: field(prologueFile, "title"),
  html: await prologueFile.compiledContent(),
}

export const chapters: Chapter[] = await Promise.all(
  Object.entries(parts)
    .filter(([path]) => /\/volume-[^/]+\/[^/]+\.md$/.test(path))
    .map(([, file]) => file)
    .sort((a, b) => Number(field(a, "chapter")) - Number(field(b, "chapter")))
    .map(async (file) => {
      const number = String(Number(field(file, "chapter"))).padStart(2, "0")
      const body = outline(await file.compiledContent())
      return {
        id: `chapter-${number}`,
        volume: field(file, "volume"),
        number: `Chapter ${number}`,
        name: field(file, "title"),
        html: body.html,
        sections: body.children.map((section) => ({ title: section.title, html: section.html })),
      }
    }),
)

if (chapters.length === 0)
  throw new Error("Novel content in src/novel/ has no `volume-NN/chapter-NN.md` file.")

const codexFile = part("codex/index.md")
const worldFile = part("codex/world.md")

export const codex = {
  title: field(codexFile, "title"),
  note: await codexFile.compiledContent(),
  characters: await Promise.all(
    Object.entries(parts)
      .filter(([path]) => path.includes("/codex/characters/"))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, file]) => parseCharacter(file)),
  ),
}

export const world = {
  title: field(worldFile, "title"),
  label: field(worldFile, "label"),
  html: await worldFile.compiledContent(),
}
