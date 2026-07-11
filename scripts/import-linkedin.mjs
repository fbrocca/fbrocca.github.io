#!/usr/bin/env node
/**
 * Import LinkedIn posts into the blog.
 *
 * LinkedIn → Settings & Privacy → Data privacy → "Get a copy of your data"
 * → select "Posts" (or the full archive) → Request archive. The download
 * contains a Shares.csv with every post you've written.
 *
 * Usage:
 *   node scripts/import-linkedin.mjs [path/to/Shares.csv]
 *     --min-chars=280   skip short posts (default 280)
 *     --dry-run         print what would be written, write nothing
 *
 * Each qualifying post becomes src/content/blog/li-<date>-<slug>.md with
 * a `linkedin` tag and a link back to the original. Existing files are
 * never overwritten, so you can freely edit imported posts and re-run
 * the import after the next export.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith('--')) ?? 'linkedin-export/Shares.csv';
const minChars = +(args.find((a) => a.startsWith('--min-chars='))?.split('=')[1] ?? 280);
const dryRun = args.includes('--dry-run');
const outDir = 'src/content/blog';

if (!fs.existsSync(csvPath)) {
  console.error(`Not found: ${csvPath}
Download your LinkedIn archive (Settings & Privacy → Data privacy →
"Get a copy of your data" → Posts), unzip it, and pass the path to
Shares.csv — or place it at linkedin-export/Shares.csv.`);
  process.exit(1);
}

/* --- tiny CSV parser that handles quoted fields with commas/newlines --- */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = rows.shift().map((h) => h.trim().toLowerCase());
const col = (name) => header.findIndex((h) => h.includes(name));
const iDate = col('date');
const iText = col('commentary');
const iLink = col('sharelink');

if (iDate < 0 || iText < 0) {
  console.error(`Unrecognized CSV header: ${header.join(', ')}
Expected LinkedIn's Shares.csv (columns like Date, ShareLink, ShareCommentary).`);
  process.exit(1);
}

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');

/* first sentence or line, trimmed, for the title */
function makeTitle(text) {
  const firstLine = text.split(/\n/).find((l) => l.trim().length > 0) ?? 'Untitled';
  const sentence = firstLine.split(/(?<=[.!?])\s/)[0].trim();
  const t = sentence.length > 80 ? sentence.slice(0, 77).replace(/\s+\S*$/, '') + '…' : sentence;
  return t.replace(/^["'\s]+|["'\s]+$/g, '');
}

let written = 0, skipped = 0;
for (const r of rows) {
  const text = (r[iText] ?? '').trim();
  const when = (r[iDate] ?? '').trim();
  if (!text || text.length < minChars) { skipped++; continue; }

  const date = when.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const title = makeTitle(text);
  const file = path.join(outDir, `li-${date}-${slugify(title) || 'post'}.md`);
  if (fs.existsSync(file)) { skipped++; continue; }

  const description = text.replace(/\s+/g, ' ').slice(0, 150).replace(/\s+\S*$/, '') + '…';
  const link = (r[iLink] ?? '').trim();
  /* LinkedIn text is plain — blank lines become paragraph breaks */
  const body = text.split(/\n{2,}/).map((p) => p.replace(/\n/g, '  \n')).join('\n\n');

  const md = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
date: ${date}
tags: [linkedin]
---

${body}
${link ? `\n---\n\n*Originally posted [on LinkedIn](${link}).*\n` : ''}`;

  if (dryRun) console.log(`would write ${file} — "${title}"`);
  else { fs.writeFileSync(file, md); console.log(`wrote ${file}`); }
  written++;
}

console.log(`\n${dryRun ? 'would import' : 'imported'} ${written} post(s), skipped ${skipped} (short/duplicate).`);
