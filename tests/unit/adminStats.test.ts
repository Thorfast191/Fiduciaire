import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { users, dossiers } from "@/db/schema";
import { getAdminDashboardStats } from "@/lib/adminStats";

async function makeClient(): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      email: `stats-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "S",
      lastName: "T",
      role: "client",
    })
    .returning();
  return u.id;
}

describe("getAdminDashboardStats", () => {
  it("returns a stable shape (all 4 status keys, tax years sorted desc)", async () => {
    const stats = await getAdminDashboardStats();

    expect(Object.keys(stats.byStatus).sort()).toEqual(
      ["completed", "in_review", "not_started", "submitted"],
    );
    const years = stats.byTaxYear.map((r) => r.taxYear);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(stats.totalClients).toBeGreaterThanOrEqual(0);
    expect(stats.completedDossiers).toBe(stats.byStatus.completed);
  });

  it("counts newly-seeded dossiers and clients", async () => {
    // Unique tax year so this test's rows are unambiguously identifiable
    // even though other test files write to the same tables in parallel.
    const uniqueYear = 900000 + Math.floor(Math.random() * 90000);
    const before = await getAdminDashboardStats();

    // One dossier per client per year is now enforced, so the three rows this
    // test counts need three distinct clients rather than two.
    const c1 = await makeClient();
    const c2 = await makeClient();
    const c3 = await makeClient();
    await db.insert(dossiers).values([
      { clientId: c1, taxYear: uniqueYear, status: "completed" },
      { clientId: c2, taxYear: uniqueYear, status: "in_review" },
      { clientId: c3, taxYear: uniqueYear, status: "completed" },
    ]);

    const after = await getAdminDashboardStats();

    // Deterministic: only this test uses `uniqueYear`.
    const mine = after.byTaxYear.find((r) => r.taxYear === uniqueYear);
    expect(mine?.count).toBe(3);
    expect(after.byTaxYear.map((r) => r.taxYear)).toEqual(
      [...after.byTaxYear.map((r) => r.taxYear)].sort((a, b) => b - a),
    );

    // Shared counters: tolerate concurrent inserts from other test files
    // (no test in this suite deletes dossiers or users).
    expect(after.totalDossiers).toBeGreaterThanOrEqual(before.totalDossiers + 3);
    expect(after.totalClients).toBeGreaterThanOrEqual(before.totalClients + 3);
    expect(after.byStatus.completed).toBeGreaterThanOrEqual(
      before.byStatus.completed + 2,
    );
    expect(after.byStatus.in_review).toBeGreaterThanOrEqual(
      before.byStatus.in_review + 1,
    );
  });
});
