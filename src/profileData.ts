import type { UserProfile } from './types'

/**
 * Derived views over the scraper JSON used by the right-hand panel.
 * Anything the JSON does not provide is returned as null so the UI can show a
 * neutral "no data" state instead of inventing a value.
 */

/** Cutoff shown next to "Recent edit activity". Not in the JSON; app constant. */
export const RECENT_SINCE_LABEL = 'September 1, 2023'

export type BucketKey =
  | 'article_page_contribs'
  | 'article_talk_page_contribs'
  | 'user_talk_page_contribs'
  | 'WP_page_contribs'
  | 'WP_talk_page_contribs'

export interface BucketSpec {
  key: BucketKey
  label: string          // segment label, e.g. "Article"
  noun: string           // "articles", "talks", ...
  singularNoun: string   // "article", "talk", ...
  color: string          // resting fill
  active: string         // selected fill
  layout: 'article' | 'talk' | 'userTalk' | 'wp'
}

export const BUCKETS: BucketSpec[] = [
  { key: 'article_page_contribs', label: 'Article', noun: 'articles', singularNoun: 'article', color: '#d4f7d4', active: '#4ef04e', layout: 'article' },
  { key: 'article_talk_page_contribs', label: 'Talk', noun: 'talks', singularNoun: 'talk', color: '#dbeeff', active: '#1ee5f5', layout: 'talk' },
  { key: 'user_talk_page_contribs', label: 'User talk', noun: 'user talks', singularNoun: 'user talk', color: '#ead3fb', active: '#f45ef0', layout: 'userTalk' },
  { key: 'WP_page_contribs', label: 'WP', noun: 'WP pages', singularNoun: 'WP page', color: '#fcd9b0', active: '#f29a1f', layout: 'wp' },
  { key: 'WP_talk_page_contribs', label: 'WP talk', noun: 'WP talks', singularNoun: 'WP talk', color: '#e6e6e6', active: '#b5b5b5', layout: 'wp' },
]

export function bucketCount(p: UserProfile | null, key: BucketKey): number | null {
  const b = p?.user_contribs?.recent_contribs?.[key]
  return b ? b.edit_count : null
}

export function bucketUniquePages(p: UserProfile | null, key: BucketKey): number | null {
  const b = p?.user_contribs?.recent_contribs?.[key]
  return b ? b.unique_page_count : null
}

/** Top N pages in a bucket by edit count, descending. */
export function topPages(p: UserProfile | null, key: BucketKey, n = 10): { page: string; count: number }[] {
  const by = p?.user_contribs?.recent_contribs?.[key]?.edit_counts_by_page
  if (!by) return []
  return Object.entries(by)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

function topEntries(rec: Record<string, number> | undefined, n: number) {
  if (!rec) return []
  return Object.entries(rec)
    .map(([user, count]) => ({ user, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

/** Total number of pages edited in a bucket (before the Top 10 cut). */
export function pageCount(p: UserProfile | null, key: BucketKey): number {
  return Object.keys(p?.user_contribs?.recent_contribs?.[key]?.edit_counts_by_page ?? {}).length
}
export const userTalkInteractionCount = (p: UserProfile | null) =>
  Object.keys(p?.social_network?.user_talk_social_network ?? {}).length
export const articleTalkCollaboratorCount = (p: UserProfile | null) =>
  Object.keys(p?.social_network?.article_talk_social_network ?? {}).length

/** Top N users by user-talk interactions (social_network.user_talk_social_network). */
export const topUserTalkInteractions = (p: UserProfile | null, n = 10) =>
  topEntries(p?.social_network?.user_talk_social_network, n)

/** Top N users by shared article-talk discussions (social_network.article_talk_social_network). */
export const topArticleTalkCollaborators = (p: UserProfile | null, n = 10) =>
  topEntries(p?.social_network?.article_talk_social_network, n)

/** Article edit size distribution rows, in the design's bin order. */
export const EDIT_SIZE_BINS: { key: '<100' | '100-500' | '500-1000' | '1000+'; label: string }[] = [
  { key: '<100', label: 'Under 100' },
  { key: '100-500', label: '100 to 500' },
  { key: '500-1000', label: '500 to 1,000' },
  { key: '1000+', label: 'Over 1,000' },
]
export function editSizeRows(p: UserProfile | null) {
  const b = p?.article_edit_activity?.distribution?.buckets
  return EDIT_SIZE_BINS.map(({ key, label }) => ({
    label,
    count: b?.[key]?.count ?? null,
    percent: b?.[key]?.percent ?? null,
  }))
}

export function formatDate(iso: string | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export const formatInt = (n: number | null | undefined) =>
  n == null ? null : n.toLocaleString('en-US')

/** Render an unknown list item (barnstar, block, adminship record) legibly. */
export function describeItem(item: unknown): string {
  if (item == null) return ''
  if (typeof item === 'string') return item
  if (typeof item === 'object') {
    const o = item as Record<string, unknown>
    for (const k of ['title', 'name', 'reason', 'summary', 'action', 'text'])
      if (typeof o[k] === 'string') return o[k] as string
    return JSON.stringify(item)
  }
  return String(item)
}
