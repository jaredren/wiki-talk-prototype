/**
 * Highlight every comment in `root` whose DiscussionTools comment id is in
 * `commentIds`. Comments are delimited by
 *   <span data-mw-comment-start="" id="c-..."></span>  ...  <span data-mw-comment-end="c-..."></span>
 * which may sit at different DOM depths, so we build a Range between them and
 * wrap every intersecting text node in <mark class="user-hl">.
 *
 * Call clearHighlights() before re-applying; the caller re-sets innerHTML
 * from the pristine snapshot on every change anyway.
 */
export function applyHighlights(root: HTMLElement, commentIds: Iterable<string>) {
  for (const id of commentIds) {
    const start = root.querySelector<HTMLElement>(`[data-mw-comment-start][id="${cssEscape(id)}"]`)
    const end = root.querySelector<HTMLElement>(`[data-mw-comment-end="${cssEscape(id)}"]`)
    if (!start || !end) continue
    const range = document.createRange()
    range.setStartAfter(start)
    range.setEndBefore(end)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const targets: Text[] = []
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!range.intersectsNode(n)) continue
      if (!(n as Text).data.trim()) continue
      if ((n.parentElement as HTMLElement | null)?.closest('mark.user-hl')) continue
      targets.push(n as Text)
    }
    for (const t of targets) {
      const mark = document.createElement('mark')
      mark.className = 'user-hl'
      t.parentNode!.insertBefore(mark, t)
      mark.appendChild(t)
    }
  }
}

export function clearHighlights(root: HTMLElement) {
  root.querySelectorAll('mark.user-hl').forEach((m) => {
    const parent = m.parentNode!
    while (m.firstChild) parent.insertBefore(m.firstChild, m)
    parent.removeChild(m)
  })
}

function cssEscape(s: string) {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&')
}
