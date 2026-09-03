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
