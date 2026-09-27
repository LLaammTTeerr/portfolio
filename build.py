#!/usr/bin/env python3
"""
Build the site: the portfolio + the Field Notes blog  →  _site/

    python3 build.py                      production build (drafts excluded)
    python3 build.py --drafts --staging   staging build (drafts shown, noindex, banner)
    python3 build.py serve                local preview: staging build + rebuild on save
                                          at http://127.0.0.1:8767

Posts live in posts/*.md (see posts/_template.md). Files starting with "_" are
ignored. Everything else at the repo root (index.html, css/, js/, favicon.svg,
assets/) is copied through untouched, so index.html still works on double-click.

All links between pages are relative, so the output works at any base path:
a custom domain, a github.io project URL, or a local folder.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import http.server
import json
import re
import shutil
import sys
import textwrap
import threading
import time
from functools import partial
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

import markdown
import yaml
from markdown.extensions.toc import slugify_unicode
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import TextLexer, get_lexer_by_name
from pygments.util import ClassNotFound

ROOT = Path(__file__).resolve().parent
POSTS = ROOT / "posts"
TEMPLATES = ROOT / "templates"
PASSTHROUGH = ["index.html", "favicon.svg", "css", "js", "assets"]
WORDS_PER_MINUTE = 230
KATEX = "https://cdn.jsdelivr.net/npm/katex@0.18.9/dist"

LANGS = {
    "en": {"label": "EN", "name": "English", "min": "min read",
           "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]},
    "vi": {"label": "VI", "name": "Tiếng Việt", "min": "phút đọc",
           "months": [f"thg {i}" for i in range(1, 13)]},
}
CODE_LABELS = {"cpp": "C++", "c++": "C++", "c": "C", "py": "Python", "python": "Python", "js": "JavaScript",
               "javascript": "JavaScript", "ts": "TypeScript", "typescript": "TypeScript", "rs": "Rust",
               "rust": "Rust", "go": "Go", "java": "Java", "sh": "Shell", "bash": "Shell", "console": "Console",
               "json": "JSON", "yaml": "YAML", "html": "HTML", "css": "CSS", "sql": "SQL", "text": "Text", "": "Text"}


class BuildError(Exception):
    pass


# --------------------------------------------------------------------------- site identity
def read_identity() -> dict:
    """Pull name + location from js/content.js so there is one place to edit them."""
    src = (ROOT / "js" / "content.js").read_text("utf-8")
    person = re.search(r"person:\s*\{(.*?)\n  \}", src, re.S)
    block = person.group(1) if person else src
    def grab(pattern, default):
        m = re.search(pattern, block)
        return m.group(1) if m else default
    return {
        "name": grab(r'\bname:\s*"([^"]+)"', "Your Name"),
        "lat": float(grab(r"\blat:\s*(-?[\d.]+)", "0")),
        "lng": float(grab(r"\blng:\s*(-?[\d.]+)", "0")),
    }


# --------------------------------------------------------------------------- markdown
FRONT_MATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*(?:\n|\Z)", re.S)
FENCE = re.compile(r"^(?P<ind>[ \t]*)(?P<fence>`{3,}|~{3,})[ \t]*(?P<info>[^\n`]*)\n(?P<code>.*?)^(?P=ind)(?P=fence)[ \t]*$",
                   re.M | re.S)
INLINE_CODE = re.compile(r"``[^\n]+?``|`[^`\n]+`")
DISPLAY_MATH = re.compile(r"\$\$(.+?)\$\$", re.S)
INLINE_MATH = re.compile(r"(?<![\\$\w])\$(?=\S)([^$\n]+?)(?<=\S)\$(?![\w$])")


def code_block(code: str, lang: str) -> str:
    try:
        lexer = get_lexer_by_name(lang) if lang else TextLexer()
    except ClassNotFound:
        lexer = TextLexer()
    body = highlight(code, lexer, HtmlFormatter(nowrap=True))
    label = CODE_LABELS.get(lang.lower(), lang)
    return (f'<figure class="code"><figcaption><span class="mono">{html.escape(label)}</span>'
            f'<button class="code-copy mono" type="button">Copy</button></figcaption>'
            f'<pre><code>{body}</code></pre></figure>')


def render_markdown(src: str) -> tuple[str, list, bool]:
    """Markdown → HTML, with Pygments code blocks and KaTeX-ready math. Returns (html, toc_tokens, has_math)."""
    stash: dict[str, str] = {}

    def put(fragment: str) -> str:
        key = f"XQPH{len(stash):04d}QX"
        stash[key] = fragment
        return key

    # 1. fenced code first, so nothing inside it is treated as math or markdown
    def fence(m):
        info = m.group("info").strip().split()
        code = textwrap.dedent(m.group("ind") + m.group("code")) if m.group("ind") else m.group("code")
        return f"\n\n{put(code_block(code.rstrip(chr(10)), info[0] if info else ''))}\n\n"
    src = FENCE.sub(fence, src)

    # 2. hide inline code and escaped dollars while looking for math
    masked: dict[str, str] = {}
    def mask(m):
        key = f"XQIC{len(masked):04d}QX"
        masked[key] = m.group(0)
        return key
    src = INLINE_CODE.sub(mask, src).replace(r"\$", "XQDOLLARQX")

    # 3. math → placeholders holding \[..\] / \(..\) for KaTeX auto-render
    has_math = False
    def display(m):
        nonlocal has_math
        has_math = True
        return f"\n\n{put('<div class=\"math-display\">\\[' + html.escape(m.group(1).strip()) + '\\]</div>')}\n\n"
    def inline(m):
        nonlocal has_math
        has_math = True
        return put('<span class="math-inline">\\(' + html.escape(m.group(1)) + '\\)</span>')
    src = INLINE_MATH.sub(inline, DISPLAY_MATH.sub(display, src))

    for key, raw in masked.items():
        src = src.replace(key, raw)

    md = markdown.Markdown(
        extensions=["tables", "footnotes", "admonition", "attr_list", "md_in_html", "sane_lists", "toc"],
        extension_configs={
            "toc": {"slugify": slugify_unicode, "toc_depth": "2-3", "permalink": "#",
                    "permalink_class": "anchor", "permalink_title": "Link to this section"},
            "footnotes": {"BACKLINK_TEXT": "↩"},
        },
    )
    out = md.convert(src)
    for key, fragment in stash.items():
        out = out.replace(f"<p>{key}</p>", fragment).replace(key, fragment)
    out = out.replace("XQDOLLARQX", "$")
    out = re.sub(r"<img(?![^>]*\bloading=)", '<img loading="lazy"', out)
    return out, md.toc_tokens, has_math


# --------------------------------------------------------------------------- posts
def parse_date(value, where: str) -> dt.date:
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    try:
        return dt.date.fromisoformat(str(value))
    except ValueError:
        raise BuildError(f"{where}: date must be YYYY-MM-DD, got {value!r}")


def load_post(path: Path) -> dict:
    text = path.read_text("utf-8")
    m = FRONT_MATTER.match(text)
    if not m:
        raise BuildError(f"{path.name}: missing front matter (--- … --- at the top)")
    try:
        meta = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError as e:
        raise BuildError(f"{path.name}: front matter is not valid YAML: {e}")
    body = text[m.end():]

    named = re.match(r"(\d{4}-\d{2}-\d{2})-(.+)", path.stem)
    if not meta.get("title"):
        raise BuildError(f"{path.name}: 'title' is required")
    date = parse_date(meta.get("date") or (named and named.group(1)), path.name) if (meta.get("date") or named) else None
    if not date:
        raise BuildError(f"{path.name}: 'date' is required (or name the file YYYY-MM-DD-slug.md)")
    lang = str(meta.get("lang", "en")).lower()
    if lang not in LANGS:
        raise BuildError(f"{path.name}: lang must be one of {', '.join(LANGS)}")
    slug = str(meta.get("slug") or (named.group(2) if named else path.stem))
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        raise BuildError(f"{path.name}: slug {slug!r} must be lowercase letters, digits and dashes")

    content, toc, has_math = render_markdown(body)
    words = len(re.sub(r"<[^>]+>", " ", content).split())
    tags = meta.get("tags") or []
    return {
        "source": path.name,
        "title": str(meta["title"]),
        "date": date,
        "slug": slug,
        "lang": lang,
        "kind": str(meta.get("kind", "Essay")),
        "summary": str(meta.get("summary", "")),
        "tags": [str(t) for t in (tags if isinstance(tags, list) else [tags])],
        "draft": bool(meta.get("draft", False)),
        "hue": int(meta["hue"]) if meta.get("hue") is not None else None,
        "minutes": max(1, round(words / WORDS_PER_MINUTE)),
        "content": content,
        "toc": toc,
        "has_math": has_math,
    }


def load_posts(include_drafts: bool) -> list[dict]:
    posts, slugs = [], {}
    for path in sorted(POSTS.glob("*.md")):
        if path.name.startswith("_"):
            continue
        post = load_post(path)
        if post["slug"] in slugs:
            raise BuildError(f"{path.name}: slug '{post['slug']}' already used by {slugs[post['slug']]}")
        slugs[post["slug"]] = path.name
        if post["draft"] and not include_drafts:
            continue
        posts.append(post)
    posts.sort(key=lambda p: (p["date"], p["slug"]))
    for i, p in enumerate(posts, 1):
        p["entry"] = i
    return list(reversed(posts))          # newest first


# --------------------------------------------------------------------------- templates
def render(template: str, ctx: dict) -> str:
    def sub(m):
        key = m.group(1)
        if key not in ctx:
            raise BuildError(f"template uses {{{{ {key} }}}} but the build doesn't provide it")
        return str(ctx[key])
    return re.sub(r"\{\{\s*(\w+)\s*\}\}", sub, template)


def tpl(name: str) -> str:
    return (TEMPLATES / name).read_text("utf-8")


def esc(s) -> str:
    return html.escape(str(s), quote=True)


def human_date(d: dt.date, lang: str) -> str:
    return f"{d.day} {LANGS[lang]['months'][d.month - 1]} {d.year}" if lang == "en" \
        else f"{d.day} {LANGS[lang]['months'][d.month - 1]}, {d.year}"


def coords(ident: dict, n: int) -> str:
    lat, lng = ident["lat"] + n * 0.0071, ident["lng"] - n * 0.0093
    return f"{abs(lat):.4f}° {'N' if lat >= 0 else 'S'} · {abs(lng):.4f}° {'E' if lng >= 0 else 'W'}"


def hue_for(post: dict) -> int:
    if post["hue"] is not None:
        return post["hue"] % 360
    return sum(ord(c) * (i + 1) for i, c in enumerate(post["slug"])) % 360


def canonical(cfg, path: str) -> str:
    if not cfg.base_url:
        return ""
    url = esc(f"{cfg.base_url}/{path}")
    return f'<link rel="canonical" href="{url}">\n  <meta property="og:url" content="{url}">'


def toc_html(tokens: list) -> str:
    items = [t for t in tokens if t["level"] == 2]
    if len(items) < 3:
        return ""
    def li(t):
        kids = "".join(f'<li><a href="#{esc(c["id"])}">{c["name"]}</a></li>' for c in t.get("children", []) if c["level"] == 3)
        return f'<li><a href="#{esc(t["id"])}">{t["name"]}</a>{f"<ol>{kids}</ol>" if kids else ""}</li>'
    return (f'<nav class="toc" aria-label="On this page"><p class="mono">On this route</p>'
            f'<ol>{"".join(li(t) for t in items)}</ol></nav>')


def chrome(ctx_root: str, ident: dict, staging: bool, build_label: str) -> dict:
    return {
        "header": render(tpl("_header.html"), {"root": ctx_root, "name": esc(ident["name"])}),
        "footer": render(tpl("_footer.html"), {"root": ctx_root, "name": esc(ident["name"]),
                                                "year": dt.date.today().year}),
        "robots": '<meta name="robots" content="noindex, nofollow">' if staging else "",
        "staging_banner": (f'<div class="staging-banner mono" role="note">Staging · drafts visible · {esc(build_label)}</div>'
                           if staging else ""),
    }


# --------------------------------------------------------------------------- pages
def build_post(post: dict, prev: dict | None, nxt: dict | None, ident: dict, cfg) -> str:
    root = "../../"
    lang = LANGS[post["lang"]]
    katex = (f'<link rel="stylesheet" href="{KATEX}/katex.min.css">\n'
             f'  <script defer src="{KATEX}/katex.min.js"></script>\n'
             f'  <script defer src="{KATEX}/contrib/auto-render.min.js"></script>') if post["has_math"] else ""
    def neighbour(p, rel):
        if not p:
            return f'<span class="pn-empty" aria-hidden="true"></span>'
        label = "Older entry" if rel == "prev" else "Newer entry"
        return (f'<a class="pn pn-{rel}" href="../{esc(p["slug"])}/" rel="{rel}">'
                f'<span class="mono">{label} · {p["entry"]:03d}</span><span class="pn-title">{esc(p["title"])}</span></a>')
    tags = "".join(f'<span class="chip">#{esc(t)}</span>' for t in post["tags"])
    ctx = {
        "root": root,
        "lang": post["lang"],
        "title": esc(post["title"]),
        "page_title": esc(f'{post["title"]} — {ident["name"]}'),
        "description": esc(post["summary"] or post["title"]),
        "canonical": canonical(cfg, f'notes/{post["slug"]}/'),
        "katex": katex,
        "entry": f'{post["entry"]:03d}',
        "kind": esc(post["kind"]),
        "date_iso": post["date"].isoformat(),
        "date_human": esc(human_date(post["date"], post["lang"])),
        "minutes": f'{post["minutes"]} {lang["min"]}',
        "lang_label": lang["label"],
        "lang_name": lang["name"],
        "coords": coords(ident, post["entry"]),
        "summary": esc(post["summary"]),
        "tags": f'<div class="post-tags">{tags}</div>' if tags else "",
        "draft_badge": '<span class="draft-badge mono">Draft — not on production</span>' if post["draft"] else "",
        "seed": esc(post["slug"]),
        "hue": hue_for(post),
        "toc": toc_html(post["toc"]),
        "has_toc": "has-toc" if toc_html(post["toc"]) else "",
        "content": post["content"],
        "prev": neighbour(prev, "prev"),
        "next": neighbour(nxt, "next"),
        "author": esc(ident["name"]),
        **chrome(root, ident, cfg.staging, cfg.build_label),
    }
    return render(tpl("post.html"), ctx)


def build_archive(posts: list[dict], ident: dict, cfg) -> str:
    root = "../"
    kinds = sorted({p["kind"] for p in posts})
    langs = [l for l in LANGS if any(p["lang"] == l for p in posts)]
    def chip(group, value, label, count, on=False):
        return (f'<button class="filter" type="button" data-{group}="{esc(value)}" aria-pressed="{str(on).lower()}">'
                f'{esc(label)}<sup>{count:02d}</sup></button>')
    filters = ""
    if posts:
        filters = ('<div class="filters" role="group" aria-label="Filter by kind">'
                   + chip("kind", "*", "All", len(posts), True)
                   + "".join(chip("kind", k, k, sum(p["kind"] == k for p in posts)) for k in kinds) + "</div>")
        if len(langs) > 1:
            filters += ('<div class="filters" role="group" aria-label="Filter by language">'
                        + chip("lang", "*", "Any language", len(posts), True)
                        + "".join(chip("lang", l, LANGS[l]["name"], sum(p["lang"] == l for p in posts)) for l in langs)
                        + "</div>")
    years: dict[int, list] = {}
    for p in posts:
        years.setdefault(p["date"].year, []).append(p)
    rows = []
    for year, items in years.items():
        lis = "".join(
            f'<li class="entry" data-kind="{esc(p["kind"])}" data-lang="{p["lang"]}">'
            f'<a href="{esc(p["slug"])}/" lang="{p["lang"]}">'
            f'<span class="entry-no mono">{p["entry"]:03d}</span>'
            f'<span class="entry-date mono">{esc(human_date(p["date"], "en"))}</span>'
            f'<span class="entry-main"><span class="entry-title">{esc(p["title"])}</span>'
            f'{f"<span class=entry-summary>{esc(p["summary"])}</span>" if p["summary"] else ""}</span>'
            f'<span class="entry-meta mono"><span class="chip">{esc(p["kind"])}</span>'
            f'<span class="lang-tag">{LANGS[p["lang"]]["label"]}</span>'
            f'{"<span class=draft-dot title=Draft>Draft</span>" if p["draft"] else ""}'
            f'<span>{p["minutes"]}′</span></span></a></li>' for p in items)
        rows.append(f'<section class="year" data-year="{year}"><h2 class="year-label">{year}</h2><ol>{lis}</ol></section>')
    empty = ('<p class="empty">The logbook is empty — the first entry is on its way.</p>' if not posts else
             '<p class="empty" hidden id="filter-empty">No entries match these filters.</p>')
    ctx = {
        "root": root,
        "page_title": esc(f'Field Notes — {ident["name"]}'),
        "description": esc(f'Stories, algorithms and build logs by {ident["name"]}.'),
        "canonical": canonical(cfg, "notes/"),
        "count": f"{len(posts):03d}",
        "coords": coords(ident, 0),
        "filters": filters,
        "years": "".join(rows),
        "empty": empty,
        **chrome(root, ident, cfg.staging, cfg.build_label),
    }
    return render(tpl("notes.html"), ctx)


def build_404(ident: dict, cfg) -> str:
    # GitHub Pages serves this at any missing path, so it must use root-absolute URLs.
    return render(tpl("404.html"), {"root": "/", "name": esc(ident["name"]),
                                    **chrome("/", ident, cfg.staging, cfg.build_label)})


def build_feed(posts: list[dict], ident: dict, base: str) -> str:
    base = base or ""
    updated = (posts[0]["date"] if posts else dt.date.today()).isoformat() + "T00:00:00Z"
    entries = "".join(f"""
  <entry>
    <title>{xml_escape(p["title"])}</title>
    <link href="{base}/notes/{p["slug"]}/"/>
    <id>{base}/notes/{p["slug"]}/</id>
    <updated>{p["date"].isoformat()}T00:00:00Z</updated>
    <category term="{xml_escape(p["kind"])}"/>
    <summary>{xml_escape(p["summary"])}</summary>
    <content type="html">{xml_escape(p["content"])}</content>
  </entry>""" for p in posts[:30])
    return f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>{xml_escape(ident["name"])} — Field Notes</title>
  <link href="{base}/notes/"/>
  <link rel="self" href="{base}/feed.xml"/>
  <id>{base}/notes/</id>
  <updated>{updated}</updated>
  <author><name>{xml_escape(ident["name"])}</name></author>{entries}
</feed>
"""


