const WIKI = 'https://en.wikipedia.org'

/**
 * Make every link in the snapshot open in a new tab and point at an absolute
 * Wikipedia URL. Also absolutises protocol-relative image sources.
 */
export function prepareLinks(root: HTMLElement, page: string) {
  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    const href = a.getAttribute('href')!
    if (href.startsWith('#')) {
      // In-section anchors (e.g. "Latest comment: 2 years ago") point at the
      // live page; keep them as links but send them to Wikipedia too.
      a.href = `${WIKI}/wiki/${encodeURIComponent(page.replace(/ /g, '_'))}${href}`
    } else if (href.startsWith('//')) {
      a.href = `https:${href}`
    } else if (href.startsWith('/')) {
      a.href = `${WIKI}${href}`
    }
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
  })
  root.querySelectorAll<HTMLImageElement>('img[src^="//"]').forEach((img) => {
    img.src = `https:${img.getAttribute('src')}`
    const ss = img.getAttribute('srcset')
    if (ss) img.setAttribute('srcset', ss.replace(/(^|,\s*)\/\//g, '$1https://'))
  })
}

/**
 * If `url` is an ordinary en.wikipedia.org/wiki/<Title> link, return the
 * title (for the REST page-summary API); otherwise null.
 */
export function wikiTitleFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (!/(^|\.)wikipedia\.org$/.test(u.hostname)) return null
    const m = u.pathname.match(/^\/wiki\/(.+)$/)
    if (!m) return null
    const title = decodeURIComponent(m[1])
    if (/^(Special|File):/i.test(title)) return null
    return title
  } catch {
    return null
  }
}
