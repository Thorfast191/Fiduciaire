import { and, asc, eq, desc, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import {
  dossiers,
  documents,
  dossierNotifications,
  payments,
  users,
  type Dossier,
  type DossierStatus,
  type Role,
} from "@/db/schema";
import { deleteObject } from "@/lib/storage/client";
import { logger } from "@/lib/logger";
import { SERVICE_TYPES, type ServiceType } from "@/lib/serviceTypes";

/**
 * Ensures a client has a dossier of a given prestation for a tax year, and
 * returns it.
 *
 * `(client_id, tax_year, service_type)` is unique, so asking twice is not a
 * request for a second dossier — it is a request for the same one. The conflict
 * is absorbed and the existing row returned rather than surfacing as a database
 * error, which would otherwise turn a double-submit into a 500. The outcome the
 * caller wants either way is "this client has this prestation for this year",
 * and that is what they get.
 *
 * `serviceType` defaults to `declaration`: that is what every dossier was before
 * prestations were split out, and what the admin year flow still creates.
 */
export async function createDossier(params: {
  clientId: string;
  taxYear: number;
  serviceType?: ServiceType;
}): Promise<Dossier> {
  const serviceType = params.serviceType ?? "declaration";

  const [inserted] = await db
    .insert(dossiers)
    .values({
      clientId: params.clientId,
      taxYear: params.taxYear,
      serviceType,
    })
    .onConflictDoNothing({
      target: [dossiers.clientId, dossiers.taxYear, dossiers.serviceType],
    })
    .returning();

  if (inserted) return inserted;

  const [existing] = await db
    .select()
    .from(dossiers)
    .where(
      and(
        eq(dossiers.clientId, params.clientId),
        eq(dossiers.taxYear, params.taxYear),
        eq(dossiers.serviceType, serviceType),
      ),
    );
  return existing;
}

export async function listDossiersForClient(
  clientId: string,
  serviceType?: ServiceType,
): Promise<Dossier[]> {
  return (
    db
      .select()
      .from(dossiers)
      .where(
        serviceType
          ? and(
              eq(dossiers.clientId, clientId),
              eq(dossiers.serviceType, serviceType),
            )
          : eq(dossiers.clientId, clientId),
      )
      // `(client_id, tax_year, service_type)` is unique, so a year yields at
      // most one row per prestation and the client home's pick for a period is
      // unambiguous. `createdAt` only gives rows within a year a stable order.
      .orderBy(desc(dossiers.taxYear), desc(dossiers.createdAt))
  );
}

export interface AdminDossierRow {
  id: string;
  taxYear: number;
  serviceType: ServiceType;
  status: DossierStatus;
  createdAt: Date;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Uploaded, non-deleted documents on this dossier — the files an admin can download. */
  documentCount: number;
  /** The admin who has claimed this dossier, or null while it is unassigned. */
  reservedBy: string | null;
  /** That admin's display name, resolved in the same query; null when unassigned. */
  reservedByName: string | null;
  /** The special situation picked before the declaration ("standard" by default). */
  situation: string;
  /** Canton of domicile from the questionnaire answers, or "" when not set. */
  canton: string;
  /** The client paid for express (48h) handling — the mockup's red badge. */
  express: boolean;
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
  serviceType,
  clientId,
  reservedBy,
}: {
  limit?: number;
  taxYear?: number;
  serviceType?: ServiceType;
  /** Narrow to one client, for a per-client admin view. */
  clientId?: string;
  /** Narrow to the dossiers one admin has reserved — an ordinary admin's view. */
  reservedBy?: string;
} = {}): Promise<AdminDossierRow[]> {
  // Self-join on `users` to resolve the reserving admin's name alongside the
  // client's, in the one query the table already runs.
  const reserver = alias(users, "reserver");
  return db
    .select({
      id: dossiers.id,
      taxYear: dossiers.taxYear,
      serviceType: dossiers.serviceType,
      status: dossiers.status,
      createdAt: dossiers.createdAt,
      clientId: dossiers.clientId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      reservedBy: dossiers.reservedBy,
      reservedByName: sql<
        string | null
      >`nullif(trim(concat(${reserver.firstName}, ' ', ${reserver.lastName})), '')`,
      // Canton lives in the questionnaire answers (declarations set it); other
      // prestations may leave it blank, which the table renders as "—".
      canton: sql<string>`coalesce(${dossiers.answers} ->> 'canton', '')`,
      // The express (48h) upgrade, from the same answers blob.
      express: sql<boolean>`coalesce((${dossiers.answers} ->> 'express')::boolean, false)`,
      // The special situation the client picked, which the row shows as a pill
      // under their name ("Normale", "Départ à l'étranger", …).
      situation: sql<string>`coalesce(${dossiers.answers} ->> 'situation', 'standard')`,
      // Counted in the same query so the table can flag which dossiers carry
      // files without a follow-up round trip per row. Mirrors the filter in
      // listDocumentsForDossier: uploaded and not soft-deleted.
      documentCount: sql<number>`(
        select count(*)::int from ${documents}
        where ${documents.dossierId} = ${dossiers.id}
          and ${documents.uploadedAt} is not null
          and ${documents.deletedAt} is null
      )`,
    })
    .from(dossiers)
    .innerJoin(users, eq(users.id, dossiers.clientId))
    .leftJoin(reserver, eq(reserver.id, dossiers.reservedBy))
    .where(
      and(
        taxYear ? eq(dossiers.taxYear, taxYear) : undefined,
        serviceType ? eq(dossiers.serviceType, serviceType) : undefined,
        clientId ? eq(dossiers.clientId, clientId) : undefined,
        reservedBy ? eq(dossiers.reservedBy, reservedBy) : undefined,
      ),
    )
    .orderBy(desc(dossiers.taxYear), desc(dossiers.createdAt))
    .limit(limit);
}