def homepage(posts: list[dict], cfg) -> str:
    """index.html with the latest entries inlined for the Field Notes cards (plus staging bits)."""
    page = (ROOT / "index.html").read_text("utf-8")
    cards = [{"kind": p["kind"], "date": p["date"].isoformat(), "minutes": p["minutes"], "title": p["title"],
              "excerpt": p["summary"], "url": f'notes/{p["slug"]}/', "lang": LANGS[p["lang"]]["label"],
              "draft": p["draft"]} for p in posts[:5]]
    data = json.dumps(cards, ensure_ascii=False).replace("</", "<\\/")
    marker = "<!-- build:notes -->"
    if marker not in page:
        raise BuildError(f"index.html is missing the {marker} marker")
    page = page.replace(marker, f"<script>window.PORTFOLIO_NOTES = {data};</script>")
    if cfg.base_url:
        page = page.replace('<meta property="og:type" content="website">',
                            f'<meta property="og:type" content="website">\n  <link rel="canonical" href="{esc(cfg.base_url)}/">\n'
                            f'  <link rel="alternate" type="application/atom+xml" title="Field Notes" href="feed.xml">')
    if cfg.staging:
        c = chrome("", {"name": ""}, True, cfg.build_label)
        page = page.replace("<meta charset=\"utf-8\">", "<meta charset=\"utf-8\">\n  " + c["robots"], 1)
        page = page.replace("<body>", "<body>\n  " + c["staging_banner"], 1)
    return page


