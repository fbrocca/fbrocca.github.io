# fabiobrocca — personal website

Personal site of **Fabio Brocca** — Chief Product Officer. Built with
[Astro](https://astro.build), served by GitHub Pages at
**https://www.fabiobrocca.tech** (also reachable at fbrocca.github.io).

The site is a working **Classic Macintosh (System 7) desktop**: menu bar,
draggable windows, desktop icons, a boot screen, and a Scrapbook. COLOR by
default (Macintosh II style); switch to 1-bit black & white via
**Special ▸ Black & White** — or the Konami code: ↑ ↑ ↓ ↓ ← → ← → B A.

## 🗺 The desktop

| Icon | Route | What it is |
| --- | --- | --- |
| Fabio HD | `/` | "About Fabio" box (About This Macintosh parody) + Résumé |
| Résumé | `/resume/` | Full résumé with a Download button |
| The Journey | `/about/` | The four-chapter story + HyperCard Career Stack |
| Writing | `/blog/` | Blog as a Finder list; posts open as documents |
| Media | `/media/` | Podcasts & keynotes |
| Photos | `/photos/` | Scrapbook (photos, one per page) |
| Contact | `/contact/` | Contact dialog |
| Trash | `/trash/` | The old Star Wars theme, resting honorably |

Also in the menus: **Special ▸ Toggle Desktop Pattern**, **Restart**
(replays the boot screen), **Empty Trash…**, and a live menu-bar clock.

There is also a **Games folder** on the desktop (`/games/`) with two
playable classics, both fully self-hosted:

- **Wolfenstein 3D** (`/game/`) — the 1992 shareware episode running in
  DOSBox compiled to WebAssembly ([js-dos](https://js-dos.com), GPL-2.0),
  in `public/wolf3d/`. The shareware episode is freely redistributable;
  Wolfenstein 3D © 1992 id Software.
- **Prince of Persia** (`/prince/`) — the
  [PrinceJS](https://github.com/ultrabolido/PrinceJS) HTML5 port
  (ISC-licensed code), in `public/prince/`. Prince of Persia © 1990
  Brøderbund.

## ✍️ Writing a blog post (3 steps)

1. Create a new file in `src/content/blog/`, e.g. `my-post.md`:

   ```markdown
   ---
   title: "My post title"
   description: "One-sentence summary shown in lists and search results."
   date: 2026-08-01
   tags: [product-leadership, ai]
   ---

   Your markdown content here. Headings, lists, quotes, code — it all works.
   ```

2. Commit and push to `main`.
3. Done — GitHub Actions rebuilds and deploys automatically (~2 min).

Add `draft: true` to the frontmatter to keep a post out of the published site
while you work on it. The filename becomes the URL: `my-post.md` →
`/blog/my-post/`. Posts open in a MacWrite-style document window.

## 🖼 Adding photos

Drop image files into `public/images/journey/` (see [ASSETS.md](./ASSETS.md)
for the expected filenames), push, and the placeholders in the Scrapbook and
The Journey are replaced automatically. Photos render in full color in COLOR
mode and dithered monochrome in 1-BIT mode.

To add more Scrapbook photos, add an entry to the `photos` array in
`src/pages/photos.astro`.

## 📄 Résumé download

The Download button serves `public/resume.pdf` if it exists — drop your real
PDF there. Until then it falls back to a text version generated from the
Résumé window itself.

## 🎙 Adding a podcast / keynote

Add one entry to `src/data/media.json`. Fields: `type` (`podcast` | `keynote`),
`show`, `title`, `date`, `summary`, `image`, `featured`, and `links`
(label → URL).

## 📈 NYFI freight index data

The repo pulls the **NYSHEX Freight Indices (NYFI)** from the free official
NYFI API and stores them under `public/data/nyfi/` (`history.json` +
`history.csv`), so the deployed site serves them at
`/data/nyfi/history.json`. A GitHub Action (`fetch-nyfi.yml`) runs daily at
15:30 UTC and commits only when new data appears — NYSHEX publishes NYFI
weekly on Fridays ~10:00 ET, so expect one new data point per week.

One-time setup:

1. Create a free account at [nyshex.com](https://nyshex.com) and generate an
   API key (Help Center → NYFI API Documentation).
2. Repo → Settings → Secrets and variables → Actions → add secret
   **`NYSHEX_API_KEY`**.
3. Run the workflow once manually (Actions → "Fetch NYFI index data" →
   Run workflow) to backfill the last 12 months.

If the official docs specify a different auth header than `x-api-key`, set it
via the `NYSHEX_API_KEY_HEADER` env var in the workflow. To backfill further
than 12 months, run locally with `NYSHEX_START_DATE=2023-01-01`.

## 🛠 Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## 🌐 Custom domain

The site runs on **www.fabiobrocca.tech**:

- DNS: `CNAME` record `www` → `fbrocca.github.io`, plus the four GitHub
  Pages `A` records on the apex (185.199.108–111.153).
- Repo → Settings → Pages → Custom domain: `www.fabiobrocca.tech`,
  with "Enforce HTTPS" enabled.
- `site` in `astro.config.mjs` points at the domain (canonicals, sitemap, RSS).

## 📁 Structure

```
src/
  pages/          → routes (each one is a window on the desktop)
  content/blog/   → blog posts (markdown)
  data/media.json → podcasts & keynotes
  layouts/        → Desktop.astro (menu bar, icons, boot, window manager)
  components/     → MacWindow, ResumeDoc, SmartImage
  styles/         → global.css (the whole System 7 design system)
public/
  fonts/          → ChicagoFLF.woff2 (freeware Chicago recreation, R. Casady)
  images/         → your photos (see ASSETS.md)
```
