import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadManifest, loadMeta, loadTalkHtml, loadUser } from './data'
import type { DiscussionMeta, ManifestEntry, UserProfile } from './types'
import { commentIdsForUser } from './highlightSource'
import TalkPane from './components/TalkPane'
import UserTabs from './components/UserTabs'
import UserPanel from './components/UserPanel'

/** ?discussion=<id> in the URL selects the discussion; else the first entry. */
function discussionIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('discussion')
}

function setDiscussionIdInUrl(id: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('discussion', id)
  window.history.pushState({}, '', url)
}

export default function App() {
  const [entries, setEntries] = useState<ManifestEntry[]>([])
  const [entry, setEntry] = useState<ManifestEntry | null>(null)
  const [meta, setMeta] = useState<DiscussionMeta | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeUser, setActiveUser] = useState<string>('')
  const [highlightOn, setHighlightOn] = useState(false)
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})

  // Load one discussion: snapshot, meta, and every registered participant's
  // profile (only users with a profile file get a tab).
  const openDiscussion = useCallback(async (e: ManifestEntry) => {
    setMeta(null)
    setHtml(null)
    setActiveUser('')
    setHighlightOn(false)
    setEntry(e)
    try {
      const [m, h] = await Promise.all([loadMeta(e.id), loadTalkHtml(e.id)])
      const registered = m.participants.filter((p) => !p.isIP)
      const loaded = await Promise.all(registered.map((p) => loadUser(p.name)))
      const map: Record<string, UserProfile> = {}
      registered.forEach((p, i) => {
        const prof = loaded[i]
        if (prof) map[p.name] = prof
      })
      setProfiles(map)
      setMeta(m)
      setHtml(h)
    } catch (err) {
      setError(String(err))
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const manifest = await loadManifest()
        setEntries(manifest.discussions)
        const wanted = discussionIdFromUrl()
        const first = manifest.discussions.find((d) => d.id === wanted) ?? manifest.discussions[0]
        if (!first) throw new Error('manifest.json has no discussions')
        await openDiscussion(first)
      } catch (err) {
        setError(String(err))
      }
    })()
  }, [openDiscussion])

  // Browser back/forward between discussions.
  useEffect(() => {
    const onPop = () => {
      const id = discussionIdFromUrl()
      const e = entries.find((d) => d.id === id) ?? entries[0]
      if (e && e.id !== entry?.id) void openDiscussion(e)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [entries, entry, openDiscussion])

  const switchDiscussion = (id: string) => {
    const e = entries.find((d) => d.id === id)
    if (!e || e.id === entry?.id) return
    setDiscussionIdInUrl(id)
    void openDiscussion(e)
  }

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
    const preferred = tabUsers.find((u) => u.name === entry?.defaultUser)
    setActiveUser((preferred ?? tabUsers[0]).name)
  }, [tabUsers, activeUser, entry])

  // Switching tabs turns the highlight off; it applies to the active tab only.
  const selectUser = (name: string) => {
    setActiveUser(name)
    setHighlightOn(false)
  }

  if (error) return <div className="status error">{error}</div>

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
          {entries.length > 1 && (
            <label className="discussion-picker">
              <span className="muted small">Discussion</span>
              <select value={entry?.id ?? ''} onChange={(e) => switchDiscussion(e.target.value)}>
                {entries.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.page}: {d.section}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {meta && html ? (
          <TalkPane key={meta.id} html={html} meta={meta} highlightIds={highlightIds} />
        ) : (
          <div className="status">Loading discussion</div>
        )}
      </div>
      <div className="right">
        {meta && (
          <>
            <UserTabs users={tabUsers} active={activeUser} onSelect={selectUser} />
            {activeUser ? (
              <UserPanel key={`${meta.id}:${activeUser}`} user={activeUser} profile={profile} highlightOn={highlightOn} />
            ) : (
              <p className="panel-note">No user profiles found for this discussion.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
