import * as draft from "../novel/flowe-orld.md"

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

/** Build-time guard: a renamed or missing draft heading must fail the build, not ship an empty panel. */
function ensure<T>(value: T | undefined, description: string): T {
  if (value === undefined)
    throw new Error(`Novel draft src/novel/flowe-orld.md is missing ${description}.`)
  return value
}

/** Splits `A / B` headings; the draft uses both `A / B` and `A/ B`. */
const splitTitle = (title: string) => {
  const index = title.lastIndexOf("/")
  return index < 0 ? [title, ""] : [title.slice(0, index).trim(), title.slice(index + 1).trim()]
}

function parseCharacter(block: Block): Character {
  const [affinity, name] = splitTitle(block.title)
  const fields: CharacterField[] = []
  const remarks: string[] = []
  let epithet: string | undefined

  for (const [, inner] of block.html.matchAll(paragraphPattern)) {
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

const root = outline(await draft.compiledContent())
const sections = root.children

export const tagline = textOf(root.html)

export const prologue = ensure(
  sections.find((block) => block.title === "序章"),
  "the `# 序章` section",
).html

export const chapters: Chapter[] = sections
  .filter((block) => block.children.some((child) => /^Chapter\b/i.test(child.title)))
  .flatMap((volume) =>
    volume.children
      .filter((child) => /^Chapter\b/i.test(child.title))
      .map((chapter) => {
        const [number, name] = splitTitle(chapter.title)
        return {
          id: `chapter-${number.match(/\d+/)?.[0] ?? chapter.title}`,
          volume: volume.title,
          number,
          name,
          html: chapter.html,
          sections: chapter.children.map((section) => ({
            title: section.title,
            html: section.html,
          })),
        }
      }),
  )

if (chapters.length === 0)
  throw new Error("Novel draft src/novel/flowe-orld.md has no `## Chapter NN / Title` heading.")

const codexBlock = ensure(
  sections.find((block) => block.title === "谐相图鉴"),
  "the `# 谐相图鉴` section",
)
const worldBlock = ensure(
  codexBlock.children.find((block) => block.title.includes("世界观")),
  "the `## … / 世界观` section",
)
const [worldTitle, worldLabel] = splitTitle(worldBlock.title)

export const codex = {
  title: codexBlock.title,
  note: codexBlock.html,
  characters: codexBlock.children.filter((block) => block !== worldBlock).map(parseCharacter),
}

export const world = {
  title: worldTitle,
  label: worldLabel,
  html: worldBlock.html,
}
