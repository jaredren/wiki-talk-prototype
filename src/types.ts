export interface ManifestEntry {
  id: string
  page: string
  section: string
  anchor: string
  sectionIndex: number
  oldid: number
  source: string
  /** Tab selected when the discussion opens. Falls back to the first tab. */
  defaultUser?: string
}

export interface Manifest {
  discussions: ManifestEntry[]
}

export interface Participant {
  name: string
  isIP: boolean
  comments: number
}

export interface CommentRef {
  id: string
  author: string
}

export interface DiscussionMeta {
  id: string
  page: string
  section: string
  oldid: number
  source: string | null
  commentCount: number
  participants: Participant[]
  comments: CommentRef[]
}

/**
 * Shape of public/data/users/<User_name>.json as produced by the scraper
 * (derived from the Yvan_Part.json sample, 2026-10-18). Fields not yet used
 * by the UI are typed loosely on purpose.
 */
export interface UserProfile {
  account_information: {
    username: string
    account_created: string // ISO 8601
    total_edit_count: number
  }
  discussion_participation: {
    source_url: string
    page: string
    discussion_title: string
    /** Each post as raw wikitext, ending in the user's signature and timestamp. */
    posts: string[]
  }
  block_information: {
    current_block_information: {
      currently_blocked: boolean
      current_block_reason: string | null
      current_block_expiry: string | null
      current_block_timestamp: string | null
    }
    block_history: unknown[]
  }
  admin_information: {
    is_admin_now: boolean
    adminship_history: unknown[]
  }
  user_page: {
    has_user_page: boolean
    user_page_wikitext: string
  }
  user_talk_page: {
    pages_fetched: unknown[]
    barnstars_found: unknown[]
    barnstar_count: number
    social_networks_found: Record<string, { their_posts_on_my_talk_count: number }>
  }
  social_network?: {
    total_count: number
    social_networks: Record<string, number>
    /** username -> interaction count on user talk pages */
    user_talk_social_network: Record<string, number>
    /** username -> number of shared article talk discussions */
    article_talk_social_network: Record<string, number>
  }
  article_edit_activity?: {
    distribution: {
      total_edit_count: number
      buckets: Record<'<100' | '100-500' | '500-1000' | '1000+', { count: number; percent: number }>
    }
    diff_sample: Record<string, unknown[]>
  }
  user_contribs: {
    recent_edit_count: number
    recent_contribs: Record<
      | 'article_page_contribs'
      | 'article_talk_page_contribs'
      | 'user_talk_page_contribs'
      | 'WP_page_contribs'
      | 'WP_talk_page_contribs',
      { edit_count: number; unique_page_count: number; edit_counts_by_page: Record<string, number> }
    >
  }
}
