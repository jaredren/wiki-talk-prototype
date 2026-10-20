import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  title?: string
  onClose: () => void
  children: ReactNode
  /** Horizontal alignment of the popover relative to its anchor. */
  align?: 'left' | 'right'
  width?: number
  /**
   * 'flip': open upward when there is not enough room below inside the
   * scrolling panel (used for the social network cards).
   * 'scroll' (default): keep opening downward, but scroll the panel just
   * enough that the whole popover is visible.
   */
  overflow?: 'flip' | 'scroll'
}

/** Nearest scrolling ancestor (the right-hand panel). */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let n = el?.parentElement ?? null; n; n = n.parentElement) {
    const { overflowY } = getComputedStyle(n)
    if (overflowY === 'auto' || overflowY === 'scroll') return n
  }
  return null
}

/**
 * Anchored popover with a pointer arrow and close button, as in the frames.
 * Render it inside a `position: relative` wrapper (.pop-anchor) that also
 * contains the trigger button (aria-expanded="true"); the arrow is positioned
 * to point at that button. The popover is kept inside the panel horizontally
 * and, depending on `overflow`, flips upward or scrolls into view vertically.
 * Closes on outside click or Escape.
 */
export default function Popover({ title, onClose, children, align = 'left', width, overflow = 'scroll' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [arrowLeft, setArrowLeft] = useState<number | null>(null)
  const [shiftX, setShiftX] = useState(0)
  const [up, setUp] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    const anchor = el?.parentElement
    if (!el || !anchor) return
    const panel = scrollParent(anchor)
    const bounds = panel?.getBoundingClientRect()

    // 1. Horizontal: keep the popover inside the panel.
    let shift = 0
    const p0 = el.getBoundingClientRect()
    if (bounds) {
      const pad = 8
      if (p0.right > bounds.right - pad) shift = bounds.right - pad - p0.right
      if (p0.left + shift < bounds.left + pad) shift = bounds.left + pad - p0.left
    }
    setShiftX(shift)

    // 2. Vertical.
    const p = { top: p0.top, bottom: p0.bottom, height: p0.height }
    if (overflow === 'flip' && bounds) {
      const roomBelow = bounds.bottom - p.top
      const roomAbove = anchor.getBoundingClientRect().top - bounds.top
      setUp(roomBelow < p.height && roomAbove > roomBelow)
    } else if (overflow === 'scroll' && panel && bounds) {
      const overshoot = p.bottom - bounds.bottom + 16
      if (overshoot > 0) panel.scrollBy({ top: overshoot, behavior: 'smooth' })
    }

    // 3. Arrow under (or over) the trigger's centre, after the shift.
    const trigger = anchor.querySelector<HTMLElement>('[aria-expanded="true"]')
    if (trigger) {
      const t = trigger.getBoundingClientRect()
      const centre = t.left + t.width / 2 - (p0.left + shift)
      setArrowLeft(Math.max(14, Math.min(p0.width - 30, centre - 8)))
    }
  }, [align, width, overflow])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const anchor = el.parentElement
      if (anchor && anchor.contains(e.target as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const style: React.CSSProperties = { transform: shiftX ? `translateX(${shiftX}px)` : undefined }
  if (width) style.width = width

  return (
    <div ref={ref} className={`popover popover-${align}${up ? ' popover-up' : ''}`} style={style} role="dialog">
      <span className="popover-arrow" style={arrowLeft != null ? { left: arrowLeft } : undefined} aria-hidden="true" />
      <button className="popover-close" onClick={onClose} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      </button>
      {title && <div className="popover-title">{title}</div>}
      <div className="popover-body">{children}</div>
    </div>
  )
}

/* ---- Shared table for popover contents ---- */

export function PopTable({
  headers,
  rows,
  empty,
  scroll,
}: {
  headers: string[]
  rows: ReactNode[][]
  empty: string
  /** Limit height to roughly this many rows and scroll inside. */
  scroll?: number
}) {
  if (!rows.length) return <p className="muted">{empty}</p>
  // Count-like columns are right-aligned; text columns stay left-aligned.
  const numeric = headers.map((h) => /^(number|times|count)/i.test(h))
  const cls = (j: number) => (numeric[j] ? 'num' : undefined)
  const table = (
    <table className="pop-table">
      <thead>
        <tr>
          {headers.map((h, j) => (
            <th key={h} className={cls(j)}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className={cls(j)}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
  return scroll ? (
    <div className="pop-scroll" style={{ maxHeight: `calc(${scroll + 1} * 2.1em)` }}>
      {table}
    </div>
  ) : (
    table
  )
}
