import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { users, type Role } from "@/db/schema";

export interface AccountRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: Date;
}

const COLUMNS = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
};

/** Admin and super-admin accounts, super admins first. */
export async function listAdminAccounts(): Promise<AccountRow[]> {
  const rows = await db
    .select(COLUMNS)
    .from(users)
    .where(and(ne(users.role, "client"), isNull(users.disabledAt)))
    .orderBy(asc(users.createdAt));

  return rows.sort((a, b) =>
    a.role === b.role ? 0 : a.role === "super_admin" ? -1 : 1,
  );
}

export async function listClientAccounts(limit = 100): Promise<AccountRow[]> {
  return db
    .select(COLUMNS)
    .from(users)
    .where(and(eq(users.role, "client"), isNull(users.disabledAt)))
    .orderBy(asc(users.lastName), asc(users.firstName))
    .limit(limit);
}

/**
 * Demotes an administrator back to a client account rather than deleting the
 * row: `dossiers` and `audit_log` reference users, and the audit trail must
 * survive someone losing admin rights.
 */
export async function demoteAdmin(id: string): Promise<AccountRow | null> {
  const [row] = await db
    .update(users)
    .set({ role: "client", updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.role, "admin")))
    .returning(COLUMNS);

  return row ?? null;
}

/**
 * Promotes a client to an administrator — the mockup's "Passer administrateur".
 * Guarded on the `client` role so it never touches an existing admin or a
 * super admin, and returns null when the id is not a client to promote.
 */
export async function promoteClient(id: string): Promise<AccountRow | null> {
  const [row] = await db
    .update(users)
    .set({ role: "admin", updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.role, "client")))
    .returning(COLUMNS);

  return row ?? null;
}

/**
 * Deactivates a client account — the mockup's "Supprimer" on the clients list.
 *
 * A soft delete (stamps `disabled_at`) rather than a row removal: `dossiers`,
 * `documents`, `payments` and `audit_log` all reference the user, and the record
 * of who filed what must survive an account being closed. Every admin listing
 * already filters on `disabled_at is null`, so a deactivated client drops out of
 * the app. Guarded on the `client` role so it can never disable an admin here.
 */
export async function deactivateClient(id: string): Promise<AccountRow | null> {
  const [row] = await db
    .update(users)
    .set({ disabledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.role, "client")))
    .returning(COLUMNS);

  return row ?? null;
}

/** One account by id, for an admin screen that already holds a client's id. */
export async function getClientById(
  id: string,
): Promise<AccountRow | undefined> {
  const [row] = await db.select(COLUMNS).from(users).where(eq(users.id, id));
  return row;
}