# --------------------------------------------------------------------------- build
def build(cfg) -> dict:
    t0 = time.perf_counter()
    out = cfg.out.resolve()
    if out == ROOT or ROOT.is_relative_to(out):
        raise BuildError(f"refusing to build into {out}")
    ident = read_identity()
    posts = load_posts(cfg.drafts)

    tmp = out.with_name(out.name + ".tmp")
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    for name in PASSTHROUGH:
        src = ROOT / name
        if src.is_dir():
            shutil.copytree(src, tmp / name)
        elif src.exists():
            shutil.copy2(src, tmp / name)

    (tmp / "index.html").write_text(homepage(posts, cfg), "utf-8")
    (tmp / "notes").mkdir()
    (tmp / "notes" / "index.html").write_text(build_archive(posts, ident, cfg), "utf-8")
    for i, post in enumerate(posts):                       # posts are newest-first
        newer = posts[i - 1] if i > 0 else None
        older = posts[i + 1] if i + 1 < len(posts) else None
        d = tmp / "notes" / post["slug"]
        d.mkdir()
        (d / "index.html").write_text(build_post(post, older, newer, ident, cfg), "utf-8")
    (tmp / "404.html").write_text(build_404(ident, cfg), "utf-8")
    (tmp / "feed.xml").write_text(build_feed(posts, ident, cfg.base_url), "utf-8")
    (tmp / ".nojekyll").write_text("")
    if cfg.cname:
        (tmp / "CNAME").write_text(cfg.cname + "\n")
    if cfg.staging:
        (tmp / "robots.txt").write_text("User-agent: *\nDisallow: /\n")
    else:
        sitemap_base = cfg.base_url or ""
        urls = [f"{sitemap_base}/", f"{sitemap_base}/notes/"] + [f"{sitemap_base}/notes/{p['slug']}/" for p in posts]
        (tmp / "sitemap.xml").write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"  <url><loc>{xml_escape(u)}</loc></url>\n" for u in urls) + "</urlset>\n")
        (tmp / "robots.txt").write_text("User-agent: *\nAllow: /\n"
                                        + (f"Sitemap: {cfg.base_url}/sitemap.xml\n" if cfg.base_url else ""))

    # swap in atomically-ish so a running preview server never sees a half-built site
    old = out.with_name(out.name + ".old")
    if old.exists():
        shutil.rmtree(old)
    if out.exists():
        out.rename(old)
    tmp.rename(out)
    if old.exists():
        shutil.rmtree(old)

    drafts = sum(p["draft"] for p in posts)
    return {"posts": len(posts), "drafts": drafts, "ms": round((time.perf_counter() - t0) * 1000)}


