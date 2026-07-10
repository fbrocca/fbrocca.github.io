# fabiobrocca — personal website

Personal site of **Fabio Brocca** — Chief Product Officer. Built with
[Astro](https://astro.build), served by GitHub Pages at
**https://fbrocca.github.io**.

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

## 🛠 Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## 🌐 Custom domain (later)

1. Buy a domain (e.g. `fabiobrocca.com`).
2. Repo → Settings → Pages → Custom domain → enter it (GitHub creates a
   `CNAME` file).
3. At your DNS provider: `CNAME` record `www` → `fbrocca.github.io`, plus the
   four GitHub Pages `A` records on the apex. Enable "Enforce HTTPS".
4. Update `site` in `astro.config.mjs` to the new domain.

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
