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
  const [hover, setHover] = useState<Hover | null>(null)
  const timer = useRef<number | undefined>(undefined)

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
    if (highlightIds.length) applyHighlights(el, highlightIds)
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
    <div className="talk-pane">
      <div className="talk-body" ref={bodyRef} />
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
