import { wikiTitleFromUrl } from './links'

export interface Preview {
  title: string
  extract: string
  thumbnail?: string
  url: string
}

const cache = new Map<string, Promise<Preview | null>>()

/**
 * Live preview via Wikipedia's REST page-summary endpoint (CORS-enabled).
 * To switch to cached previews later: replace the body of this function with
 * a lookup in a pre-fetched JSON file; the hover UI does not need to change.
 */
export function getPreview(url: string): Promise<Preview | null> {
  const title = wikiTitleFromUrl(url)
  if (!title) {
    return Promise.resolve({ title: url, extract: '', url })
  }
  if (!cache.has(title)) {
    const p = fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      { headers: { Accept: 'application/json' } },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((j) =>
        j
          ? {
              title: j.title ?? title,
              extract: j.extract ?? '',
              thumbnail: j.thumbnail?.source,
              url,
            }
          : { title, extract: '', url },
      )
      .catch(() => ({ title, extract: '', url }))
    cache.set(title, p)
  }
  return cache.get(title)!
}
