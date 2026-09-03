import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import {
  demoteAdmin,
  listAdminAccounts,
  listClientAccounts,
} from "@/lib/adminUsers";

async function makeUser(role: "client" | "admin" | "super_admin") {
  const [u] = await db
    .insert(users)
    .values({
      email: `au-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "A",
      lastName: "U",
      role,
    })
    .returning();
  return u;
}

describe("listAdminAccounts", () => {
  it("returns admins and super admins but never clients", async () => {
    const admin = await makeUser("admin");
    const client = await makeUser("client");

    const ids = (await listAdminAccounts()).map((a) => a.id);

    expect(ids).toContain(admin.id);
    expect(ids).not.toContain(client.id);
  });

  it("puts super admins first", async () => {
    const rows = await listAdminAccounts();
    const firstOrdinary = rows.findIndex((r) => r.role !== "super_admin");
    const lastSuper = rows.map((r) => r.role).lastIndexOf("super_admin");

    if (firstOrdinary !== -1 && lastSuper !== -1) {
      expect(lastSuper).toBeLessThan(firstOrdinary);
    }
  });

  it("excludes disabled accounts", async () => {
    const admin = await makeUser("admin");
    await db
      .update(users)
      .set({ disabledAt: new Date() })
      .where(eq(users.id, admin.id));

    const ids = (await listAdminAccounts()).map((a) => a.id);
    expect(ids).not.toContain(admin.id);
  });
});

describe("listClientAccounts", () => {
  it("returns clients only, bounded by the limit", async () => {
    await makeUser("client");
    const rows = await listClientAccounts(5);

    expect(rows.length).toBeLessThanOrEqual(5);
    for (const r of rows) expect(r.role).toBe("client");
  });
});

describe("demoteAdmin", () => {
  it("turns an admin back into a client instead of deleting the row", async () => {
    const admin = await makeUser("admin");

    const result = await demoteAdmin(admin.id);
    expect(result?.role).toBe("client");

    // The row survives, so dossiers and audit entries keep resolving.
    const [row] = await db.select().from(users).where(eq(users.id, admin.id));
    expect(row).toBeTruthy();
    expect(row.role).toBe("client");
  });

  it("refuses to demote a super admin", async () => {
    const superAdmin = await makeUser("super_admin");

    expect(await demoteAdmin(superAdmin.id)).toBeNull();

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, superAdmin.id));
    expect(row.role).toBe("super_admin");
  });
});
