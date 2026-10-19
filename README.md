# Wikipedia talk-page prototype

Static research prototype: participants read a frozen snapshot of a Wikipedia
talk-page discussion (left) and inspect information about the editors who took
part (right). No backend; deploys to GitHub Pages.

## Layout

```
public/data/
  manifest.json                    list of discussions (one line per talk section)
  discussions/<id>/talk.html       snapshot of the rendered section, pinned to a revision
  discussions/<id>/meta.json       participants and comment ids (generated)
  users/<User_name>.json           one profile per editor, produced by the scraper
scripts/fetch_snapshot.py          manifest.json -> talk.html + meta.json
src/
  App.tsx                          layout, discussion selection, active user state
  components/TalkPane.tsx          renders the snapshot; links, hover previews, highlight
  components/UserTabs.tsx          one tab per registered participant
  components/UserPanel.tsx         right-hand panel (section shells only so far)
  talk.css                         Wikipedia look-alike styling; hides Reply / edit source
  highlight.ts, links.ts, preview.ts
.github/workflows/deploy.yml       builds and publishes to Pages on every push to main
```

## How it behaves

- Left pane: the talk section exactly as Wikipedia rendered it at the pinned
  revision. Every link opens in a new tab. Hovering a link for about a third
  of a second shows a preview (live, from Wikipedia's page-summary API; for
  diff and history links it shows the URL).
- Reply, "...", and edit-source controls are present in the snapshot but
  hidden by three CSS lines at the top of `src/talk.css`. Delete a line to
  bring a control back.
- "<User> in the discussion" toggles a light-yellow highlight on every
  comment signed by the user whose tab is active. Switching tabs turns the
  highlight off. The set of comments comes from the user's JSON profile:
  each entry in `discussion_participation.posts` ends in a signature
  timestamp, which is matched to the snapshot's comment ids
  (`src/highlightSource.ts`). If no profile exists or nothing matches, the
  snapshot's own comment ids are used.
- Tabs: one per registered account that signed a comment AND has a profile
  file in `public/data/users/`, alphabetical. IP editors and users without a
  profile get no tab (add the JSON file and the tab appears). The tab
  that is active when the page opens is set per discussion by `defaultUser`
  in `manifest.json` (first tab if absent).
- Right panel, built to the 16-frame design PDF:
  - Account information: six cards. Barnstars, admin and blocked open
    popovers listing `barnstars_found`, `adminship_history` and
    `block_history`; User page summary opens an empty placeholder.
  - Recent edit activity: segment widths are proportional to
    `user_contribs.recent_contribs.*.edit_count`. Clicking a segment opens
    the detail view for that namespace (unique page count, Top 10 pages from
    `edit_counts_by_page`, and placeholder boxes). The "since" date is the
    constant `RECENT_SINCE_LABEL` in `src/profileData.ts`.
  - Social network: both Top 10 lists come from `social_network`
    (`user_talk_social_network` and `article_talk_social_network`).
  - While the highlight is on, an overlay card covers the account panel
    ("Behavior in the discussion seems...").
  - Every area marked "(llm interpretation)" or "(explanation)" in the design
    is rendered as a labeled empty box (`src/components/Placeholder.tsx`).
    The Article edit size table reads `article_edit_activity.distribution`.

## Editing content without a toolchain

Everything under `public/data/` is plain JSON or HTML and is read at runtime.
Edit a file in GitHub's web editor, commit to `main`, and the site redeploys
in about a minute. No local install needed for content changes.

## Adding a discussion

1. Find the revision id (`oldid`) you want to freeze and the section index
   (`https://en.wikipedia.org/w/api.php?action=parse&oldid=<oldid>&prop=sections`).
2. Add an entry to `public/data/manifest.json` (include `defaultUser` for the
   tab that should be active on load).
3. Run `python3 scripts/fetch_snapshot.py <id>` (Python 3, no dependencies).
   This writes `talk.html` and `meta.json`.
4. Run the scraper for each name in `meta.json` `participants` and save the
   output as `public/data/users/<Name_with_underscores>.json`.
5. Commit. The discussion appears in the dropdown; `?discussion=<id>` links to it directly.

Participants are derived from the snapshot's DiscussionTools comment markers,
so new discussions populate their tabs automatically.

## Local development

```
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check and build to dist/
```

## Deployment

In the GitHub repo: Settings > Pages > Source: "GitHub Actions". The workflow
sets the Vite base path to `/<repo-name>/`, so the repo can have any name.

## Known gaps

- External-link numbers ([1], [2]...) restart at 1 because only the section
  was rendered; on the live page they continue from earlier sections.
- Hover previews depend on network access to en.wikipedia.org at test time.
  To make them offline-safe, replace `getPreview` in `src/preview.ts` with a
  lookup into a pre-fetched JSON file.
- No participant logging (deliberately out of scope for now). A dropdown in
  the top-left toolbar switches discussions when the manifest has more than
  one; the `?discussion=<id>` URL parameter deep-links to one.
