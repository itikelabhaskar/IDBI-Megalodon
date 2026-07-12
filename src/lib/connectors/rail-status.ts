// Integration honesty surface — every connector mode is visible in-product.
// All rails are Synthetic for the demo; stubs return null / 503 when unconsented.

export type RailMode = "Synthetic" | "Sandbox" | "Live";

export interface RailStatusEntry {
  id: string;
  label: string;
  mode: RailMode;
  schemaNote: string;
  stub: true;
}

/** Canonical rail roster for Governance / Architecture honesty panels. */
export const RAIL_STATUS: RailStatusEntry[] = [
  {
    id: "aa_bank",
    label: "Account Aggregator (bank)",
    mode: "Synthetic",
    schemaNote: "FI deposit statements → AaBankPayload",
    stub: true,
  },
  {
    id: "gstn",
    label: "GSTN-as-FIP",
    mode: "Synthetic",
    schemaNote: "GSTR-3B returns → GstnPayload",
    stub: true,
  },
  {
    id: "upi",
    label: "UPI aggregator",
    mode: "Synthetic",
    schemaNote: "Monthly in/out aggregates → UpiPayload",
    stub: true,
  },
  {
    id: "epfo",
    label: "EPFO",
    mode: "Synthetic",
    schemaNote: "Establishment contributions → EpfoPayload",
    stub: true,
  },
  {
    id: "power",
    label: "DISCOM power",
    mode: "Synthetic",
    schemaNote: "Monthly kWh / load → PowerPayload",
    stub: true,
  },
  {
    id: "fuel",
    label: "Fuel / ops spend",
    mode: "Synthetic",
    schemaNote: "Monthly spend / litres → FuelPayload (labelled synthetic)",
    stub: true,
  },
  {
    id: "fastag",
    label: "FASTag (sandbox mock)",
    mode: "Synthetic",
    schemaNote: "Toll events derived from fuel litres — not a live FASTag API",
    stub: true,
  },
  {
    id: "eway",
    label: "E-way bill (sandbox mock)",
    mode: "Synthetic",
    schemaNote: "Movement proxy from GST outwards — not a live e-way API",
    stub: true,
  },
  {
    id: "bureau",
    label: "Bureau-lite",
    mode: "Synthetic",
    schemaNote: "EMI / DPD hygiene → BureauPayload",
    stub: true,
  },
];
