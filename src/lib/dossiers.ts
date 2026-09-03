import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  dossiers,
  users,
  type Dossier,
  type DossierStatus,
  type Role,
} from "@/db/schema";

export async function createDossier(params: {
  clientId: string;
  taxYear: number;
}): Promise<Dossier> {
  const [dossier] = await db
    .insert(dossiers)
    .values({
      clientId: params.clientId,
      taxYear: params.taxYear,
    })
    .returning();
  return dossier;
}

export async function listDossiersForClient(
  clientId: string,
): Promise<Dossier[]> {
  return (
    db
      .select()
      .from(dossiers)
      .where(eq(dossiers.clientId, clientId))
      // `createdAt` breaks ties: nothing stops two dossiers sharing a tax year
      // (there is no uniqueness constraint on client_id + tax_year), and the
      // client home picks the first match for the selected period — so the one
      // it picks has to be the most recent, not whichever the planner returned.
      .orderBy(desc(dossiers.taxYear), desc(dossiers.createdAt))
  );
}

export interface AdminDossierRow {
  id: string;
  taxYear: number;
  status: DossierStatus;
  createdAt: Date;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * The most recent dossiers with their owning client, for the admin dossiers
 * table. Inner join on `users`, so a row is only returned once its client
 * resolves. Bounded by `limit` — the table renders every row it is given, and
 * an unbounded list grows without limit as periods accumulate.
 */
export async function listAllDossiersWithClient({
  limit = 200,
  taxYear,
}: { limit?: number; taxYear?: number } = {}): Promise<AdminDossierRow[]> {
  return db
    .select({
      id: dossiers.id,
      taxYear: dossiers.taxYear,
      status: dossiers.status,
      createdAt: dossiers.createdAt,
      clientId: dossiers.clientId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(dossiers)
    .innerJoin(users, eq(users.id, dossiers.clientId))
    .where(taxYear ? eq(dossiers.taxYear, taxYear) : undefined)
    .orderBy(desc(dossiers.taxYear), desc(dossiers.createdAt))
    .limit(limit);
}

/** Distinct tax years that have at least one dossier, newest first. */
export async function listTaxYears(): Promise<number[]> {
  const rows = await db
    .selectDistinct({ taxYear: dossiers.taxYear })
    .from(dossiers)
    .orderBy(desc(dossiers.taxYear));
  return rows.map((r) => r.taxYear);
}

export async function countAllDossiers(taxYear?: number): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(dossiers)
    .where(taxYear ? eq(dossiers.taxYear, taxYear) : undefined);
  return Number(row?.value ?? 0);
}

export type AccessCheckResult =
  { ok: true; dossier: Dossier } | { ok: false; error: "not_found" };

export async function getAccessibleDossier(
  dossierId: string,
  requester: { id: string; role: Role },
): Promise<AccessCheckResult> {
  const [dossier] = await db
    .select()
    .from(dossiers)
    .where(eq(dossiers.id, dossierId));
  if (!dossier) {
    return { ok: false, error: "not_found" };
  }
  const isOwner = dossier.clientId === requester.id;
  const isAdmin =
    requester.role === "admin" || requester.role === "super_admin";
  if (!isOwner && !isAdmin) {
    return { ok: false, error: "not_found" };
  }
  return { ok: true, dossier };
}

export type SetStatusResult =
  | { ok: true; previousStatus: DossierStatus }
  | { ok: false; error: "not_found" | "invalid_transition" };

export async function setDossierStatus(
  dossierId: string,
  newStatus: DossierStatus,
  requester: { id: string; role: Role },
): Promise<SetStatusResult> {
  const [dossier] = await db
    .select()
    .from(dossiers)
    .where(eq(dossiers.id, dossierId));
  const isOwner = dossier?.clientId === requester.id;
  const isAdmin =
    requester.role === "admin" || requester.role === "super_admin";
  if (!dossier || (!isOwner && !isAdmin)) {
    return { ok: false, error: "not_found" };
  }

  if (
    !isAdmin &&
    (newStatus !== "submitted" || dossier.status !== "not_started")
  ) {
    return { ok: false, error: "invalid_transition" };
  }

  const previousStatus = dossier.status;
  await db
    .update(dossiers)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(dossiers.id, dossierId));
  return { ok: true, previousStatus };
}
