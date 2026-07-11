#!/usr/bin/env node
/**
 * Create a blog post from raw text — used by the "New blog post" GitHub
 * Action (paste a LinkedIn post from your phone) and usable locally:
 *
 *   POST_TEXT="..." node scripts/new-post.mjs
 *
 * Env vars: POST_TEXT (required), POST_TITLE, POST_TAGS (comma-separated,
 * default "linkedin"), POST_SOURCE_URL, POST_DRAFT ("true").
 */
import fs from 'node:fs';
import path from 'node:path';

const text = (process.env.POST_TEXT ?? '').trim();
if (!text) {
  console.error('POST_TEXT is required');
  process.exit(1);
}
const tags = (process.env.POST_TAGS ?? 'linkedin').split(',').map((t) => t.trim()).filter(Boolean);
const sourceUrl = (process.env.POST_SOURCE_URL ?? '').trim();
const draft = (process.env.POST_DRAFT ?? '') === 'true';

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');

function makeTitle(t) {
  const firstLine = t.split(/\n/).find((l) => l.trim().length > 0) ?? 'Untitled';
  const sentence = firstLine.split(/(?<=[.!?])\s/)[0].trim();
  const s = sentence.length > 80 ? sentence.slice(0, 77).replace(/\s+\S*$/, '') + '…' : sentence;
  return s.replace(/^["'\s]+|["'\s]+$/g, '');
}

const title = (process.env.POST_TITLE ?? '').trim() || makeTitle(text);
const date = new Date().toISOString().slice(0, 10);
const description = text.replace(/\s+/g, ' ').slice(0, 150).replace(/\s+\S*$/, '') + '…';
const body = text.split(/\n{2,}/).map((p) => p.replace(/\n/g, '  \n')).join('\n\n');

let file = path.join('src/content/blog', `${date}-${slugify(title) || 'post'}.md`);
let n = 2;
while (fs.existsSync(file)) {
  file = path.join('src/content/blog', `${date}-${slugify(title)}-${n++}.md`);
}

const md = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
date: ${date}
tags: [${tags.join(', ')}]${draft ? '\ndraft: true' : ''}
---

${body}
${sourceUrl ? `\n---\n\n*Originally posted [on LinkedIn](${sourceUrl}).*\n` : ''}`;

fs.writeFileSync(file, md);
console.log(`wrote ${file}`);
