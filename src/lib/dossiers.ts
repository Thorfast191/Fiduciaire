import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { dossiers, type Dossier, type DossierStatus, type Role } from "@/db/schema";

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

export async function listDossiersForClient(clientId: string): Promise<Dossier[]> {
  return db
    .select()
    .from(dossiers)
    .where(eq(dossiers.clientId, clientId))
    .orderBy(desc(dossiers.taxYear));
}

export type AccessCheckResult =
  | { ok: true; dossier: Dossier }
  | { ok: false; error: "not_found" };

export async function getAccessibleDossier(
  dossierId: string,
  requester: { id: string; role: Role },
): Promise<AccessCheckResult> {
  const [dossier] = await db.select().from(dossiers).where(eq(dossiers.id, dossierId));
  if (!dossier) {
    return { ok: false, error: "not_found" };
  }
  const isOwner = dossier.clientId === requester.id;
  const isAdmin = requester.role === "admin" || requester.role === "super_admin";
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
  const [dossier] = await db.select().from(dossiers).where(eq(dossiers.id, dossierId));
  const isOwner = dossier?.clientId === requester.id;
  const isAdmin = requester.role === "admin" || requester.role === "super_admin";
  if (!dossier || (!isOwner && !isAdmin)) {
    return { ok: false, error: "not_found" };
  }

  if (!isAdmin && (newStatus !== "submitted" || dossier.status !== "not_started")) {
    return { ok: false, error: "invalid_transition" };
  }

  const previousStatus = dossier.status;
  await db
    .update(dossiers)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(dossiers.id, dossierId));
  return { ok: true, previousStatus };
}
