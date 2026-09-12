import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "../../src/db/client";
import { users, payments } from "../../src/db/schema";
import { createDossier, reserveDossier, getDossierPayment } from "../../src/lib/dossiers";
import { addComment, listComments, deleteComment } from "../../src/lib/comments";
import { getPerAdminStats } from "../../src/lib/adminStats";

async function makeUser(role: "client" | "admin" | "super_admin" = "client") {
  const [u] = await db
    .insert(users)
    .values({
      email: `det-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "D",
      lastName: "T",
      role,
    })
    .returning();
  return u;
}

function uniqueYear() {
  return 600000 + Math.floor(Math.random() * 90000);
}

describe("internal comments", () => {
  it("adds, lists oldest-first, and deletes only the author's own", async () => {
    const client = await makeUser();
    const a1 = await makeUser("admin");
    const a2 = await makeUser("admin");
    const dossier = await createDossier({
      clientId: client.id,
      taxYear: uniqueYear(),
    });

    const first = await addComment(dossier.id, a1.id, "Premier");
    await addComment(dossier.id, a2.id, "Deuxième");

    const list = await listComments(dossier.id);
    expect(list.map((c) => c.body)).toEqual(["Premier", "Deuxième"]);
    expect(list[0].authorName).toBe("D T");

    // a2 cannot delete a1's comment; a1 can.
    expect(await deleteComment(first.id, a2.id)).toBe(false);
    expect(await deleteComment(first.id, a1.id)).toBe(true);
    expect((await listComments(dossier.id)).map((c) => c.body)).toEqual([
      "Deuxième",
    ]);
  });
});

describe("getDossierPayment", () => {
  it("returns null with no payment, and the paid row once recorded", async () => {
    const client = await makeUser();
    const dossier = await createDossier({
      clientId: client.id,
      taxYear: uniqueYear(),
    });

    expect(await getDossierPayment(dossier.id)).toBeNull();

    await db.insert(payments).values({
      clientId: client.id,
      taxYear: dossier.taxYear,
      label: "Déclaration",
      amountChf: 185,
      status: "paid",
      dossierId: dossier.id,
      invoiceNumber: `FID-${uniqueYear()}-${Math.floor(Math.random() * 9999)}`,
    });

    const p = await getDossierPayment(dossier.id);
    expect(p?.status).toBe("paid");
    expect(p?.amountChf).toBe(185);
    expect(p?.invoiceNumber).toBeTruthy();
  });
});

describe("getPerAdminStats", () => {
  it("summarises an admin's reserved dossiers, split by prestation, with revenue", async () => {
    const year = uniqueYear();
    const admin = await makeUser("admin");
    const c1 = await makeUser();
    const c2 = await makeUser();

    const d1 = await createDossier({ clientId: c1.id, taxYear: year });
    const d2 = await createDossier({
      clientId: c2.id,
      taxYear: year,
      serviceType: "capital",
    });
    await reserveDossier(d1.id, { id: admin.id, role: "admin" });
    await reserveDossier(d2.id, { id: admin.id, role: "admin" });

    await db.insert(payments).values({
      clientId: c1.id,
      taxYear: year,
      label: "Déclaration",
      amountChf: 90,
      status: "paid",
      dossierId: d1.id,
    });

    const cards = await getPerAdminStats(year);
    const mine = cards.find((c) => c.id === admin.id);
    expect(mine).toBeTruthy();
    expect(mine!.total).toBe(2);
    expect(mine!.revenueChf).toBe(90);
    expect(mine!.byService.declaration).toBe(1);
    expect(mine!.byService.capital).toBe(1);

    // Every active admin is listed, even with nothing reserved.
    const other = await makeUser("admin");
    const cards2 = await getPerAdminStats(year);
    const otherCard = cards2.find((c) => c.id === other.id);
    expect(otherCard?.total).toBe(0);
  });
});
