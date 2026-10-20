import { useEffect, useRef, useState } from 'react'
import type { DiscussionMeta } from '../types'
import { prepareLinks } from '../links'
import { applyHighlights, clearHighlights } from '../highlight'
import { getPreview, type Preview } from '../preview'
import '../talk.css'

interface Props {
  html: string
  meta: DiscussionMeta
  highlightIds: string[] // comment ids to highlight; empty = none
}

interface Hover {
  x: number
  y: number
  preview: Preview | null
}

const HOVER_DELAY_MS = 350

export default function TalkPane({ html, meta, highlightIds }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const timer = useRef<number | undefined>(undefined)
  /** Relative positions (0..1) of each highlighted comment, for the marker strip. */
  const [marks, setMarks] = useState<{ pos: number; height: number; top: number }[]>([])

  // Inject the snapshot once and prepare links.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.innerHTML = html
    prepareLinks(el, meta.page)
  }, [html, meta.page])

  // Re-apply highlights whenever the selected user changes.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    clearHighlights(el)
    if (!highlightIds.length) {
      setMarks([])
      return
    }
    applyHighlights(el, highlightIds)
    // Bring the first highlighted comment into view.
    const first = el.querySelector<HTMLElement>('mark.user-hl')
    first?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Marker strip: one tick per highlighted comment, at its relative offset
    // within the scrollable content (like a browser's find-in-page marks).
    const pane = paneRef.current
    if (!pane) return
    const compute = () => {
      const total = pane.scrollHeight
      const paneTop = pane.getBoundingClientRect().top - pane.scrollTop
      const out: { pos: number; height: number; top: number }[] = []
      for (const id of highlightIds) {
        const start = el.querySelector<HTMLElement>(`[data-mw-comment-start][id="${CSS.escape(id)}"]`)
        const end = el.querySelector<HTMLElement>(`[data-mw-comment-end="${CSS.escape(id)}"]`)
        if (!start || !end) continue
        const top = start.getBoundingClientRect().top - paneTop
        const bottom = end.getBoundingClientRect().bottom - paneTop
        out.push({ pos: top / total, height: Math.max(0.004, (bottom - top) / total), top })
      }
      setMarks(out)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(pane)
    return () => ro.disconnect()
  }, [highlightIds, html])

  // Hover previews (event delegation so it survives innerHTML resets).
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const over = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null
      if (!a) return
      window.clearTimeout(timer.current)
      const x = e.clientX
      const y = e.clientY
      timer.current = window.setTimeout(async () => {
        const preview = await getPreview(a.href)
        setHover({ x, y, preview })
      }, HOVER_DELAY_MS)
    }
    const out = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href]')
      if (!a) return
      window.clearTimeout(timer.current)
      setHover(null)
    }
    el.addEventListener('mouseover', over)
    el.addEventListener('mouseout', out)
    return () => {
      el.removeEventListener('mouseover', over)
      el.removeEventListener('mouseout', out)
      window.clearTimeout(timer.current)
    }
  }, [])

  return (
    <div className="talk-wrap">
      <div className="talk-pane" ref={paneRef}>
        <div className="talk-body" ref={bodyRef} />
      </div>
      {marks.length > 0 && (
        <div className="scroll-marks" aria-hidden="true">
          {marks.map((m, i) => (
            <button
              key={i}
              className="scroll-mark"
              style={{ top: `${m.pos * 100}%`, height: `${m.height * 100}%` }}
              title="Jump to this comment"
              onClick={() => paneRef.current?.scrollTo({ top: m.top - 8, behavior: 'smooth' })}
            />
          ))}
        </div>
      )}
      {hover?.preview && <PreviewCard hover={hover} />}
    </div>
  )
}

function PreviewCard({ hover }: { hover: Hover }) {
  const p = hover.preview!
  // Keep the card inside the viewport.
  const width = 320
  const left = Math.min(hover.x + 12, window.innerWidth - width - 16)
  const top = hover.y + 16
  return (
    <div className="preview-card" style={{ left, top, width }}>
      {p.thumbnail && <img src={p.thumbnail} alt="" />}
      <div className="preview-text">
        <div className="preview-title">{p.title}</div>
        {p.extract ? (
          <div className="preview-extract">{p.extract}</div>
        ) : (
          <div className="preview-url">{p.url}</div>
        )}
      </div>
    </div>
  )
}
