import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { taxPeriods, type TaxPeriod } from "@/db/schema";

export async function listTaxPeriods(): Promise<TaxPeriod[]> {
  return db.select().from(taxPeriods).orderBy(desc(taxPeriods.year));
}

export async function listActiveTaxPeriodYears(): Promise<number[]> {
  const rows = await db
    .select({ year: taxPeriods.year })
    .from(taxPeriods)
    .where(eq(taxPeriods.isActive, true))
    .orderBy(desc(taxPeriods.year));
  return rows.map((r) => r.year);
}

export type CreatePeriodResult =
  { ok: true; period: TaxPeriod } | { ok: false; reason: "exists" };

/**
 * Opens a fiscal period. The year is the primary key, so a duplicate is
 * reported rather than silently overwriting an existing period's active flag.
 */
export async function createTaxPeriod(
  year: number,
): Promise<CreatePeriodResult> {
  const [existing] = await db
    .select()
    .from(taxPeriods)
    .where(eq(taxPeriods.year, year));

  if (existing) return { ok: false, reason: "exists" };

  const [period] = await db.insert(taxPeriods).values({ year }).returning();
  return { ok: true, period };
}

export async function setTaxPeriodActive(
  year: number,
  isActive: boolean,
): Promise<TaxPeriod | null> {
  const [period] = await db
    .update(taxPeriods)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(taxPeriods.year, year))
    .returning();

  return period ?? null;
}

/**
 * Years offered by the admin période picker: the active fiscal periods, which
 * is what "open to clients" means. Falls back to the years that dossiers
 * actually carry, so a fresh install with no configured periods still shows
 * something useful.
 */
export async function listPeriodOptions(
  dossierYears: number[],
): Promise<number[]> {
  const active = await listActiveTaxPeriodYears();
  return active.length > 0 ? active : dossierYears;
}
