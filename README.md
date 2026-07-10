# fabiobrocca — personal website

Personal site of **Fabio Brocca** — Chief Product Officer. Built with
[Astro](https://astro.build), served by GitHub Pages at
**https://fbrocca.github.io**.

Dark. Nerdy. Professional. Built in a galaxy not so far away.
(Try the Konami code: ↑ ↑ ↓ ↓ ← → ← → B A)

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
`/blog/my-post/`.

## 🖼 Swapping in your photos

See [ASSETS.md](./ASSETS.md) — drop image files into `public/images/`, push,
and the placeholders are replaced automatically.

## 🎙 Adding a podcast / keynote

Add one entry to `src/data/media.json`. Fields: `type` (`podcast` | `keynote`),
`show`, `title`, `date`, `summary`, `image`, `featured` (shows on homepage),
`links` (label → URL), and optional `embed` (`{"kind": "youtube", "id": "..."}`).

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
  pages/          → routes (index, about, media, blog, contact, 404, rss)
  content/blog/   → blog posts (markdown)
  data/media.json → podcasts & keynotes
  layouts/        → Base layout (nav, footer, starfield, easter egg)
  components/     → Starfield, Nav, Footer, SmartImage
  styles/         → design tokens & global styles
public/images/    → your photos (see ASSETS.md)
```
