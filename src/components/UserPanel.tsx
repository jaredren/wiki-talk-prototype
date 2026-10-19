import { useEffect, useState, type ReactNode } from 'react'
import type { UserProfile } from '../types'
import {
  RECENT_SINCE_LABEL,
  describeItem,
  formatDate,
  formatInt,
  articleTalkCollaboratorCount,
  topArticleTalkCollaborators,
  topUserTalkInteractions,
  userTalkInteractionCount,
  type BucketKey,
} from '../profileData'
import Popover from './Popover'
import { Explanation, LlmBox } from './Placeholder'
import { ActivityBar, ActivityDetail } from './EditActivity'
import { CalendarUserIcon, Caret, EditIcon, UserGearIcon, UserSlashIcon } from './icons'

interface Props {
  user: string
  profile: UserProfile | null // null = no JSON file for this user
  highlightOn: boolean
}

type PopId = 'barnstars' | 'userpage' | 'admin' | 'blocked' | 'collab' | 'social' | null

export default function UserPanel({ user, profile, highlightOn }: Props) {
  const [accountOpen, setAccountOpen] = useState(true)
  const [socialOpen, setSocialOpen] = useState(false)
  const [bucket, setBucket] = useState<BucketKey | null>(null)
  const [pop, setPop] = useState<PopId>(null)

  // Reset transient state when the user changes.
  useEffect(() => {
    setBucket(null)
    setPop(null)
  }, [user])

  if (bucket) {
    return (
      <div className="user-panel">
        <ActivityDetail profile={profile} bucket={bucket} onSelect={setBucket} onBack={() => setBucket(null)} />
      </div>
    )
  }

  const toggle = (id: PopId) => setPop((p) => (p === id ? null : id))
  const close = () => setPop(null)

  const acct = profile?.account_information
  const created = formatDate(acct?.account_created)
  const edits = formatInt(acct?.total_edit_count)
  const isAdmin = profile?.admin_information?.is_admin_now ?? null
  const isBlocked = profile?.block_information?.current_block_information?.currently_blocked ?? null
  const barnstars = profile?.user_talk_page?.barnstars_found ?? []
  const adminHistory = profile?.admin_information?.adminship_history ?? []
  const blockHistory = profile?.block_information?.block_history ?? []

  return (
    <div className="user-panel">
      <Section title={`${user}'s account information`} open={accountOpen} onToggle={() => setAccountOpen((o) => !o)}>
        {highlightOn && <DiscussionOverlay />}
        {!profile && <p className="panel-note">No profile file found for {user}.</p>}

        <div className="info-grid">
          <div className="info-card">
            <CalendarUserIcon />
            <span>
              Account created on <b>{created ?? '–'}</b>
            </span>
          </div>
          <div className="info-card">
            <EditIcon />
            <span>
              Has made <b>{edits ?? '–'}</b> edits
            </span>
          </div>

          <div className="info-card pop-anchor">
            <CalendarUserIcon />
            <span>
              <button className="link-btn" onClick={() => toggle('barnstars')} aria-expanded={pop === 'barnstars'}>
                Barnstars <Caret />
              </button>{' '}
              received
            </span>
            {pop === 'barnstars' && (
              <Popover onClose={close}>
                {barnstars.length ? (
                  <ul className="plain-list">
                    {barnstars.map((b, i) => (
                      <li key={i}>{describeItem(b)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No barnstars received</p>
                )}
              </Popover>
            )}
          </div>
          <div className="info-card pop-anchor">
            <EditIcon />
            <span>
              <button className="link-btn" onClick={() => toggle('userpage')} aria-expanded={pop === 'userpage'}>
                User page summary <Caret />
              </button>
            </span>
            {pop === 'userpage' && (
              <Popover onClose={close} align="right">
                <LlmBox height={120} />
              </Popover>
            )}
          </div>

          <div className="info-card pop-anchor">
            <UserGearIcon />
            <span>
              Is {isAdmin === false && <b>not </b>}currently an{' '}
              <button className="link-btn" onClick={() => toggle('admin')} aria-expanded={pop === 'admin'}>
                admin <Caret />
              </button>
            </span>
            {pop === 'admin' && (
              <Popover title="Admin history" onClose={close}>
                <HistoryList items={adminHistory} empty="No admin history" />
              </Popover>
            )}
          </div>
          <div className="info-card pop-anchor">
            <UserSlashIcon />
            <span>
              Is {isBlocked === false && <b>not </b>}currently{' '}
              <button className="link-btn" onClick={() => toggle('blocked')} aria-expanded={pop === 'blocked'}>
                blocked <Caret />
              </button>
            </span>
            {pop === 'blocked' && (
              <Popover title="Block history" onClose={close} align="right">
                <HistoryList items={blockHistory} empty="No block history" />
              </Popover>
            )}
          </div>
        </div>

        <div className="activity-block">
          <div className="activity-title">
            <span className="activity-link">Recent edit activity</span>{' '}
            <span className="muted small">(since {RECENT_SINCE_LABEL})</span>
          </div>
          <ActivityBar profile={profile} selected={null} onSelect={setBucket} />
        </div>
      </Section>

      <Section title={`${user}'s social network`} open={socialOpen} onToggle={() => setSocialOpen((o) => !o)}>
        <div className="info-grid">
          <div className="info-card pop-anchor">
            <span>
              {articleTalkCollaboratorCount(profile) > 10 ? (
                <>
                  <button className="link-btn" onClick={() => toggle('collab')} aria-expanded={pop === 'collab'}>
                    Top 10 <Caret />
                  </button>{' '}
                  <b>article talk</b> work collaborations
                </>
              ) : (
                <button className="link-btn plain" onClick={() => toggle('collab')} aria-expanded={pop === 'collab'}>
                  <b>Article talk</b>&nbsp;work collaborations <Caret />
                </button>
              )}
            </span>
            {pop === 'collab' && (
              <Popover onClose={close}>
                <Explanation />
                <RankList items={topArticleTalkCollaborators(profile)} empty="No article talk collaborations found" />
              </Popover>
            )}
          </div>
          <div className="info-card pop-anchor">
            <span>
              {userTalkInteractionCount(profile) > 10 ? (
                <>
                  <button className="link-btn" onClick={() => toggle('social')} aria-expanded={pop === 'social'}>
                    Top 10 <Caret />
                  </button>{' '}
                  <b>user talk</b> social interactions
                </>
              ) : (
                <button className="link-btn plain" onClick={() => toggle('social')} aria-expanded={pop === 'social'}>
                  <b>User talk</b>&nbsp;social interactions <Caret />
                </button>
              )}
            </span>
            {pop === 'social' && (
              <Popover onClose={close} align="right">
                <Explanation />
                <RankList items={topUserTalkInteractions(profile)} empty="No user talk interactions found" />
              </Popover>
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}

/* ---------------------------------------------------------------------- */

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="panel-section">
      <div className="panel-head">
        <button className="panel-toggle" onClick={onToggle} aria-expanded={open} aria-label={open ? 'Collapse' : 'Expand'}>
          <span className={'caret' + (open ? ' open' : '')} aria-hidden="true" />
        </button>
        <h2 className="panel-title">{title}</h2>
      </div>
      {open && <div className="panel-body">{children}</div>}
    </section>
  )
}

function HistoryList({ items, empty }: { items: unknown[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>
  return (
    <ul className="plain-list">
      {items.map((it, i) => (
        <li key={i}>{describeItem(it)}</li>
      ))}
    </ul>
  )
}

function RankList({ items, empty }: { items: { user: string; count: number }[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>
  return (
    <ol className="rank-list">
      {items.map((it) => (
        <li key={it.user}>
          <span className="rank-page">{it.user}</span>
          <span className="rank-count">{formatInt(it.count)}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Card that covers the account panel while the discussion highlight is on
 * (frame 3 of the design). Contents are placeholders.
 */
function DiscussionOverlay() {
  return (
    <div className="discussion-overlay">
      <h3>Behavior in the discussion seems…</h3>
      <LlmBox height={150} />
      <h3>Blocked conduct in the discussion</h3>
    </div>
  )
}
