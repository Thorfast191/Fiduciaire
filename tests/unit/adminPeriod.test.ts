import { describe, it, expect } from "vitest";
import { resolvePeriod } from "@/lib/adminPeriod";

const currentTaxYear = new Date().getFullYear() - 1;

describe("resolvePeriod", () => {
  it("honours an explicit period that exists", () => {
    expect(resolvePeriod([2025, 2024, 2023], "2024")).toBe(2024);
  });

  it("ignores an explicit period with no dossiers", () => {
    expect(resolvePeriod([2025, 2024], "1999")).toBe(2025);
  });

  it("ignores a non-numeric period", () => {
    expect(resolvePeriod([2025, 2024], "not-a-year")).toBe(2025);
  });

  it("prefers the current tax period when it has dossiers", () => {
    const periods = [999999, currentTaxYear, 2000];
    expect(resolvePeriod(periods)).toBe(currentTaxYear);
  });

  it("falls back to the newest period when the current one is empty", () => {
    expect(resolvePeriod([2024, 2023])).toBe(
      [2024, 2023].includes(currentTaxYear) ? currentTaxYear : 2024,
    );
  });

  it("falls back to the current tax period when there are no dossiers at all", () => {
    expect(resolvePeriod([])).toBe(currentTaxYear);
  });
});
