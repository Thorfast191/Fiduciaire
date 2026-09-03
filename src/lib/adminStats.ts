import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { dossiers, users, type DossierStatus } from "@/db/schema";

export interface AdminDashboardStats {
  totalDossiers: number;
  completedDossiers: number;
  /** Submitted or under review — everything started but not yet closed. */
  inProgressDossiers: number;
  totalClients: number;
  byStatus: Record<DossierStatus, number>;
  byTaxYear: { taxYear: number; count: number }[];
}

const ALL_STATUSES: DossierStatus[] = [
  "not_started",
  "submitted",
  "in_review",
  "completed",
];

/**
 * Dashboard aggregates, optionally scoped to one tax period — the admin area's
 * période picker filters every figure on the page, as it does in the mockup.
 * `byTaxYear` is deliberately never scoped: it is what the picker chooses from.
 */
export async function getAdminDashboardStats(
  taxYear?: number,
): Promise<AdminDashboardStats> {
  const period = taxYear ? eq(dossiers.taxYear, taxYear) : undefined;

  const [totalRows, statusRows, clientRows, yearRows] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)` })
      .from(dossiers)
      .where(period),
    db
      .select({ status: dossiers.status, value: sql<number>`count(*)` })
      .from(dossiers)
      .where(period)
      .groupBy(dossiers.status),
    db
      .select({ value: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, "client"), isNull(users.disabledAt))),
    db
      .select({ taxYear: dossiers.taxYear, value: sql<number>`count(*)` })
      .from(dossiers)
      .groupBy(dossiers.taxYear)
      .orderBy(sql`${dossiers.taxYear} desc`),
  ]);

  const byStatus = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, 0]),
  ) as Record<DossierStatus, number>;
  for (const r of statusRows) byStatus[r.status] = Number(r.value);

  return {
    totalDossiers: Number(totalRows[0]?.value ?? 0),
    completedDossiers: byStatus.completed,
    inProgressDossiers: byStatus.submitted + byStatus.in_review,
    totalClients: Number(clientRows[0]?.value ?? 0),
    byStatus,
    byTaxYear: yearRows.map((r) => ({
      taxYear: r.taxYear,
      count: Number(r.value),
    })),
  };
}
