import { describe, expect, it } from "vitest";
import { TOP_INSTRUMENT_TYPES } from "../single-select-taxonomy";

describe("SingleSelectTaxonomy", () => {
  it("includes WMP in the instrument type quick toggles", () => {
    expect(TOP_INSTRUMENT_TYPES).toContain("WMP");
    expect(TOP_INSTRUMENT_TYPES.indexOf("WMP")).toBeGreaterThan(-1);
  });
});
