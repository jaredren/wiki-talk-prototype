import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  title?: string
  onClose: () => void
  children: ReactNode
  /** Horizontal alignment of the popover relative to its anchor. */
  align?: 'left' | 'right'
  width?: number
}

/**
 * Anchored popover with a pointer arrow and close button, as in the frames.
 * Render it inside a `position: relative` wrapper (.pop-anchor) that also
 * contains the trigger button (aria-expanded="true"); the arrow is positioned
 * to point at that button. Closes on outside click or Escape.
 */
export default function Popover({ title, onClose, children, align = 'left', width }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [arrowLeft, setArrowLeft] = useState<number | null>(null)

  // Point the arrow at the trigger button's horizontal centre.
  useLayoutEffect(() => {
    const el = ref.current
    const anchor = el?.parentElement
    if (!el || !anchor) return
    const trigger = anchor.querySelector<HTMLElement>('[aria-expanded="true"]')
    if (!trigger) return
    const t = trigger.getBoundingClientRect()
    const p = el.getBoundingClientRect()
    const centre = t.left + t.width / 2 - p.left
    setArrowLeft(Math.max(14, Math.min(p.width - 30, centre - 8)))
  }, [align, width])

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

  return (
    <div ref={ref} className={`popover popover-${align}`} style={width ? { width } : undefined} role="dialog">
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