def watched_state() -> dict:
    paths = [ROOT / "index.html", ROOT / "favicon.svg", ROOT / "build.py"]
    for d in ("posts", "templates", "css", "js", "assets"):
        if (ROOT / d).exists():
            paths += [p for p in (ROOT / d).rglob("*") if p.is_file()]
    return {str(p): p.stat().st_mtime_ns for p in paths if p.exists()}


def serve(cfg) -> None:
    def report(tag):
        try:
            r = build(cfg)
            print(f"[{time.strftime('%H:%M:%S')}] {tag}: {r['posts']} entries ({r['drafts']} drafts) in {r['ms']} ms", flush=True)
        except BuildError as e:
            print(f"[{time.strftime('%H:%M:%S')}] build failed: {e}", file=sys.stderr, flush=True)
    report("built")
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            super().end_headers()
    # The handler serves by path, so it keeps working when a rebuild swaps the folder.
    server = http.server.ThreadingHTTPServer((cfg.host, cfg.port), partial(Quiet, directory=str(cfg.out.resolve())))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"Previewing on http://{cfg.host}:{cfg.port}/ — drafts shown, rebuilding on save. Ctrl+C to stop.", flush=True)
    state = watched_state()
    try:
        while True:
            time.sleep(0.8)
            now = watched_state()
            if now != state:
                state = now
                report("rebuilt")
    except KeyboardInterrupt:
        server.shutdown()


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", nargs="?", choices=["build", "serve"], default="build")
    ap.add_argument("--out", type=Path, default=ROOT / "_site", help="output folder (default: _site)")
    ap.add_argument("--drafts", action="store_true", help="include posts with draft: true")
    ap.add_argument("--staging", action="store_true", help="noindex + robots Disallow + staging banner")
    ap.add_argument("--base-url", default="", help="absolute site URL for feed/sitemap/canonical, e.g. https://lamter.cc")
    ap.add_argument("--cname", default="", help="write a CNAME file for GitHub Pages")
    ap.add_argument("--label", default="", help="text shown in the staging banner (default: build time)")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8767)
    cfg = ap.parse_args(argv)
    cfg.base_url = cfg.base_url.rstrip("/")
    cfg.build_label = cfg.label or time.strftime("built %Y-%m-%d %H:%M")
    if cfg.command == "serve":
        cfg.drafts = cfg.staging = True
        serve(cfg)
        return 0
    try:
        r = build(cfg)
    except BuildError as e:
        print(f"build failed: {e}", file=sys.stderr)
        return 1
    print(f"built {cfg.out}: {r['posts']} entries ({r['drafts']} drafts) in {r['ms']} ms")
    return 0


if __name__ == "__main__":
    sys.exit(main())
