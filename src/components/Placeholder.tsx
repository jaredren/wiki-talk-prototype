/**
 * Areas whose content is deliberately not built yet (marked in the design as
 * "(llm interpretation)", "(explanation)", etc.). They render the label only.
 */
export function LlmBox({ height = 240 }: { height?: number }) {
  return (
    <div className="llm-box" style={{ minHeight: height }}>
      (llm interpretation)
    </div>
  )
}

export function Explanation() {
  return (
    <div className="explanation">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8.5" fill="none" stroke="#72777d" strokeWidth="1.2" />
        <circle cx="10" cy="6.2" r="1" fill="#72777d" />
        <rect x="9.2" y="8.5" width="1.6" height="6" fill="#72777d" />
      </svg>
      <span>(explanation)</span>
    </div>
  )
}
