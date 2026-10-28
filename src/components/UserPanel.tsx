import { useEffect, useState, type ReactNode } from 'react'
import type { UserProfile } from '../types'
import {
  RECENT_SINCE_LABEL,
  adminActionLabel,
  adminHistory,
  articleTalkCollaboratorCount,
  blockHistory,
  describePuppet,
  formatDate,
  formatDateTime,
  formatInt,
  groupedBarnstars,
  relatedBlocks,
  stripWikitext,
  topArticleTalkCollaborators,
  topUserTalkInteractions,
  userTalkInteractionCount,
  type BucketKey,
} from '../profileData'
import Popover, { PopTable } from './Popover'
import { Explanation, LlmBox } from './Placeholder'
import { ActivityBar, ActivityDetail } from './EditActivity'
import { BarnstarIcon, CalendarUserIcon, Caret, EditIcon, UserGearIcon, UserSearchIcon, UserSlashIcon } from './icons'

interface Props {
  user: string
  profile: UserProfile | null // null = no JSON file for this user
}

type PopId = 'barnstars' | 'userpage' | 'admin' | 'blocked' | 'collab' | 'social' | null

export default function UserPanel({ user, profile }: Props) {
  const [accountOpen, setAccountOpen] = useState(true)
  const [socialOpen, setSocialOpen] = useState(false)
  const [discussionOpen, setDiscussionOpen] = useState(false)
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
  const barnstars = groupedBarnstars(profile)
  const admins = adminHistory(profile)
  const blocks = blockHistory(profile)

  return (
    <div className="user-panel">
      <Section title={`${user}'s account information`} open={accountOpen} onToggle={() => setAccountOpen((o) => !o)}>
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
            <BarnstarIcon />
            <span>
              <button className="link-btn" onClick={() => toggle('barnstars')} aria-expanded={pop === 'barnstars'}>
                Barnstars <Caret />
              </button>{' '}
              received
            </span>
            {pop === 'barnstars' && (
              <Popover onClose={close}>
                <PopTable
                  headers={['Barnstar', 'Times received']}
                  rows={barnstars.map((b) => [b.name, formatInt(b.count)])}
                  empty="No barnstars received"
                  scroll={10}
                />
              </Popover>
            )}
          </div>
          <div className="info-card pop-anchor">
            <UserSearchIcon />
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
              <Popover onClose={close}>
                <PopTable
                  headers={['Date', 'Action']}
                  rows={admins.map((a) => [formatDateTime(a.timestamp) ?? a.timestamp, adminActionLabel(a.action)])}
                  empty="No admin history"
                  scroll={10}
                />
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
              <Popover onClose={close} align="right">
                <PopTable
                  headers={['Date', 'Duration', 'Reason']}
                  rows={blocks.map((b) => [
                    formatDateTime(b.started) ?? b.started,
                    b.duration,
                    stripWikitext(b.reason),
                  ])}
                  empty="No block history"
                  scroll={10}
                />
              </Popover>
            )}
          </div>
        </div>

        <div className="activity-block">
          <div className="activity-title">
            <button className="link-btn activity-link" onClick={() => setBucket('article_page_contribs')}>
              Recent edit activity
            </button>{' '}
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
                    Top 10 <Caret up />
                  </button>{' '}
                  <b>article talk</b> work collaborations
                </>
              ) : (
                <button className="link-btn plain" onClick={() => toggle('collab')} aria-expanded={pop === 'collab'}>
                  <b>Article talk</b>&nbsp;work collaborations <Caret up />
                </button>
              )}
            </span>
            {pop === 'collab' && (
              <Popover onClose={close} overflow="flip">
                <Explanation />
                <PopTable
                  headers={['Username', 'Number of occurrences']}
                  rows={topArticleTalkCollaborators(profile).map((r) => [r.user, formatInt(r.count)])}
                  empty="No article talk collaborations found"
                />
              </Popover>
            )}
          </div>
          <div className="info-card pop-anchor">
            <span>
              {userTalkInteractionCount(profile) > 10 ? (
                <>
                  <button className="link-btn" onClick={() => toggle('social')} aria-expanded={pop === 'social'}>
                    Top 10 <Caret up />
                  </button>{' '}
                  <b>user talk</b> social interactions
                </>
              ) : (
                <button className="link-btn plain" onClick={() => toggle('social')} aria-expanded={pop === 'social'}>
                  <b>User talk</b>&nbsp;social interactions <Caret up />
                </button>
              )}
            </span>
            {pop === 'social' && (
              <Popover onClose={close} align="right" overflow="flip">
                <Explanation />
                <PopTable
                  headers={['Username', 'Number of interactions']}
                  rows={topUserTalkInteractions(profile).map((r) => [r.user, formatInt(r.count)])}
                  empty="No user talk interactions found"
                />
              </Popover>
            )}
          </div>
        </div>
      </Section>

      <Section title={`${user} in the discussion`} open={discussionOpen} onToggle={() => setDiscussionOpen((o) => !o)}>
        <DiscussionDetails profile={profile} />
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

/**
 * Body of the "<user> in the discussion" section. The talk-pane highlight is
 * toggled by clicking the username tab. "Behavior" is a placeholder;
 * "Blocked conduct" lists blocks the scraper marked as related to this
 * discussion.
 */
function DiscussionDetails({ profile }: { profile: UserProfile | null }) {
  const related = relatedBlocks(profile)
  return (
    <div className="discussion-details">
      <h3>Behavior in the discussion seems…</h3>
      <LlmBox height={150} />
      <h3>Blocked conduct in the discussion</h3>
      {related.length ? (
        <PopTable
          headers={['Date', 'Reason', 'How it relates', 'Puppet']}
          rows={related.map((b) => [
            formatDateTime(b.started) ?? b.started,
            stripWikitext(b.reason),
            b.discussion_relatedness?.method ?? '–',
            describePuppet(b.discussion_relatedness?.puppet) ?? '–',
          ])}
          empty=""
        />
      ) : (
        <p className="muted">No blocked conduct in the discussion</p>
      )}
    </div>
  )
}
