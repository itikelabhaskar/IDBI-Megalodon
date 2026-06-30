// Connector stubs — the swappable boundary between HealthLens and external data
// providers (AA / GSTN-as-FIP / UPI / EPFO / DISCOM power / bureau-lite). In a
// pilot each stub is replaced by a live IDBI sandbox API; the feature engine
// downstream is unchanged because the payload shapes stay the same.

import type { RawMsme } from "../data/raw-types";
import { fetchAaBank, type AaBankPayload } from "./aa";
import {
  fetchGstn,
  fetchUpi,
  fetchEpfo,
  fetchPower,
  fetchBureau,
  type GstnPayload,
  type UpiPayload,
  type EpfoPayload,
  type PowerPayload,
  type BureauPayload,
} from "./sources";

export * from "./aa";
export * from "./sources";

export interface AllSourcePayloads {
  aaBank: AaBankPayload;
  gstn: GstnPayload | null;
  upi: UpiPayload | null;
  epfo: EpfoPayload | null;
  power: PowerPayload | null;
  bureau: BureauPayload | null;
}

/** Simulate fetching every consented source for an MSME. */
export function fetchAllSources(raw: RawMsme): AllSourcePayloads {
  return {
    aaBank: fetchAaBank(raw),
    gstn: fetchGstn(raw),
    upi: fetchUpi(raw),
    epfo: fetchEpfo(raw),
    power: fetchPower(raw),
    bureau: fetchBureau(raw),
  };
}
