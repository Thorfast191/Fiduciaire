import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { dossiers, payments, users, type DossierStatus } from "@/db/schema";
import { SERVICE_TYPES, type ServiceType } from "@/lib/serviceTypes";

export interface AdminDashboardStats {
  totalDossiers: number;
  completedDossiers: number;
  /** Submitted or under review — everything started but not yet closed. */
  inProgressDossiers: number;
  totalClients: number;
  /** Settled revenue for the period, in CHF — the mockup's chiffre d'affaires. */
  revenueChf: number;
  byStatus: Record<DossierStatus, number>;
  byTaxYear: { taxYear: number; count: number }[];
}

/** Every status a dossier can hold, so `byStatus` is complete even at zero. */
const ALL_STATUSES: DossierStatus[] = [
  "not_started",
  "submitted",
  "in_review",
  "documents_requested",
  "documents_received",
  "completed",
];

function emptyByStatus(): Record<DossierStatus, number> {
  return Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<
    DossierStatus,
    number
  >;
}

function emptyByService(): Record<ServiceType, number> {
  return Object.fromEntries(SERVICE_TYPES.map((s) => [s, 0])) as Record<
    ServiceType,
    number
  >;
}

/**
 * Firm-wide aggregates, optionally scoped to one tax period — the Statistiques
 * screen's période picker filters every figure on the page, as it does in the
 * mockup. `byTaxYear` is deliberately never scoped: it is what the picker
 * chooses from.
 */
export async function getAdminDashboardStats(
  taxYear?: number,
): Promise<AdminDashboardStats> {
  const period = taxYear ? eq(dossiers.taxYear, taxYear) : undefined;

  const [totalRows, statusRows, clientRows, yearRows, revenueRows] =
    await Promise.all([
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
      db
        .select({ value: sql<number>`coalesce(sum(${payments.amountChf}), 0)` })
        .from(payments)
        .where(
          and(
            eq(payments.status, "paid"),
            taxYear ? eq(payments.taxYear, taxYear) : undefined,
          ),
        ),
    ]);

  const byStatus = emptyByStatus();
  for (const r of statusRows) byStatus[r.status] = Number(r.value);

  return {
    totalDossiers: Number(totalRows[0]?.value ?? 0),
    completedDossiers: byStatus.completed,
    inProgressDossiers: byStatus.submitted + byStatus.in_review,
    totalClients: Number(clientRows[0]?.value ?? 0),
    revenueChf: Number(revenueRows[0]?.value ?? 0),
    byStatus,
    byTaxYear: yearRows.map((r) => ({
      taxYear: r.taxYear,
      count: Number(r.value),
    })),
  };
}

export interface AdminHomeStats {
  /** Dossiers this admin has reserved, all prestations, for the period. */
  reservedTotal: number;
  /** Of those, the ones already closed. */
  reservedCompleted: number;
  /** Revenue settled on this admin's reserved dossiers, in CHF. */
  personalRevenueChf: number;
  byStatus: Record<DossierStatus, number>;
  byService: Record<ServiceType, number>;
}

/**
 * The signed-in administrator's personal workload — the mockup's admin home
 * ("Espace administrateur"), which is per-agent: the dossiers they have
 * reserved, how many they have closed, and the revenue those bring in, all
 * scoped to the selected period. Distinct from {@link getAdminDashboardStats},
 * which is the firm-wide Statistiques view.
 */
export async function getAdminHomeStats(
  adminId: string,
  taxYear?: number,
): Promise<AdminHomeStats> {
  const mine = and(
    eq(dossiers.reservedBy, adminId),
    taxYear ? eq(dossiers.taxYear, taxYear) : undefined,
  );

  const [statusRows, serviceRows, revenueRows] = await Promise.all([
    db
      .select({ status: dossiers.status, value: sql<number>`count(*)` })
      .from(dossiers)
      .where(mine)
      .groupBy(dossiers.status),
    db
      .select({
        serviceType: dossiers.serviceType,
        value: sql<number>`count(*)`,
      })
      .from(dossiers)
      .where(mine)
      .groupBy(dossiers.serviceType),
    // Revenue on the admin's reserved dossiers: paid payments joined to a
    // dossier this admin holds. Payments not tied to a dossier (hand-recorded)
    // never count toward an agent's personal figure.
    db
      .select({ value: sql<number>`coalesce(sum(${payments.amountChf}), 0)` })
      .from(payments)
      .innerJoin(dossiers, eq(dossiers.id, payments.dossierId))
      .where(
        and(
          eq(payments.status, "paid"),
          eq(dossiers.reservedBy, adminId),
          taxYear ? eq(dossiers.taxYear, taxYear) : undefined,
        ),
      ),
  ]);

  const byStatus = emptyByStatus();
  for (const r of statusRows) byStatus[r.status] = Number(r.value);

  const byService = emptyByService();
  for (const r of serviceRows) {
    byService[r.serviceType as ServiceType] = Number(r.value);
  }

  const reservedTotal = ALL_STATUSES.reduce((a, s) => a + byStatus[s], 0);

  return {
    reservedTotal,
    reservedCompleted: byStatus.completed,
    personalRevenueChf: Number(revenueRows[0]?.value ?? 0),
    byStatus,
    byService,
  };
}
