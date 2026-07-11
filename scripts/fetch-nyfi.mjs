#!/usr/bin/env node
/**
 * Fetch NYSHEX Freight Index (NYFI) data from the free NYFI API and store it
 * as JSON + CSV under public/data/nyfi/ so the deployed site serves it as
 * static files.
 *
 * The NYFI API is free but requires an API key: sign up at nyshex.com, then
 * Help Center -> NYFI API Documentation to generate one.
 *
 * Env vars:
 *   NYSHEX_API_KEY         (required) your NYFI API key
 *   NYSHEX_API_BASE        (optional) default: https://dataapi.nyshex.com
 *   NYSHEX_API_KEY_HEADER  (optional) default: x-api-key — change if the
 *                          official docs specify a different header name
 *   NYSHEX_START_DATE      (optional) ISO date; default: API default (last 12 months)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NYSHEX_API_BASE ?? 'https://dataapi.nyshex.com';
const API_KEY = process.env.NYSHEX_API_KEY;
const API_KEY_HEADER = process.env.NYSHEX_API_KEY_HEADER ?? 'x-api-key';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(repoRoot, 'public', 'data', 'nyfi');
const historyJsonPath = path.join(outDir, 'history.json');
const historyCsvPath = path.join(outDir, 'history.csv');

if (!API_KEY) {
  console.error(
    'NYSHEX_API_KEY is not set. Create a free NYSHEX account, generate an API key ' +
      '(Help Center -> NYFI API Documentation), and set it as a repo secret.'
  );
  process.exit(1);
}

async function fetchIndices() {
  const url = new URL('/v1/index/list', API_BASE);
  if (process.env.NYSHEX_START_DATE) {
    url.searchParams.set('startDate', process.env.NYSHEX_START_DATE);
    url.searchParams.set('endDate', new Date().toISOString());
  }

  const res = await fetch(url, {
    headers: {
      [API_KEY_HEADER]: API_KEY,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`NYFI API request failed: ${res.status} ${res.statusText}\n${body.slice(0, 500)}`);
  }
  return res.json();
}

async function loadHistory() {
  try {
    return JSON.parse(await readFile(historyJsonPath, 'utf8'));
  } catch {
    return { updatedAt: null, timeframes: [] };
  }
}

// The API returns { timeframes: [{ timeframe, publishDate, indices: [...] }] }.
// Merge new timeframes into stored history, deduping by publishDate+timeframe.
function mergeHistory(history, fresh) {
  const timeframes = Array.isArray(fresh?.timeframes) ? fresh.timeframes : [];
  if (timeframes.length === 0) {
    console.warn('API response contained no timeframes; raw keys:', Object.keys(fresh ?? {}));
  }

  const byKey = new Map(
    history.timeframes.map((t) => [`${t.publishDate ?? ''}|${t.timeframe ?? ''}`, t])
  );
  let added = 0;
  for (const t of timeframes) {
    const key = `${t.publishDate ?? ''}|${t.timeframe ?? ''}`;
    if (!byKey.has(key)) added += 1;
    byKey.set(key, t); // latest fetch wins in case of corrections
  }

  const merged = [...byKey.values()].sort((a, b) =>
    String(a.publishDate ?? a.timeframe ?? '').localeCompare(String(b.publishDate ?? b.timeframe ?? ''))
  );
  return { added, history: { updatedAt: new Date().toISOString(), timeframes: merged } };
}

function toCsv(history) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [['publishDate', 'timeframe', 'index', 'abbreviation', 'value']];
  for (const t of history.timeframes) {
    for (const idx of t.indices ?? []) {
      rows.push([t.publishDate, t.timeframe, idx.name ?? idx.index, idx.abbreviation, idx.value]);
    }
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n') + '\n';
}

const fresh = await fetchIndices();
const { added, history } = mergeHistory(await loadHistory(), fresh);

await mkdir(outDir, { recursive: true });
await writeFile(historyJsonPath, JSON.stringify(history, null, 2) + '\n');
await writeFile(historyCsvPath, toCsv(history));
// Keep the raw latest response too, for debugging schema changes.
await writeFile(path.join(outDir, 'latest-response.json'), JSON.stringify(fresh, null, 2) + '\n');

console.log(`Done: ${added} new timeframe(s), ${history.timeframes.length} total in ${historyJsonPath}`);
