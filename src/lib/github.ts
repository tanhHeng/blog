import { GITHUB_TOKEN } from "astro:env/server"

/** Whose public activity the homepage lists. */
export const githubUser = "tanhHeng"

export interface GithubActivity {
  kind: "push" | "release"
  /** `owner/name`. */
  repo: string
  /** The repository's own name, without the owner. */
  name: string
  url: string
  /** ISO time of the event. */
  time: string
  timestamp: number
  /** The head commit's first line for a push, the release name for a release. */
  note: string
}

interface GithubEvent {
  type: string
  repo: { name: string }
  created_at: string
  payload: {
    head?: string
    action?: string
    release?: { name: string | null; tag_name: string; html_url: string }
  }
}

const api = "https://api.github.com"
const headers: HeadersInit = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${api}${path}`, { headers })
  if (!response.ok) throw new Error(`GitHub ${path} answered ${response.status}`)
  return (await response.json()) as T
}

async function load(limit: number): Promise<GithubActivity[]> {
  const events = await request<GithubEvent[]>(`/users/${githubUser}/events/public?per_page=100`)
  // The feed is only roughly newest first (a release can follow older pushes), so sort it before each
  // repository keeps its latest push or release.
  events.sort((a, b) => b.created_at.localeCompare(a.created_at))
  const latest = new Map<string, GithubEvent>()
  for (const event of events) {
    const relevant =
      (event.type === "PushEvent" && event.payload.head) ||
      (event.type === "ReleaseEvent" && event.payload.action === "published")
    if (relevant && !latest.has(event.repo.name)) latest.set(event.repo.name, event)
    if (latest.size === limit) break
  }

  // Push events no longer carry commit messages, so each push costs one more request.
  return Promise.all(
    [...latest.values()].map(async (event): Promise<GithubActivity> => {
      const repo = event.repo.name
      const base = {
        repo,
        name: repo.slice(repo.indexOf("/") + 1),
        time: event.created_at,
        timestamp: Date.parse(event.created_at),
      }
      const { release, head } = event.payload
      if (release) {
        return {
          ...base,
          kind: "release",
          url: release.html_url,
          note: release.name?.trim() || release.tag_name,
        }
      }
      const commit = await request<{ html_url: string; commit: { message: string } }>(
        `/repos/${repo}/commits/${head}`,
      )
      return {
        ...base,
        kind: "push",
        url: commit.html_url,
        note: commit.commit.message.split("\n", 1)[0].trim(),
      }
    }),
  )
}

let cached: Promise<GithubActivity[]> | undefined

/**
 * The latest push or release of up to `limit` repositories, newest first, fetched once per build
 * (and once per dev server run, which keeps unauthenticated requests well under GitHub's 60 an hour).
 * Set `GITHUB_TOKEN` to raise that limit. Any failure yields an empty list with a warning, so the
 * build never depends on GitHub.
 */
export function recentGithubActivity(limit: number) {
  cached ??= load(limit).catch((error: unknown) => {
    console.warn(
      `[github] recent activity unavailable: ${error instanceof Error ? error.message : String(error)}`,
    )
    return []
  })
  return cached
}
