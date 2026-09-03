import { describe, it, expect } from "vitest";
import { db } from "@/db/client";
import { taxPeriods } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createTaxPeriod,
  listActiveTaxPeriodYears,
  listTaxPeriods,
  setTaxPeriodActive,
} from "@/lib/taxPeriods";

/** Years well outside the real range so parallel test files cannot collide. */
function uniqueYear() {
  return 2090 + Math.floor(Math.random() * 10);
}

describe("taxPeriods", () => {
  it("creates a period, active by default", async () => {
    const year = uniqueYear();
    await db.delete(taxPeriods).where(eq(taxPeriods.year, year));

    const result = await createTaxPeriod(year);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.period.year).toBe(year);
      expect(result.period.isActive).toBe(true);
    }
  });

  it("refuses a duplicate year rather than overwriting it", async () => {
    const year = uniqueYear();
    await db.delete(taxPeriods).where(eq(taxPeriods.year, year));

    await createTaxPeriod(year);
    await setTaxPeriodActive(year, false);

    const again = await createTaxPeriod(year);

    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.reason).toBe("exists");

    // The existing period keeps its state — the duplicate did not reset it.
    const [row] = await db
      .select()
      .from(taxPeriods)
      .where(eq(taxPeriods.year, year));
    expect(row.isActive).toBe(false);
  });

  it("toggles active state and reflects it in the active-year list", async () => {
    const year = uniqueYear();
    await db.delete(taxPeriods).where(eq(taxPeriods.year, year));
    await createTaxPeriod(year);

    expect(await listActiveTaxPeriodYears()).toContain(year);

    await setTaxPeriodActive(year, false);
    expect(await listActiveTaxPeriodYears()).not.toContain(year);

    await setTaxPeriodActive(year, true);
    expect(await listActiveTaxPeriodYears()).toContain(year);
  });

  it("returns null when toggling a period that does not exist", async () => {
    expect(await setTaxPeriodActive(1999, true)).toBeNull();
  });

  it("lists periods newest first", async () => {
    const years = await listTaxPeriods();
    const sorted = years.map((p) => p.year);
    expect(sorted).toEqual([...sorted].sort((a, b) => b - a));
  });
});
