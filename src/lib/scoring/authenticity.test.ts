import { describe, it, expect } from "vitest";
import { assessAuthenticity } from "./authenticity";
import type { FeatureVector } from "./features";

function feat(over: Partial<FeatureVector> = {}): FeatureVector {
  return {
    hasGst: true,
    hasUpi: true,
    hasEpfo: true,
    hasBureau: true,
    gstMonthlyTurnoverAvg: 2_000_000,
    gstTurnoverCov: 0.1,
    gstOnTimeRatio: 0.95,
    gstZeroReturnRatio: 0,
    gstConcentration: 0.3,
    hasPurchaseData: true,
    purchaseToSaleRatio: 0.7,
    bankMonthlyCreditAvg: 1_900_000,
    bankCreditVolatility: 0.1,
    emiBounceCount: 0,
    negativeBalanceDaysRatio: 0.01,
    cashVsDigitalRatio: 0,
    hasCircular: false,
    upiTrend: 0.2,
    upiRefundRatio: 0.01,
    upiConcentration: 0.1,
    epfoMissingMonthRatio: 0,
    epfoEmployeeGrowth: 0.1,
    debtServiceRatio: 0.1,
    dpdDays: 0,
    gstBankTurnoverGap: 0.05,
    hasPower: true,
    powerConsumptionAvg: 770,
    powerTrend: 0.1,
    powerImpliedTurnover: 2_000_000,
    turnoverPowerGap: 0.05,
    hasFuel: true,
    fuelSpendAvg: 28_000,
    fuelTrend: 0.05,
    fuelImpliedActivity: 1_848_000,
    fuelTurnoverGap: 0.08,
    seasonalSectorFlag: false,
    ...over,
  };
}

describe("assessAuthenticity", () => {
  it("returns Unavailable when neither power nor fuel is present", () => {
    const a = assessAuthenticity(feat({ hasPower: false, hasFuel: false }), "General Trading");
    expect(a.band).toBe("Unavailable");
    expect(a.powerBand).toBe("Unavailable");
    expect(a.fuelBand).toBe("Unavailable");
  });

  it("leans on power for manufacturing sectors", () => {
    const a = assessAuthenticity(
      feat({ hasPower: true, hasFuel: false, powerTrend: 0.2, turnoverPowerGap: 0.05 }),
      "Auto Components Manufacturing",
    );
    expect(a.band).not.toBe("Unavailable");
    expect(a.summary.toLowerCase()).toMatch(/manufactur/);
  });

  it("flags Weak when fuel gap is large for logistics", () => {
    const a = assessAuthenticity(
      feat({
        hasPower: false,
        hasFuel: true,
        fuelTrend: -0.2,
        fuelTurnoverGap: 0.75,
      }),
      "FMCG Distribution",
    );
    expect(a.band).toBe("Weak");
    expect(a.fuelBand).toBe("Weak");
  });
});
