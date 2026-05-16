import { describe, expect, it } from "vitest";

import { InstrumentType, QuoteMode } from "@/lib/constants";
import { ACTIVITY_FORM_CONFIG } from "../activity-form-config";

describe("activity-form-config", () => {
  it("persists the selected trade instrument type for Buy payloads", () => {
    const payload = ACTIVITY_FORM_CONFIG.BUY.toPayload({
      accountId: "acct-1",
      activityDate: new Date("2026-05-16T08:00:00.000Z"),
      assetId: "WMP-001",
      quantity: 1,
      unitPrice: 100,
      fee: 0,
      quoteMode: QuoteMode.MARKET,
      symbolInstrumentType: InstrumentType.WMP,
      assetType: "wmp",
      maturityDate: new Date("2026-12-31T00:00:00.000Z"),
    } as never);

    expect(payload.metadata).toMatchObject({
      tradeInstrumentType: "WMP",
      bond: { maturityDate: "2026-12-31" },
    });
  });

  it("restores WMP defaults from trade metadata when editing", () => {
    const defaults = ACTIVITY_FORM_CONFIG.BUY.getDefaults(
      {
        id: "act-1",
        accountId: "acct-1",
        assetSymbol: "WMP-001",
        instrumentType: "EQUITY",
        metadata: { tradeInstrumentType: "WMP", bond: { maturityDate: "2026-12-31" } },
      },
      [{ value: "acct-1", label: "Main", currency: "CNY" }],
    );

    expect(defaults.assetType).toBe("wmp");
    expect(defaults.assetKind).toBe(InstrumentType.WMP);
    expect(defaults.symbolInstrumentType).toBe(InstrumentType.WMP);
    expect(defaults.maturityDate).toBeInstanceOf(Date);
  });
});
