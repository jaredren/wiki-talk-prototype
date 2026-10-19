import type { DiscussionMeta, UserProfile } from './types'

/**
 * Decide which comments to highlight for `user`.
 *
 * Primary source: the user's profile JSON, whose
 * `discussion_participation.posts` holds each post as wikitext ending in the
 * user's signature timestamp, e.g. "... 15:06, 19 August 2024 (UTC)".
 * DiscussionTools comment ids embed the same timestamp:
 *   c-Yvan_Part-20240819150600-<parent>
 * so the join is exact (to the minute).
 *
 * Fallback: if the profile is missing or none of its posts match, use the
 * snapshot's own comment ids for that author, so the button still works.
 */
export function commentIdsForUser(
  user: string,
  meta: DiscussionMeta,
  profile: UserProfile | null,
): string[] {
  const fromJson = profile ? fromProfile(user, meta, profile) : []
  if (fromJson.length) return fromJson
  return meta.comments.filter((c) => c.author === user).map((c) => c.id)
}

const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
}

// "15:06, 19 August 2024 (UTC)"  ->  "20240819150600"
const SIG_RE = /(\d{1,2}):(\d{2}), (\d{1,2}) ([A-Za-z]+) (\d{4}) \(UTC\)/g

export function signatureTimestamps(wikitext: string): string[] {
  const out: string[] = []
  for (const m of wikitext.matchAll(SIG_RE)) {
    const [, hh, mm, d, mon, yyyy] = m
    const mo = MONTHS[mon.toLowerCase()]
    if (!mo) continue
    out.push(`${yyyy}${mo}${d.padStart(2, '0')}${hh.padStart(2, '0')}${mm}00`)
  }
  return out
}

function fromProfile(user: string, meta: DiscussionMeta, profile: UserProfile): string[] {
  const posts = profile.discussion_participation?.posts ?? []
  const prefix = `c-${user.replace(/ /g, '_')}-`
  const ids: string[] = []
  for (const post of posts) {
    // A post may quote earlier signatures; the user's own is the last one.
    const stamps = signatureTimestamps(post)
    const own = stamps[stamps.length - 1]
    if (!own) continue
    const hit = meta.comments.find((c) => c.id.startsWith(prefix + own))
    if (hit && !ids.includes(hit.id)) ids.push(hit.id)
  }
  return ids
}
