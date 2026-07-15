// Deal math for the /invest/ analyzer, mirroring DSCR-lender underwriting:
// DSCR is computed on the DSCR loan's PITIA only (P&I + taxes + insurance +
// HOA). The HELOC that funds the down payment sits OUTSIDE the ratio but
// INSIDE real cash flow, so carry = rent − PITIA − HELOC interest.

export interface DealInputs {
  address: string;
  price: number;          // offer / purchase price
  marketValue: number;    // 0 = unknown (used for all-in-basis comparison)
  rent: number;           // expected monthly rent
  rehab: number;          // rehab budget (drawn on HELOC, added to basis)
  hoa: number;            // monthly
  insurance: number;      // monthly
  taxRatePct: number;     // effective annual % of price (SC 6% investor ratio ≈ 1.75)
  taxMonthly: number;     // manual $/mo override; 0 = estimate from taxRatePct
  ltvPct: number;
  ratePct: number;        // DSCR loan note rate
  termYears: number;
  closing: number;        // closing costs, drawn on HELOC
  helocRatePct: number;   // interest-only
  helocFunded: boolean;   // down + closing + rehab drawn on HELOC
  dscrFloor: number;      // lender minimum, usually 1.00
  vacancyPct: number;     // % of rent
  maintenancePct: number; // % of rent (maintenance + capex reserve)
}

export type Verdict = 'pass' | 'bleed' | 'fail';

export interface DealResults {
  loan: number;
  down: number;
  pi: number;
  taxes: number;
  pitia: number;
  dscr: number;
  helocDraw: number;
  helocPmt: number;
  reserves: number;           // vacancy + maintenance, monthly
  carry: number;              // rent − PITIA − HELOC (before reserves)
  carryAfterReserves: number;
  allInBasis: number;         // price + closing + rehab
  maxOfferDscr: number;       // highest price where DSCR ≥ floor
  maxOfferBreakEven: number;  // highest price where carry ≥ 0 (before reserves)
  verdict: Verdict;
}

/** Monthly amortizing payment per $1 of loan. */
export function pmtFactor(ratePct: number, years: number): number {
  const n = years * 12;
  if (n <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return 1 / n;
  const f = Math.pow(1 + r, n);
  return (r * f) / (f - 1);
}

export function analyze(i: DealInputs): DealResults {
  const pf = pmtFactor(i.ratePct, i.termYears);
  const ltv = i.ltvPct / 100;
  const loan = i.price * ltv;
  const down = i.price - loan;
  const pi = loan * pf;
  const taxes = i.taxMonthly > 0 ? i.taxMonthly : (i.price * i.taxRatePct) / 100 / 12;
  const pitia = pi + taxes + i.insurance + i.hoa;
  const dscr = pitia > 0 ? i.rent / pitia : 0;

  const helocDraw = i.helocFunded ? down + i.closing + i.rehab : 0;
  const helocPmt = (helocDraw * i.helocRatePct) / 100 / 12;
  const reserves = (i.rent * (i.vacancyPct + i.maintenancePct)) / 100;
  const carry = i.rent - pitia - helocPmt;
  const carryAfterReserves = carry - reserves;

  // PITIA is linear in the offer price: PITIA(offer) = a·offer + b
  const a = ltv * pf + (i.taxMonthly > 0 ? 0 : i.taxRatePct / 100 / 12);
  const b = i.insurance + i.hoa + (i.taxMonthly > 0 ? i.taxMonthly : 0);
  const floor = Math.max(i.dscrFloor, 0.01);
  const maxOfferDscr = a > 0 ? Math.max(0, (i.rent / floor - b) / a) : 0;

  // Break-even carry: rent = PITIA(offer) + HELOC(offer), also linear.
  const hr = i.helocFunded ? i.helocRatePct / 100 / 12 : 0;
  const a2 = a + hr * (1 - ltv);
  const b2 = b + hr * (i.closing + i.rehab);
  const maxOfferBreakEven = a2 > 0 ? Math.max(0, (i.rent - b2) / a2) : 0;

  const verdict: Verdict = dscr < i.dscrFloor ? 'fail' : carryAfterReserves < 0 ? 'bleed' : 'pass';

  return {
    loan, down, pi, taxes, pitia, dscr, helocDraw, helocPmt, reserves,
    carry, carryAfterReserves,
    allInBasis: i.price + i.closing + i.rehab,
    maxOfferDscr, maxOfferBreakEven, verdict,
  };
}

export interface SensitivityRow {
  offer: number;
  dscr: number;
  helocDraw: number;
  carry: number;
  carryAfterReserves: number;
  allInBasis: number;
  clears: boolean;
}

/** Offer grid from asking price downward in ~3% steps rounded to $5K. */
export function sensitivity(i: DealInputs, rows = 6): SensitivityRow[] {
  const step = Math.max(5000, Math.round((i.price * 0.03) / 5000) * 5000);
  const out: SensitivityRow[] = [];
  for (let k = 0; k < rows; k++) {
    const offer = i.price - k * step;
    if (offer <= 0) break;
    const r = analyze({ ...i, price: offer });
    out.push({
      offer, dscr: r.dscr, helocDraw: r.helocDraw, carry: r.carry,
      carryAfterReserves: r.carryAfterReserves, allInBasis: r.allInBasis,
      clears: r.dscr >= i.dscrFloor,
    });
  }
  return out;
}

export function fmtUSD(n: number, dp = 0): string {
  const s = Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: dp });
  return (n < 0 ? '−$' : '$') + s;
}