export interface DossierPaymentInfo {
  status: "paid" | "pending";
  amountChf: number;
  invoiceNumber: string | null;
}

/**
 * The settled/last payment tied to a dossier, for the admin detail screen's
 * "Statut de paiement". Prefers a paid row; returns null when nothing is
 * recorded against the dossier yet.
 */
export async function getDossierPayment(
  dossierId: string,
): Promise<DossierPaymentInfo | null> {
  const rows = await db
    .select({
      status: payments.status,
      amountChf: payments.amountChf,
      invoiceNumber: payments.invoiceNumber,
    })
    .from(payments)
    .where(eq(payments.dossierId, dossierId))
    .orderBy(desc(payments.paidAt));
  if (rows.length === 0) return null;
  const paid = rows.find((r) => r.status === "paid") ?? rows[0];
  return {
    status: paid.status,
    amountChf: paid.amountChf,
    invoiceNumber: paid.invoiceNumber,
  };
}

/** Distinct tax years that have at least one dossier, newest first. */
export async function listTaxYears(): Promise<number[]> {
  const rows = await db
    .selectDistinct({ taxYear: dossiers.taxYear })
    .from(dossiers)
    .orderBy(desc(dossiers.taxYear));
  return rows.map((r) => r.taxYear);
}

export async function countAllDossiers(
  taxYear?: number,
  serviceType?: ServiceType,
): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(dossiers)
    .where(
      and(
        taxYear ? eq(dossiers.taxYear, taxYear) : undefined,
        serviceType ? eq(dossiers.serviceType, serviceType) : undefined,
      ),
    );
  return Number(row?.value ?? 0);
}

/**
 * How many dossiers exist per prestation, for the admin Dossiers hub cards.
 * One grouped query rather than one count per card.
 */
/**
 * How many dossiers each prestation has, for one period.
 *
 * Every list is period-scoped again — the firm asked for one layout across all
 * seven, and the declaration's has a period picker — so the hub counts the
 * same way and the card matches the page it links to.
 */
