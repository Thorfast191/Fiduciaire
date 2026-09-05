import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { users, dossiers } from "@/db/schema";
import { listAllDossiersWithClient, listTaxYears } from "@/lib/dossiers";

async function makeClient(first: string, last: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      email: `adoss-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: first,
      lastName: last,
      role: "client",
    })
    .returning();
  return u.id;
}

describe("listAllDossiersWithClient", () => {
  it("joins each dossier to its client's name and email", async () => {
    // Unique tax year so these rows stay identifiable while other test files
    // write to the same tables in parallel.
    const year = 910000 + Math.floor(Math.random() * 80000);

    const clientId = await makeClient("Camille", "Rochat");
    await db
      .insert(dossiers)
      .values({ clientId, taxYear: year, status: "in_review" });

    const rows = (await listAllDossiersWithClient({ limit: 1000 })).filter(
      (r) => r.taxYear === year,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].firstName).toBe("Camille");
    expect(rows[0].lastName).toBe("Rochat");
    expect(rows[0].email).toMatch(/^adoss-.*@example\.test$/);
    expect(rows[0].status).toBe("in_review");
  });

  it("orders by tax year descending", async () => {
    const base = 920000 + Math.floor(Math.random() * 70000);
    const clientId = await makeClient("Ordre", "Test");

    await db.insert(dossiers).values([
      { clientId, taxYear: base },
      { clientId, taxYear: base + 2 },
      { clientId, taxYear: base + 1 },
    ]);

    const years = (await listAllDossiersWithClient({ limit: 1000 }))
      .filter((r) => r.taxYear >= base && r.taxYear <= base + 2)
      .map((r) => r.taxYear);

    expect(years).toEqual([base + 2, base + 1, base]);
  });

  it("returns at most `limit` rows, each with a resolved client", async () => {
    const rows = await listAllDossiersWithClient({ limit: 5 });

    expect(rows.length).toBeLessThanOrEqual(5);

    // Every returned row must carry a resolved client, since the join is inner.
    for (const r of rows) {
      expect(typeof r.email).toBe("string");
      expect(r.email.length).toBeGreaterThan(0);
    }
  });

  it("scopes to one tax year when asked", async () => {
    const year = 930000 + Math.floor(Math.random() * 60000);
    const clientId = await makeClient("Scope", "Test");

    await db.insert(dossiers).values([
      { clientId, taxYear: year },
      { clientId, taxYear: year + 1 },
    ]);

    const rows = await listAllDossiersWithClient({ taxYear: year, limit: 1000 });

    expect(rows).toHaveLength(1);
    expect(rows[0].taxYear).toBe(year);
  });
});

describe("listTaxYears", () => {
  it("returns distinct years, newest first, with no duplicates", async () => {
    const base = 940000 + Math.floor(Math.random() * 50000);
    // A client can no longer hold two dossiers for one year, so the repeated
    // year that `listTaxYears` must collapse comes from two different clients.
    const clientId = await makeClient("Years", "Test");
    const otherId = await makeClient("Years", "Other");

    await db.insert(dossiers).values([
      { clientId, taxYear: base },
      { clientId: otherId, taxYear: base },
      { clientId, taxYear: base + 1 },
    ]);

    const years = await listTaxYears();
    const mine = years.filter((y) => y === base || y === base + 1);

    expect(mine).toEqual([base + 1, base]);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });
});
