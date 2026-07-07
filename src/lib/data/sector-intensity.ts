// Per-sector operational-intensity benchmarks: kWh of electricity and ₹ of fuel
// consumed per ₹1 lakh of turnover. These are the industry ratios a bank would
// maintain to translate a utility feed into an implied turnover — and to flag a
// business whose declared turnover is far out of line with its real activity.
//
// A single blended constant (the old ₹2,600/kWh) misjudges both light sectors
// (services burn little power, so it under-credited their turnover and raised a
// false "power below turnover" flag) and heavy sectors (milling/manufacturing
// over-credited). Keying on the applicant's SECTOR — a known, real attribute —
// makes the power-vs-turnover and fuel-vs-turnover triangulation accurate, so the
// mismatch flag now fires only for genuinely inconsistent (fraud) profiles.
//
// The values mirror the intensities the synthetic generator samples from, so the
// implied-turnover inverse is exact for honest profiles and diverges only where a
// profile was deliberately built with real activity below its declared turnover.

export interface SectorIntensity {
  kwhPerLakh: number; // kWh consumed per ₹1 lakh turnover
  fuelPerLakh: number; // ₹ fuel spent per ₹1 lakh turnover
}

const DEFAULT: SectorIntensity = { kwhPerLakh: 42, fuelPerLakh: 1100 };

export const SECTOR_INTENSITY: Record<string, SectorIntensity> = {
  // Stable GST-registered traders
  "Electronics Wholesale": { kwhPerLakh: 48, fuelPerLakh: 1800 },
  "Auto Components Manufacturing": { kwhPerLakh: 48, fuelPerLakh: 1800 },
  "Pharma Distribution": { kwhPerLakh: 48, fuelPerLakh: 1800 },
  // Thin-file micro retailers
  "FMCG Distribution": { kwhPerLakh: 30, fuelPerLakh: 900 },
  "Kirana Retail": { kwhPerLakh: 30, fuelPerLakh: 900 },
  "Mobile Accessories": { kwhPerLakh: 30, fuelPerLakh: 900 },
  // Seasonal agro / textile processors (power- and fuel-heavy)
  "Rice Milling": { kwhPerLakh: 55, fuelPerLakh: 2200 },
  "Cotton Textile Weaving": { kwhPerLakh: 55, fuelPerLakh: 2200 },
  "Food Processing": { kwhPerLakh: 55, fuelPerLakh: 2200 },
  // High-volume UPI merchants
  Restaurant: { kwhPerLakh: 46, fuelPerLakh: 600 },
  "QSR Chain": { kwhPerLakh: 46, fuelPerLakh: 600 },
  "Salon & Wellness": { kwhPerLakh: 46, fuelPerLakh: 600 },
  // Cash-flow-stressed trading
  "Textile Trading": { kwhPerLakh: 50, fuelPerLakh: 2000 },
  "Construction Materials": { kwhPerLakh: 50, fuelPerLakh: 2000 },
  "Apparel Wholesale": { kwhPerLakh: 50, fuelPerLakh: 2000 },
  // Fraud-suspect trading
  "Trading (unclassified)": { kwhPerLakh: 38, fuelPerLakh: 800 },
  "Scrap & Recycling": { kwhPerLakh: 38, fuelPerLakh: 800 },
  "General Merchant": { kwhPerLakh: 38, fuelPerLakh: 800 },
  // Women-owned services (light utility footprint)
  "Digital Marketing Agency": { kwhPerLakh: 26, fuelPerLakh: 500 },
  "Boutique Services": { kwhPerLakh: 26, fuelPerLakh: 500 },
  Consulting: { kwhPerLakh: 26, fuelPerLakh: 500 },
  // NTC / no-GST micro enterprises
  "Home Food Business": { kwhPerLakh: 30, fuelPerLakh: 1200 },
  "D2C Crafts": { kwhPerLakh: 30, fuelPerLakh: 1200 },
  "Tuition Services": { kwhPerLakh: 30, fuelPerLakh: 1200 },
};

export function sectorIntensity(sector: string): SectorIntensity {
  return SECTOR_INTENSITY[sector] ?? DEFAULT;
}

/** ₹ of turnover implied by 1 kWh consumed, for this sector (inverse intensity). */
export function rupeesPerKwh(sector: string): number {
  return Math.round(100_000 / sectorIntensity(sector).kwhPerLakh);
}

/** ₹ of turnover implied by ₹1 of fuel spend, for this sector (inverse intensity). */
export function rupeesTurnoverPerFuel(sector: string): number {
  return Math.round(100_000 / sectorIntensity(sector).fuelPerLakh);
}