export async function countDossiersByService(
  taxYear?: number,
  /** Narrow to one admin's reserved dossiers — an ordinary admin's hub. */
  reservedBy?: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({
      serviceType: dossiers.serviceType,
      value: sql<number>`count(*)`,
    })
    .from(dossiers)
    .where(
      and(
        taxYear ? eq(dossiers.taxYear, taxYear) : undefined,
        reservedBy ? eq(dossiers.reservedBy, reservedBy) : undefined,
      ),
    )
    .groupBy(dossiers.serviceType);

  return Object.fromEntries(rows.map((r) => [r.serviceType, Number(r.value)]));
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

/**
 * Submits a dossier as a system action, after payment.
 *
 * The webhook that confirms a Stripe payment is not an authenticated user, so
 * it cannot go through `setDossierStatus`'s owner/admin check. This moves a
 * dossier from `not_started` to `submitted` and nothing else: an already
 * submitted (or further along) dossier is left untouched, so a replayed or
 * duplicate payment event cannot rewind its status. Returns whether this call
 * was the one that submitted it.
 */
export async function markDossierSubmitted(
  dossierId: string,
): Promise<{ submitted: boolean }> {
  const result = await db
    .update(dossiers)
    .set({ status: "submitted", updatedAt: new Date() })
    .where(and(eq(dossiers.id, dossierId), eq(dossiers.status, "not_started")))
    .returning({ id: dossiers.id });
  return { submitted: result.length > 0 };
}

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

export type ReserveResult =
  | { ok: true; dossier: Dossier }
  | { ok: false; error: "not_found" | "already_reserved" };

/**
 * Claims a dossier for an administrator — the mockup's "Réserver".
 *
 * A free dossier is claimed by anyone with admin rights. One already held by a
 * colleague is only reassigned by a super admin (an ordinary admin cannot take
 * a peer's work); asking to reserve a dossier you already hold is a no-op that
 * returns it. The write is guarded on the previous holder so two admins racing
 * for the same free dossier cannot both win.
 */
export async function reserveDossier(
  dossierId: string,
  admin: { id: string; role: Role },
  /** A super admin may assign to another admin; ignored for ordinary admins. */
  targetAdminId?: string,
): Promise<ReserveResult> {
  const assignTo =
    targetAdminId && admin.role === "super_admin" ? targetAdminId : admin.id;

  const [dossier] = await db
    .select()
    .from(dossiers)
    .where(eq(dossiers.id, dossierId));
  if (!dossier) return { ok: false, error: "not_found" };

  if (dossier.reservedBy === assignTo) return { ok: true, dossier };
  // An ordinary admin can only claim a free dossier for themselves; a super
  // admin may (re)assign any dossier to any admin.
  if (dossier.reservedBy && admin.role !== "super_admin") {
    return { ok: false, error: "already_reserved" };
  }

  const [updated] = await db
    .update(dossiers)
    .set({ reservedBy: assignTo, reservedAt: new Date(), updatedAt: new Date() })
    .where(
      admin.role === "super_admin"
        ? eq(dossiers.id, dossierId)
        : // Guard on "free" so two admins racing for the same dossier can't
          // both win.
          and(eq(dossiers.id, dossierId), isNull(dossiers.reservedBy)),
    )
    .returning();

  if (!updated) return { ok: false, error: "already_reserved" };
  return { ok: true, dossier: updated };
}

/**
 * Releases a dossier back to the unassigned pool — the mockup's "Libérer".
 * The holder may release their own; a super admin may release anyone's.
 */
export async function releaseDossier(
  dossierId: string,
  admin: { id: string; role: Role },
): Promise<{ ok: true } | { ok: false; error: "not_found" | "forbidden" }> {
  const [dossier] = await db
    .select()
    .from(dossiers)
    .where(eq(dossiers.id, dossierId));
  if (!dossier) return { ok: false, error: "not_found" };
  if (!dossier.reservedBy) return { ok: true };
  if (dossier.reservedBy !== admin.id && admin.role !== "super_admin") {
    return { ok: false, error: "forbidden" };
  }

  await db
    .update(dossiers)
    .set({ reservedBy: null, reservedAt: null, updatedAt: new Date() })
    .where(eq(dossiers.id, dossierId));
  return { ok: true };
}

/**
 * Spreads every unreserved dossier of a period evenly across the active
 * administrators — the mockup's "Distribution automatique". Round-robin over
 * the admins sorted by id so the split is deterministic, oldest dossiers first.
 * Returns how many were assigned. A no-op (returns 0) when there is nothing to
 * distribute or no one to distribute to.
 */
export async function autoDistributeDossiers(
  taxYear: number,
): Promise<{ assigned: number }> {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        sql`${users.role} in ('admin', 'super_admin')`,
        isNull(users.disabledAt),
      ),
    )
    .orderBy(asc(users.id));
  if (admins.length === 0) return { assigned: 0 };

  const free = await db
    .select({ id: dossiers.id })
    .from(dossiers)
    .where(and(eq(dossiers.taxYear, taxYear), isNull(dossiers.reservedBy)))
    .orderBy(asc(dossiers.createdAt));
  if (free.length === 0) return { assigned: 0 };

  const now = new Date();
  await db.transaction(async (tx) => {
    for (let i = 0; i < free.length; i++) {
      const adminId = admins[i % admins.length].id;
      await tx
        .update(dossiers)
        .set({ reservedBy: adminId, reservedAt: now, updatedAt: now })
        // Still guard on "free" so a concurrent manual reservation is not
        // clobbered by the batch.
        .where(and(eq(dossiers.id, free[i].id), isNull(dossiers.reservedBy)));
    }
  });

  return { assigned: free.length };
}

/**
 * How many dossiers of a period nobody has reserved, split by prestation.
 *
 * Feeds both the "Dossiers libres" card on the statistics screen and the
 * per-prestation ceilings the distribution wizard offers, so the two can never
 * disagree about what is actually available.
 */
