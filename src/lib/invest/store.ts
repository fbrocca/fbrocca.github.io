// localStorage persistence for the /invest/ analyzer. All deal data stays
// in the visitor's browser — nothing is ever written to the repo or a server.

import type { DealInputs } from './model';

export interface SavedDeal {
  id: string;
  savedAt: string;
  inputs: DealInputs;
}

const DEALS_KEY = 'fb-invest-deals';
const DEFAULTS_KEY = 'fb-invest-defaults';
const APIKEY_KEY = 'fb-invest-rentcast-key';

function addrKey(address: string): string {
  return address.trim().toLowerCase();
}

export function loadDeals(): SavedDeal[] {
  try {
    const list = JSON.parse(localStorage.getItem(DEALS_KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveDeals(deals: SavedDeal[]): void {
  localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
}

/** Save a deal, replacing any existing deal at the same address. */
export function upsertDeal(inputs: DealInputs): SavedDeal[] {
  const deals = loadDeals();
  const existing = deals.find((d) => addrKey(d.inputs.address) === addrKey(inputs.address));
  if (existing) {
    existing.inputs = inputs;
    existing.savedAt = new Date().toISOString();
  } else {
    deals.push({ id: `deal-${Date.now().toString(36)}`, savedAt: new Date().toISOString(), inputs });
  }
  saveDeals(deals);
  return deals;
}

export function deleteDeal(id: string): SavedDeal[] {
  const deals = loadDeals().filter((d) => d.id !== id);
  saveDeals(deals);
  return deals;
}

export function exportDeals(): string {
  return JSON.stringify({ app: 'fb-invest', version: 1, deals: loadDeals() }, null, 2);
}

/** Merge an exported portfolio back in (by id, then by address). Returns count imported. */
export function importDeals(text: string): number {
  const data = JSON.parse(text);
  const list: SavedDeal[] = Array.isArray(data) ? data : data?.deals;
  if (!Array.isArray(list)) throw new Error('Not a portfolio export');
  const deals = loadDeals();
  let n = 0;
  for (const d of list) {
    if (!d?.inputs?.address && d?.inputs?.price === undefined) continue;
    const at = deals.findIndex(
      (x) => x.id === d.id || addrKey(x.inputs.address) === addrKey(d.inputs.address ?? ''),
    );
    if (at >= 0) deals[at] = d;
    else deals.push(d);
    n++;
  }
  saveDeals(deals);
  return n;
}

export function loadFinancingDefaults(): Partial<DealInputs> | null {
  try {
    const d = JSON.parse(localStorage.getItem(DEFAULTS_KEY) ?? 'null');
    return d && typeof d === 'object' ? d : null;
  } catch {
    return null;
  }
}

export function saveFinancingDefaults(d: Partial<DealInputs>): void {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(d));
}

export function getApiKey(): string {
  return localStorage.getItem(APIKEY_KEY) ?? '';
}

export function setApiKey(key: string): void {
  if (key) localStorage.setItem(APIKEY_KEY, key);
  else localStorage.removeItem(APIKEY_KEY);
}