export function fmtUSDmo(n: number): string {
  return `${fmtUSD(n)}/mo`;
}

/** Plain-text summary in "send it to Shauntay" format. */
export function summarize(i: DealInputs, r: DealResults): string {
  const lines: string[] = [];
  lines.push(`${i.address || 'Deal'} at ${fmtUSD(i.price)}${i.rehab > 0 ? ` + ${fmtUSD(i.rehab)} rehab` : ''}`);
  lines.push(`• Rent: ${fmtUSD(i.rent)}/mo`);
  lines.push(`• Monthly costs (PITIA): ${fmtUSD(r.pitia)} (P&I ${fmtUSD(r.pi)}, taxes ${fmtUSD(r.taxes)}, ins ${fmtUSD(i.insurance)}${i.hoa > 0 ? `, HOA ${fmtUSD(i.hoa)}` : ''})`);
  lines.push(`• DSCR: ${r.dscr.toFixed(2)} vs ${i.dscrFloor.toFixed(2)} floor — ${r.dscr >= i.dscrFloor ? 'qualifies' : 'does NOT qualify'}`);
  if (r.helocDraw > 0) lines.push(`• HELOC draw ${fmtUSD(r.helocDraw)} → ${fmtUSD(r.helocPmt)}/mo interest-only`);
  lines.push(`• Cash flow before reserves: ${fmtUSD(r.carry)}/mo (${fmtUSD(r.carry * 12)}/yr)`);
  lines.push(`• After vacancy + maintenance: ${fmtUSD(r.carryAfterReserves)}/mo (${fmtUSD(r.carryAfterReserves * 12)}/yr)`);
  lines.push(`• All-in basis: ${fmtUSD(r.allInBasis)}${i.marketValue > 0 ? ` vs market ${fmtUSD(i.marketValue)}` : ''}`);
  lines.push(`• Max offer at DSCR ${i.dscrFloor.toFixed(2)}: ${fmtUSD(r.maxOfferDscr)} · break-even carry: ${fmtUSD(r.maxOfferBreakEven)}`);
  const verdictText = { pass: 'Clears. Worth pursuing.', bleed: 'Qualifies but bleeds cash every month.', fail: 'Fails DSCR — lender says no. Pass.' };
  lines.push(`Bottom line: ${verdictText[r.verdict]}`);
  return lines.join('\n');
}
