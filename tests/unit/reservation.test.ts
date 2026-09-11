import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { users, dossiers, payments } from "../../src/db/schema";
import {
  createDossier,
  reserveDossier,
  releaseDossier,
  autoDistributeDossiers,
} from "../../src/lib/dossiers";
import { getAdminHomeStats } from "../../src/lib/adminStats";
import { promoteClient, deactivateClient } from "../../src/lib/adminUsers";

async function makeUser(role: "client" | "admin" | "super_admin" = "client") {
  const [user] = await db
    .insert(users)
    .values({
      email: `resv-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "A",
      lastName: "B",
      role,
    })
    .returning();
  return user;
}

/** A tax year unique to one test, so its rows are isolated from other suites. */
function uniqueYear() {
  return 700000 + Math.floor(Math.random() * 90000);
}

describe("reserveDossier / releaseDossier", () => {
  it("claims a free dossier and is idempotent for the same admin", async () => {
    const client = await makeUser();
    const admin = await makeUser("admin");
    const d = await createDossier({ clientId: client.id, taxYear: uniqueYear() });

    const first = await reserveDossier(d.id, { id: admin.id, role: "admin" });
    expect(first.ok).toBe(true);

    const again = await reserveDossier(d.id, { id: admin.id, role: "admin" });
    expect(again.ok).toBe(true);

    const [row] = await db.select().from(dossiers).where(eq(dossiers.id, d.id));
    expect(row.reservedBy).toBe(admin.id);
    expect(row.reservedAt).not.toBeNull();
  });

  it("stops an ordinary admin from stealing a colleague's dossier", async () => {
    const client = await makeUser();
    const a1 = await makeUser("admin");
    const a2 = await makeUser("admin");
    const d = await createDossier({ clientId: client.id, taxYear: uniqueYear() });

    await reserveDossier(d.id, { id: a1.id, role: "admin" });
    const stolen = await reserveDossier(d.id, { id: a2.id, role: "admin" });
    expect(stolen).toEqual({ ok: false, error: "already_reserved" });
  });

  it("lets a super admin reassign, and the holder release", async () => {
    const client = await makeUser();
    const a1 = await makeUser("admin");
    const sa = await makeUser("super_admin");
    const d = await createDossier({ clientId: client.id, taxYear: uniqueYear() });

    await reserveDossier(d.id, { id: a1.id, role: "admin" });

    const reassigned = await reserveDossier(d.id, {
      id: sa.id,
      role: "super_admin",
    });
    expect(reassigned.ok).toBe(true);

    // The former holder can no longer release it; the new holder can.
    const forbidden = await releaseDossier(d.id, { id: a1.id, role: "admin" });
    expect(forbidden).toEqual({ ok: false, error: "forbidden" });

    const released = await releaseDossier(d.id, {
      id: sa.id,
      role: "super_admin",
    });
    expect(released.ok).toBe(true);

    const [row] = await db.select().from(dossiers).where(eq(dossiers.id, d.id));
    expect(row.reservedBy).toBeNull();
  });
});

describe("autoDistributeDossiers", () => {
  it("spreads the period's free dossiers across the admins", async () => {
    const year = uniqueYear();
    // At least two admins exist (other suites seed some too); the year isolates
    // this test's dossiers.
    await makeUser("admin");
    await makeUser("super_admin");
    const clients = await Promise.all([
      makeUser(),
      makeUser(),
      makeUser(),
      makeUser(),
    ]);
    for (const c of clients) {
      await createDossier({ clientId: c.id, taxYear: year });
    }

    const { assigned } = await autoDistributeDossiers(year);
    expect(assigned).toBe(4);

    const rows = await db
      .select({ reservedBy: dossiers.reservedBy })
      .from(dossiers)
      .where(eq(dossiers.taxYear, year));
    // Every dossier in this period is now assigned to some active admin.
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.reservedBy !== null)).toBe(true);

    // A second run has nothing left to do.
    expect((await autoDistributeDossiers(year)).assigned).toBe(0);
  });
});

describe("getAdminHomeStats", () => {
  it("counts the admin's own reserved dossiers, closures and revenue", async () => {
    const year = uniqueYear();
    const admin = await makeUser("admin");
    const other = await makeUser("admin");
    const c1 = await makeUser();
    const c2 = await makeUser();
    const c3 = await makeUser();

    const d1 = await createDossier({ clientId: c1.id, taxYear: year });
    const d2 = await createDossier({
      clientId: c2.id,
      taxYear: year,
      serviceType: "capital",
    });
    const d3 = await createDossier({ clientId: c3.id, taxYear: year });

    await reserveDossier(d1.id, { id: admin.id, role: "admin" });
    await reserveDossier(d2.id, { id: admin.id, role: "admin" });
    await reserveDossier(d3.id, { id: other.id, role: "admin" }); // not mine

    // Close one of mine.
    await db
      .update(dossiers)
      .set({ status: "completed" })
      .where(eq(dossiers.id, d2.id));

    // A settled payment on one of my dossiers counts toward my revenue.
    await db.insert(payments).values({
      clientId: c1.id,
      taxYear: year,
      label: "Déclaration",
      amountChf: 120,
      status: "paid",
      dossierId: d1.id,
    });

    const stats = await getAdminHomeStats(admin.id, year);
    expect(stats.reservedTotal).toBe(2);
    expect(stats.reservedCompleted).toBe(1);
    expect(stats.personalRevenueChf).toBe(120);
    expect(stats.byService.declaration).toBe(1);
    expect(stats.byService.capital).toBe(1);
  });
});

describe("promoteClient / deactivateClient", () => {
  it("promotes only a client, and never a super admin", async () => {
    const client = await makeUser();
    const sa = await makeUser("super_admin");

    const promoted = await promoteClient(client.id);
    expect(promoted?.role).toBe("admin");

    // Not a client any more → a second promote is a no-op.
    expect(await promoteClient(client.id)).toBeNull();
    // A super admin is never touched by promote.
    expect(await promoteClient(sa.id)).toBeNull();
  });

  it("soft-deletes a client by stamping disabled_at", async () => {
    const client = await makeUser();
    const removed = await deactivateClient(client.id);
    expect(removed?.id).toBe(client.id);

    const [row] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, client.id)));
    expect(row.disabledAt).not.toBeNull();

    // Only clients: deactivating a non-client is a no-op.
    const admin = await makeUser("admin");
    expect(await deactivateClient(admin.id)).toBeNull();
  });
});
