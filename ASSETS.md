# 📸 Asset checklist

The site ships with styled placeholders. Drop each file below into place,
commit, and push — the placeholder is automatically replaced by your image
on the next build. No code changes needed.

## 1. Your Star Wars-style avatar (the hero of the homepage)

| File | Where it shows |
|---|---|
| `public/images/avatar.gif` | Homepage hero, in a glowing circular frame |

**How to make it:** give ChatGPT (or Midjourney) a few photos of yourself and ask
for something like: *"Create an animated-style portrait of me as a Jedi-inspired
sci-fi character — heroic pose, dark background, subtle blue glow, looping GIF
feel. Stylized illustration, not photorealistic."* Square format works best
(it's displayed in a circle). A static PNG/JPG also works — just name it
`avatar.gif` anyway or update the path in `src/pages/index.astro`.

## 2. Journey photos (About page, one per chapter)

| File | Chapter |
|---|---|
| `public/images/journey/padua.jpg` | Chapter I — Padua / early days in Italy |
| `public/images/journey/msc.jpg` | Chapter II — MSC years (office, port, team) |
| `public/images/journey/amazon.jpg` | Chapter III — Amazon years |
| `public/images/journey/xeneta.jpg` | Chapter IV — Xeneta (a Summit keynote/stage shot is perfect) |

Landscape orientation (4:3-ish) looks best. Aim for ≥1200px wide.

## 3. Media artwork (Media page thumbnails)

| File | Item |
|---|---|
| `public/images/media/product-thinking.jpg` | Product Thinking Ep. 210 episode art |
| `public/images/media/freight-debate.jpg` | The Freight Debate show art |
| `public/images/media/out-of-the-box.jpg` | Out of the Box show art |
| `public/images/media/xeneta-summit-2024.jpg` | Summit 2024 keynote photo |
| `public/images/media/xeneta-summit-2025.jpg` | Summit 2025 keynote photo |

Square (1:1). Episode artwork can usually be saved straight from Spotify/Apple.

## 4. Optional

- `public/favicon.svg` already exists (an "FB" + lightsaber mark). Replace it
  with your avatar-derived favicon whenever you like.
- Tip: compress photos before committing (e.g. [squoosh.app](https://squoosh.app)) —
  keeps the site fast and the repo small.
