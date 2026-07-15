// Optional RentCast lookup for the /invest/ analyzer.
// Free tier ≈ 50 API requests/month; one address lookup here spends 3
// (value AVM + rent AVM + property record). The key lives only in
// localStorage on the visitor's device.

export interface Lookup {
  valueEstimate?: number;
  valueLow?: number;
  valueHigh?: number;
  rentEstimate?: number;
  rentLow?: number;
  rentHigh?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  propertyType?: string;
  lastTaxAnnual?: number;
  lastTaxYear?: string;
  errors: string[];
}

const BASE = 'https://api.rentcast.io/v1';

async function get(path: string, key: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Api-Key': key, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function lookupAddress(address: string, key: string): Promise<Lookup> {
  const q = encodeURIComponent(address);
  const out: Lookup = { errors: [] };

  const [val, rent, rec] = await Promise.allSettled([
    get(`/avm/value?address=${q}`, key),
    get(`/avm/rent/long-term?address=${q}`, key),
    get(`/properties?address=${q}`, key),
  ]);

  if (val.status === 'fulfilled') {
    out.valueEstimate = val.value?.price;
    out.valueLow = val.value?.priceRangeLow;
    out.valueHigh = val.value?.priceRangeHigh;
  } else out.errors.push(`value estimate: ${val.reason?.message ?? val.reason}`);

  if (rent.status === 'fulfilled') {
    out.rentEstimate = rent.value?.rent;
    out.rentLow = rent.value?.rentRangeLow;
    out.rentHigh = rent.value?.rentRangeHigh;
  } else out.errors.push(`rent estimate: ${rent.reason?.message ?? rent.reason}`);

  if (rec.status === 'fulfilled') {
    const p = Array.isArray(rec.value) ? rec.value[0] : rec.value;
    if (p) {
      out.beds = p.bedrooms;
      out.baths = p.bathrooms;
      out.sqft = p.squareFootage;
      out.yearBuilt = p.yearBuilt;
      out.propertyType = p.propertyType;
      // Tax history reflects what the CURRENT owner paid — often the 4%
      // owner-occupied ratio in SC. An investor purchase reassesses at 6%,
      // so this is shown for reference, never auto-filled.
      const taxes = p.propertyTaxes;
      if (taxes && typeof taxes === 'object') {
        const years = Object.keys(taxes).sort();
        const last = years[years.length - 1];
        if (last) {
          out.lastTaxYear = last;
          out.lastTaxAnnual = taxes[last]?.total;
        }
      }
    }
  } else out.errors.push(`property record: ${rec.reason?.message ?? rec.reason}`);

  return out;
}
