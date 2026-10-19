#!/usr/bin/env python3
"""
Build discussion snapshots from public/data/manifest.json.

For every entry in the manifest this script:
  1. Fetches the rendered HTML of ONE talk-page section at a pinned revision
     (MediaWiki action=parse). The output includes DiscussionTools markers
     (data-mw-comment-start / data-mw-comment-sig) that give per-comment
     author boundaries, which the UI uses for highlighting.
  2. Writes it unchanged to public/data/discussions/<id>/talk.html.
  3. Extracts the participant list from the comment ids and writes
     public/data/discussions/<id>/meta.json.

Nothing is sanitised here on purpose: Reply / edit-source / overflow menus
stay in the snapshot and are hidden by CSS in the app (src/talk.css), so
re-enabling them later is a one-line change.

Usage:
    python3 scripts/fetch_snapshot.py            # all entries
    python3 scripts/fetch_snapshot.py <id> ...   # only these ids
    python3 scripts/fetch_snapshot.py --meta-only  # rebuild meta.json from
                                                   # existing talk.html files
                                                   # (no network)

Manifest entry fields:
    id            folder name under public/data/discussions/
    page          e.g. "Talk:Cappuccino"
    sectionIndex  index from action=parse&prop=sections at that oldid
    oldid         revision id to pin
    section, anchor, source   informational

Wikimedia asks for a descriptive User-Agent; edit USER_AGENT before running.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
API = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "WikiTalkPrototype/0.1 (research prototype; contact: renjared@uw.edu)"

COMMENT_ID_RE = re.compile(r'data-mw-comment-start="" id="(c-[^"]+)"')
IPV4_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")
IPV6_RE = re.compile(r"^[0-9A-Fa-f:]+$")


def api_get(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def fetch_section_html(page: str, oldid: int, section_index: int) -> str:
    data = api_get({
        "action": "parse",
        "oldid": oldid,
        "section": section_index,
        "prop": "text",
    })
    return data["parse"]["text"]["*"]


def author_from_comment_id(cid: str) -> str:
    # ids look like c-Yvan_Part-20240819150600-Sapsby-20240819125600
    # author is everything between "c-" and the first "-YYYYMMDDhhmmss"
    body = cid[2:]
    m = re.match(r"(.+?)-\d{14}", body)
    name = m.group(1) if m else body
    return urllib.parse.unquote(name).replace("_", " ")


def is_ip(name: str) -> bool:
    return bool(IPV4_RE.match(name) or (":" in name and IPV6_RE.match(name)))


def build_meta(entry: dict, html: str) -> dict:
    ids = COMMENT_ID_RE.findall(html)
    comments = []
    seen: list[str] = []
    for cid in ids:
        author = author_from_comment_id(cid)
        comments.append({"id": cid, "author": author})
        if author not in seen:
            seen.append(author)
    participants = [
        {"name": n, "isIP": is_ip(n), "comments": sum(1 for c in comments if c["author"] == n)}
        for n in seen
    ]
    title_m = re.search(r'<h2 id="[^"]*"[^>]*>(?:<span[^>]*></span>)?([^<]+)', html)
    return {
        "id": entry["id"],
        "page": entry["page"],
        "section": entry.get("section") or (title_m.group(1).strip() if title_m else ""),
        "oldid": entry["oldid"],
        "source": entry.get("source"),
        "commentCount": len(comments),
        "participants": participants,
        "comments": comments,
    }


def main(argv: list[str]) -> int:
    meta_only = "--meta-only" in argv
    wanted = [a for a in argv if not a.startswith("--")]
    manifest = json.loads((DATA / "manifest.json").read_text())
    for entry in manifest["discussions"]:
        if wanted and entry["id"] not in wanted:
            continue
        out = DATA / "discussions" / entry["id"]
        out.mkdir(parents=True, exist_ok=True)
        talk = out / "talk.html"
        if meta_only:
            html = talk.read_text()
        else:
            print(f"fetching {entry['page']} section {entry['sectionIndex']} @ {entry['oldid']}")
            html = fetch_section_html(entry["page"], entry["oldid"], entry["sectionIndex"])
            talk.write_text(html)
        meta = build_meta(entry, html)
        (out / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
        print(f"  {entry['id']}: {meta['commentCount']} comments, "
              f"{len(meta['participants'])} participants -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
