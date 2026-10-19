import { useState } from 'react'
import type { UserProfile } from '../types'
import {
  BUCKETS,
  RECENT_SINCE_LABEL,
  bucketCount,
  bucketUniquePages,
  editSizeRows,
  formatInt,
  pageCount,
  topPages,
  type BucketKey,
  type BucketSpec,
} from '../profileData'
import Popover from './Popover'
import { LlmBox } from './Placeholder'
import { BackArrow, Caret } from './icons'

/* ---------------------------------------------------------------- bar ---- */

interface BarProps {
  profile: UserProfile | null
  selected: BucketKey | null
  onSelect: (k: BucketKey) => void
  compact?: boolean
}

export function ActivityBar({ profile, selected, onSelect, compact }: BarProps) {
  const counts = BUCKETS.map((b) => bucketCount(profile, b.key) ?? 0)
  const total = counts.reduce((a, b) => a + b, 0)
  return (
    <div className={'activity-bar' + (compact ? ' compact' : '')} role="tablist">
      {BUCKETS.map((b, i) => {
        const n = counts[i]
        // Proportional width with a floor so small buckets stay clickable.
        const share = total ? n / total : 1 / BUCKETS.length
        const grow = Math.max(share, 0.06)
        const isSel = selected === b.key
        return (
          <button
            key={b.key}
            role="tab"
            aria-selected={isSel}
            className={'activity-seg' + (isSel ? ' selected' : '')}
            style={{ flexGrow: grow, flexBasis: 0, background: isSel ? b.active : b.color }}
            onClick={() => onSelect(b.key)}
            title={`${b.label}: ${formatInt(n) ?? 'no data'} edits`}
          >
            {b.label} ({formatInt(n) ?? '–'})
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------- detail ---- */

interface DetailProps {
  profile: UserProfile | null
  bucket: BucketKey
  onSelect: (k: BucketKey) => void
  onBack: () => void
}

export function ActivityDetail({ profile, bucket, onSelect, onBack }: DetailProps) {
  const spec = BUCKETS.find((b) => b.key === bucket)!
  return (
    <div className="activity-detail">
      <div className="activity-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to account information">
          <BackArrow />
        </button>
        <span className="activity-title">
          Recent edit activity <span className="muted">(since {RECENT_SINCE_LABEL})</span>
        </span>
      </div>
      <ActivityBar profile={profile} selected={bucket} onSelect={onSelect} compact />
      {spec.layout === 'article' && <ArticleLayout profile={profile} spec={spec} />}
      {spec.layout === 'talk' && <TalkLayout profile={profile} spec={spec} />}
      {spec.layout === 'userTalk' && <UserTalkLayout />}
      {spec.layout === 'wp' && <WpLayout profile={profile} spec={spec} />}
    </div>
  )
}

/* ---- shared pieces ---- */

function UniqueCard({ profile, spec }: { profile: UserProfile | null; spec: BucketSpec }) {
  const n = formatInt(bucketUniquePages(profile, spec.key))
  return (
    <div className="info-card center">
      <span>
        Has edited <b>{n ?? '–'}</b> unique {spec.noun}
      </span>
    </div>
  )
}

function TopTenCard({ profile, spec, inline }: { profile: UserProfile | null; spec: BucketSpec; inline?: boolean }) {
  const [open, setOpen] = useState(false)
  const items = topPages(profile, spec.key)
  const total = pageCount(profile, spec.key)
  const capped = total > 10 // "Top 10" only when the list was actually cut
  const nounCap = spec.noun.charAt(0).toUpperCase() + spec.noun.slice(1)
  return (
    <div className={'info-card center pop-anchor' + (inline ? ' inline' : '')}>
      <span>
        {capped ? (
          <>
            <button className="link-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              Top 10 <Caret />
            </button>{' '}
            {spec.noun} they edited most
          </>
        ) : (
          <button className="link-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {nounCap} they edited <Caret />
          </button>
        )}
      </span>
      {open && (
        <Popover title={`Their edits by ${spec.singularNoun}`} onClose={() => setOpen(false)}>
          {items.length ? (
            <ol className="rank-list">
              {items.map((it) => (
                <li key={it.page}>
                  <span className="rank-page">{it.page}</span>
                  <span className="rank-count">{formatInt(it.count)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No {spec.noun} edited in this period</p>
          )}
        </Popover>
      )}
    </div>
  )
}

/* ---- layouts per segment ---- */

function ArticleLayout({ profile, spec }: { profile: UserProfile | null; spec: BucketSpec }) {
  return (
    <div className="two-col">
      <section className="detail-col">
        <h3>What did they edit?</h3>
        <h4>Overview</h4>
        <UniqueCard profile={profile} spec={spec} />
        <TopTenCard profile={profile} spec={spec} />
        <h4>Article topic summary</h4>
        <LlmBox />
      </section>
      <section className="detail-col">
        <h3>How did they edit?</h3>
        <h4>
          Article edit size <span className="muted small">(most recent 500 edits)</span>
        </h4>
        <EditSizeTable profile={profile} />
        <h4>
          Article edit characteristic <span className="muted small">(most recent 100 edits)</span>
        </h4>
        <LlmBox />
      </section>
    </div>
  )
}

function TalkLayout({ profile, spec }: { profile: UserProfile | null; spec: BucketSpec }) {
  return (
    <div className="two-col">
      <section className="detail-col">
        <h3>What did they edit?</h3>
        <h4>Overview</h4>
        <UniqueCard profile={profile} spec={spec} />
        <TopTenCard profile={profile} spec={spec} />
        <h4>Talk topic summary</h4>
        <LlmBox />
      </section>
      <section className="detail-col">
        <h3>How did they edit?</h3>
        <h4>Summary</h4>
        <LlmBox />
        <h4>Behavior</h4>
        <LlmBox />
      </section>
    </div>
  )
}

function UserTalkLayout() {
  return (
    <section className="detail-col single">
      <h3>How did they edit?</h3>
      <h4>Summary</h4>
      <LlmBox height={200} />
      <h4>Behavior</h4>
      <LlmBox height={200} />
    </section>
  )
}

function WpLayout({ profile, spec }: { profile: UserProfile | null; spec: BucketSpec }) {
  const topic = spec.key === 'WP_page_contribs' ? 'WP page topic summary' : 'WP talk topic summary'
  return (
    <section className="detail-col single">
      <h3>What did they edit?</h3>
      <h4>Overview</h4>
      <div className="card-row">
        <UniqueCard profile={profile} spec={spec} />
        <TopTenCard profile={profile} spec={spec} inline />
      </div>
      <h4>{topic}</h4>
      <LlmBox height={200} />
    </section>
  )
}

/** Article edit size table from article_edit_activity.distribution.buckets. */
function EditSizeTable({ profile }: { profile: UserProfile | null }) {
  const rows = editSizeRows(profile)
  return (
    <table className="edit-size">
      <thead>
        <tr>
          <th>Characters changed per edit</th>
          <th>Number of edits</th>
          <th>Share of edits</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td>{formatInt(r.count) ?? '–'}</td>
            <td>{r.percent == null ? '–' : `${r.percent.toFixed(1)}%`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