export async function countFreeDossiersByService(
  taxYear: number,
): Promise<Record<ServiceType, number>> {
  const rows = await db
    .select({
      serviceType: dossiers.serviceType,
      value: sql<number>`count(*)`,
    })
    .from(dossiers)
    .where(and(eq(dossiers.taxYear, taxYear), isNull(dossiers.reservedBy)))
    .groupBy(dossiers.serviceType);

  const counts = Object.fromEntries(
    SERVICE_TYPES.map((svc) => [svc, 0]),
  ) as Record<ServiceType, number>;
  for (const row of rows) counts[row.serviceType] = Number(row.value);
  return counts;
}

/** One line of a distribution: give this admin N free dossiers of this type. */
export interface DistributionAllocation {
  adminId: string;
  serviceType: ServiceType;
  count: number;
}

/**
 * Hands out a chosen number of free dossiers per administrator and prestation —
 * the reference's two-step "Distribuer les dossiers" wizard, as opposed to
 * {@link autoDistributeDossiers}, which spreads everything evenly in one click.
 *
 * Oldest dossiers go first, and each update still guards on the dossier being
 * free, so a reservation made while the wizard was open is never clobbered.
 * Asking for more than exist simply assigns what there is.
 */
export async function distributeDossiers(
  taxYear: number,
  allocations: DistributionAllocation[],
): Promise<{ assigned: number }> {
  const wanted = allocations.filter((a) => a.count > 0);
  if (wanted.length === 0) return { assigned: 0 };

  // Only real, active administrators may receive dossiers. A stale id from the
  // browser must not park a dossier on a deleted or demoted account.
  const eligible = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        sql`${users.role} in ('admin', 'super_admin')`,
        isNull(users.disabledAt),
      ),
    );
  const eligibleIds = new Set(eligible.map((a) => a.id));

  const free = await db
    .select({ id: dossiers.id, serviceType: dossiers.serviceType })
    .from(dossiers)
    .where(and(eq(dossiers.taxYear, taxYear), isNull(dossiers.reservedBy)))
    .orderBy(asc(dossiers.createdAt));

  const pool = new Map<ServiceType, string[]>();
  for (const row of free) {
    const list = pool.get(row.serviceType) ?? [];
    list.push(row.id);
    pool.set(row.serviceType, list);
  }

  const now = new Date();
  let assigned = 0;

  await db.transaction(async (tx) => {
    for (const allocation of wanted) {
      if (!eligibleIds.has(allocation.adminId)) continue;
      const available = pool.get(allocation.serviceType) ?? [];

      for (let i = 0; i < allocation.count; i++) {
        const dossierId = available.shift();
        if (!dossierId) break;

        await tx
          .update(dossiers)
          .set({
            reservedBy: allocation.adminId,
            reservedAt: now,
            updatedAt: now,
          })
          .where(and(eq(dossiers.id, dossierId), isNull(dossiers.reservedBy)));
        assigned++;
      }
    }
  });

  return { assigned };
}

/**
 * Deletes a draft dossier and everything hanging off it.
 *
 * Only the owner (or an admin) may delete, and only while the dossier is still
 * `not_started` — once it is submitted/paid it is locked, matching the mockup's
 * `canDelete: !submitted`. There is no FK cascade, so the document, notification
 * and payment rows are removed first; the stored bytes for each document are
 * dropped before the transaction (S3 cannot join it), and a failed object
 * delete is logged rather than aborting — a row must never outlive its bytes'
 * owner.
 */
export async function deleteDossier(
  dossierId: string,
  requester: { id: string; role: Role },
): Promise<{ ok: true } | { ok: false; error: "not_found" | "not_deletable" }> {
  const access = await getAccessibleDossier(dossierId, requester);
  if (!access.ok) return { ok: false, error: "not_found" };
  if (access.dossier.status !== "not_started") {
    return { ok: false, error: "not_deletable" };
  }

  const docs = await db
    .select({ id: documents.id, storageKey: documents.storageKey })
    .from(documents)
    .where(eq(documents.dossierId, dossierId));

  for (const doc of docs) {
    try {
      await deleteObject(doc.storageKey);
    } catch (err) {
      logger.error(
        { err, documentId: doc.id, storageKey: doc.storageKey },
        "dossier delete: object could not be removed",
      );
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(documents).where(eq(documents.dossierId, dossierId));
    await tx
      .delete(dossierNotifications)
      .where(eq(dossierNotifications.dossierId, dossierId));
    await tx.delete(payments).where(eq(payments.dossierId, dossierId));
    await tx.delete(dossiers).where(eq(dossiers.id, dossierId));
  });

  return { ok: true };
}
