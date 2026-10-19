import type { DiscussionMeta, Manifest, UserProfile } from './types'

const BASE = import.meta.env.BASE_URL // "/" locally, "/<repo>/" on Pages

async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}data/${path}`)
  if (!r.ok) throw new Error(`${path}: ${r.status}`)
  return r.json() as Promise<T>
}

export const loadManifest = () => getJSON<Manifest>('manifest.json')

export const loadMeta = (id: string) =>
  getJSON<DiscussionMeta>(`discussions/${id}/meta.json`)

export async function loadTalkHtml(id: string): Promise<string> {
  const r = await fetch(`${BASE}data/discussions/${id}/talk.html`)
  if (!r.ok) throw new Error(`talk.html: ${r.status}`)
  return r.text()
}

/** Username -> filename. "Yvan Part" -> "Yvan_Part.json". */
export const userFile = (name: string) => `${name.replace(/ /g, '_')}.json`

/** Returns null (not an error) when no profile file exists for the user. */
export async function loadUser(name: string): Promise<UserProfile | null> {
  try {
    const r = await fetch(`${BASE}data/users/${userFile(name)}`)
    if (!r.ok) return null
    // The Vite dev server answers unknown paths with index.html and status
    // 200, so a missing profile must be detected by content, not status.
    const type = r.headers.get('content-type') ?? ''
    if (!type.includes('json')) return null
    const data = (await r.json()) as UserProfile
    return data && typeof data === 'object' && 'account_information' in data ? data : null
  } catch {
    return null
  }
}
