# The Atlas — portfolio template

A portfolio laid out like a topographic survey sheet: warm paper, ink contour lines and one signal-orange accent. It has a night-chart dark mode too. The portfolio is plain static files: open `index.html` and it works. The blog adds one small Python build step (`build.py`), which the GitHub workflows run for you.

```
index.html        page shell (landmarks, dialogs, header)
css/style.css     all styling — design tokens live at the top
css/notes.css     blog reading mode (posts, archive, 404)
js/content.js     ← portfolio content (name, projects, jobs, skills…)
js/terrain.js     generative contour engine (hero, project + post artwork)
js/main.js        renders content.js into the page + interactions
js/notes.js       blog page behaviour (theme, TOC, copy, filters, math)
posts/*.md        ← blog posts (Markdown)
templates/        HTML for posts, the archive and the 404 page
build.py          builds everything into _site/ (and `serve` for live preview)
.github/workflows production, staging, and main→staging sync
```

## Fill it in

Everything on the page comes from **`js/content.js`**: text, projects, jobs, skills, links and section names. Replace the `[bracketed placeholders]`. Arrays can be any length and the layout adapts.

| What | Where in `content.js` | Notes |
|---|---|---|
| Name, role, tagline, email | `person` | The name splits across two lines at the first space. The second line is italic. |
| Rotating hero word | `person.rotatingWords` | Shown as "Building *interfaces*", "Building *systems*" and so on. |
| Live clock & map coordinates | `person.location` | `timeZone` takes an IANA name such as `Europe/Berlin`. `lat`/`lng` seed every coordinate label on the page. |
| Availability pill | `person.available` / `availability` | Set `available: false` for a grey dot. |
| Portrait | `person.photo` | Until you add one, a generated map fills the frame. |
| Section names | `sections` | Map-style names by default (Legend, Expeditions, The Route…). Rename them to plain words if you like. |
| Projects | `projects[]` | `hue` (0–360) tints the generated artwork. Set `image` to use a real screenshot instead. `id` becomes the deep link `#work/<id>`. |
| Experience | `experience[]` | Newest first. Each entry becomes a waypoint on the scroll-drawn trail. |
| Skills | `skills[]` | `level` 1–5 sets peak height on the elevation chart. Each group gets its own tab. |
| Writing | `notes[]` | The first entry is featured large. `sections.notes.archiveUrl` adds a closing "All field notes" card. Use `""` to drop it. |
| Contact & socials | `contact`, `socials[]` | The last word of `contact.heading` gets the accent italic. |

**Images**: put them in an `assets/` folder and reference them like `"assets/meridian.jpg"`. A 16:10 ratio works best for projects and 4:5 for the portrait.

## Restyle it

All colours, fonts and spacing are CSS custom properties at the top of `css/style.css`:

- **Accent**: `--accent` (light) and its twin in the two dark blocks. This one colour carries the whole identity. Try `#2F5DFF` (cobalt), `#1F8A5B` (survey green) or `#C2185B` (magenta).
- **Paper & ink**: `--paper`, `--ink` and friends. The dark palette is defined twice, once for the system preference and once for the manual toggle. Keep the two in sync.
- **Fonts**: swap the Google Fonts `<link>` in `index.html` and the `--serif` / `--sans` / `--mono` tokens.
- **Contour density**: in `js/terrain.js`, `Hero` → `this.step` (smaller means more lines) and `this.cell` (smaller means smoother and slower).

## What's in the box

- **Live terrain hero**: seeded Perlin noise turned into contour lines with marching squares. The ground rises under your cursor, the contour you're touching lights up in accent, and the map legend shows real coordinates and elevation for the point under the pointer. The animation pauses when the hero is off-screen or the tab is hidden.
- **Generated project artwork**: each project gets its own map tile, seeded from its `id`, so it never ships broken images. Tiles repaint on theme change.
- **Work list**: hover a row for a preview that trails the cursor and tilts with its speed. Click to open a full case-study sheet. ←/→ page between projects, Esc closes. Category filters are built automatically.
- **The Route**: your experience drawn as a trail that walks itself as you scroll, lighting each waypoint as you pass it.
- **Terrain**: skills as an elevation profile that morphs between groups. The same data appears as an accessible list below the chart.
- **Command palette**: `⌘K` / `Ctrl K` / `/` opens it. Jump to any section or project, toggle the theme or copy your email. Press `T` to toggle the theme.
- **Details**: crosshair cursor, magnetic buttons, masked word reveals, count-up stats, a compass that points at your cursor, a scroll "sheet index" on the right edge, a live local clock, a circular view-transition theme swap and a one-time preloader per session.

