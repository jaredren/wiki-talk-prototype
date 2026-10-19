import { useEffect, useMemo, useState } from 'react'
import { loadManifest, loadMeta, loadTalkHtml, loadUser } from './data'
import type { DiscussionMeta, UserProfile } from './types'
import { commentIdsForUser } from './highlightSource'
import TalkPane from './components/TalkPane'
import UserTabs from './components/UserTabs'
import UserPanel from './components/UserPanel'

/**
 * Which discussion to show: ?discussion=<id> in the URL, else the first entry
 * in manifest.json. Navigation between discussions is deliberately not built
 * yet (study flow undecided).
 */
function discussionIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('discussion')
}

export default function App() {
  const [meta, setMeta] = useState<DiscussionMeta | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeUser, setActiveUser] = useState<string>('')
  const [highlightOn, setHighlightOn] = useState(false)
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})
  const [defaultUser, setDefaultUser] = useState<string | undefined>(undefined)

  useEffect(() => {
    ;(async () => {
      try {
        const manifest = await loadManifest()
        const wanted = discussionIdFromUrl()
        const entry = manifest.discussions.find((d) => d.id === wanted) ?? manifest.discussions[0]
        if (!entry) throw new Error('manifest.json has no discussions')
        const [m, h] = await Promise.all([loadMeta(entry.id), loadTalkHtml(entry.id)])
        // Load every registered participant's profile up front; only users
        // with a profile file get a tab.
        const registered = m.participants.filter((p) => !p.isIP)
        const loaded = await Promise.all(registered.map((p) => loadUser(p.name)))
        const map: Record<string, UserProfile> = {}
        registered.forEach((p, i) => {
          const prof = loaded[i]
          if (prof) map[p.name] = prof
        })
        setProfiles(map)
        setDefaultUser(entry.defaultUser)
        setMeta(m)
        setHtml(h)
      } catch (e) {
        setError(String(e))
      }
    })()
  }, [])

  // Tab rule: registered accounts (no IP editors) that have a profile JSON
  // in public/data/users/, alphabetical.
  const tabUsers = useMemo(
    () =>
      (meta?.participants.filter((p) => !p.isIP && profiles[p.name]) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
      ),
    [meta, profiles],
  )

  const profile = activeUser ? (profiles[activeUser] ?? null) : null

  const highlightIds = useMemo(
    () => (highlightOn && meta && activeUser ? commentIdsForUser(activeUser, meta, profile) : []),
    [highlightOn, meta, activeUser, profile],
  )

  useEffect(() => {
    if (activeUser || !tabUsers.length) return
    const preferred = tabUsers.find((u) => u.name === defaultUser)
    setActiveUser((preferred ?? tabUsers[0]).name)
  }, [tabUsers, activeUser, defaultUser])

  // Switching tabs turns the highlight off; it applies to the active tab only.
  const selectUser = (name: string) => {
    setActiveUser(name)
    setHighlightOn(false)
  }

  if (error) return <div className="status error">{error}</div>
  if (!meta || !html) return <div className="status">Loading discussion</div>

  return (
    <div className="layout">
      <div className="left">
        <div className="left-toolbar">
          <button
            className={'hl-toggle' + (highlightOn ? ' on' : '')}
            onClick={() => setHighlightOn((v) => !v)}
            aria-pressed={highlightOn}
            disabled={!activeUser}
          >
            {activeUser || 'User'} in the discussion
          </button>
        </div>
        <TalkPane html={html} meta={meta} highlightIds={highlightIds} />
      </div>
      <div className="right">
        <UserTabs users={tabUsers} active={activeUser} onSelect={selectUser} />
        {activeUser ? (
          <UserPanel user={activeUser} profile={profile} highlightOn={highlightOn} />
        ) : (
          <p className="panel-note">No user profiles found for this discussion.</p>
        )}
      </div>
    </div>
  )
}