## Accessibility & resilience

- Semantic landmarks, a skip link, visible focus rings, native `<dialog>`s (focus is trapped and returned), keyboard tabs and a labelled palette.
- `prefers-reduced-motion` turns off the preloader, the terrain animation, the marquee, the reveals and the trail animation. Everything is shown in its final state.
- The custom cursor only appears on devices with a mouse. Touch devices get inline project artwork instead of hover previews.
- Works from `file://` because it uses no ES modules and no `fetch()`. Theme choice is saved in `localStorage`, and the page still works if storage is blocked.

## Field Notes (the blog)

Posts are Markdown files in `posts/`. `build.py` turns them into pages under `/notes/`, plus an archive, an RSS feed and a sitemap. It also puts the latest five posts on the homepage cards.

```bash
cp posts/_template.md posts/2026-10-01-my-post.md    # frontmatter is documented inside
python3 build.py serve                                # preview on http://127.0.0.1:8767, rebuilds on save
```

- **Frontmatter:** `title`, `date`, `kind` (free text, and every kind becomes a filter: Algorithm, Story, Build log, Flex…), `lang` (`en` or `vi`), `summary`, `tags`, `draft`, and optionally `slug` and `hue`.
- **What you can write:** fenced code with highlighting and a copy button, `$inline$` and `$$display$$` math (KaTeX), tables, footnotes and blockquotes. Callout boxes use `!!! note` / `tip` / `warning` / `complexity` / `flex`. See `posts/_template.md`.
- **`draft: true`** posts appear only on staging and in the local preview, never on lamter.cc.
- **Requirements:** Python 3.12+ and `pip install -r requirements.txt` (markdown, pygments and pyyaml, all pinned to match CI).

A private tailnet preview (`tailscale serve --https=8443 http://127.0.0.1:8767`) can run `build.py serve` as the user service `portfolio.service`, so saving a post updates it within about a second.

## Environments

| | Branch | URL | Drafts | Indexed |
|---|---|---|---|---|
| Local preview | working tree | `127.0.0.1:8767` (+ tailnet `:8443`) | yes | no |
| Staging | `staging` | https://staging.lamter.cc | yes | no (`noindex`, robots Disallow, banner) |
| Production | `main` | https://lamter.cc | no | yes |

**Workflow:** write on `staging` and push. `Staging` (`.github/workflows/staging.yml`) builds with drafts and publishes to staging.lamter.cc. When a post is ready, set `draft: false` and open a pull request from `staging` into `main`. Merging it runs `Production` and publishes to lamter.cc. Use a **merge commit, not squash**: a squash merge followed by the automatic main→staging sync is the usual way two long-lived branches end up in conflict.

**Keeping staging current:** `Sync main → staging` runs every 6 hours. It merges `main` into `staging` and redeploys staging if anything changed. If the merge conflicts, the run fails and you get an email; fix it with `git checkout staging && git merge main`. You can also run it by hand from the Actions tab.

**Why there are two repos:** GitHub Pages allows one site and one domain per repository. `LLaammTTeerr/portfolio` holds all the source and serves production. `LLaammTTeerr/portfolio-staging` holds nothing but built staging output on its `gh-pages` branch. The staging workflow pushes there with a deploy key that can only write to that one repo (the `STAGING_DEPLOY_KEY` secret in the `staging` environment).

**DNS** (Cloudflare, all records **DNS only**, grey cloud):

| Type | Name | Content |
|---|---|---|
| A | `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (four records) |
| AAAA | `@` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www` | `llaammtteerr.github.io` |
| CNAME | `staging` | `llaammtteerr.github.io` |

Once GitHub has issued the certificates, turn on **Enforce HTTPS** in both repos under Settings → Pages.

Before you ship, set `meta.title` and `meta.description` in `content.js`. Link-preview scrapers (Slack, X, Discord, iMessage) don't run JavaScript, so **also edit the `<title>`, `<meta name="description">` and `og:title` tags directly in `index.html`**, and add an `og:image` there.
