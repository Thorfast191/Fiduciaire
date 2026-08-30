import { describe, it, expect } from "vitest";
import { db } from "../../src/db/client";
import { users } from "../../src/db/schema";
import { hashPassword } from "../../src/lib/auth/password";
import {
  createDossier,
  listDossiersForClient,
  getAccessibleDossier,
  setDossierStatus,
} from "../../src/lib/dossiers";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `dossiers-biz-${Date.now()}-${Math.random()}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword("irrelevant-here"),
      firstName: "A",
      lastName: "B",
      role,
    })
    .returning();
  return user;
}

describe("createDossier", () => {
  it("creates a dossier with status not_started", async () => {
    const client = await makeUser();
    const dossier = await createDossier({ clientId: client.id, taxYear: 2025 });
    expect(dossier.clientId).toBe(client.id);
    expect(dossier.taxYear).toBe(2025);
    expect(dossier.status).toBe("not_started");
  });
});

describe("listDossiersForClient", () => {
  it("returns only the given client's dossiers, newest tax year first", async () => {
    const client = await makeUser();
    const other = await makeUser();
    await createDossier({ clientId: client.id, taxYear: 2023 });
    await createDossier({ clientId: client.id, taxYear: 2025 });
    await createDossier({ clientId: other.id, taxYear: 2025 });

    const list = await listDossiersForClient(client.id);
    expect(list.map((d) => d.taxYear)).toEqual([2025, 2023]);
  });
});

describe("getAccessibleDossier", () => {
  it("allows the owner, denies another client, and allows an admin", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const admin = await makeUser("admin");
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    expect((await getAccessibleDossier(dossier.id, { id: owner.id, role: "client" })).ok).toBe(true);
    expect((await getAccessibleDossier(dossier.id, { id: other.id, role: "client" })).ok).toBe(false);
    expect((await getAccessibleDossier(dossier.id, { id: admin.id, role: "admin" })).ok).toBe(true);
  });

  it("returns not_found for a nonexistent dossier", async () => {
    const result = await getAccessibleDossier("00000000-0000-0000-0000-000000000000", {
      id: "00000000-0000-0000-0000-000000000001",
      role: "client",
    });
    expect(result).toEqual({ ok: false, error: "not_found" });
  });
});

describe("setDossierStatus", () => {
  it("lets the owning client move not_started to submitted", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const result = await setDossierStatus(dossier.id, "submitted", { id: owner.id, role: "client" });
    expect(result).toEqual({ ok: true, previousStatus: "not_started" });
  });

  it("rejects a client trying to set any other status", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const result = await setDossierStatus(dossier.id, "in_review", { id: owner.id, role: "client" });
    expect(result).toEqual({ ok: false, error: "invalid_transition" });
  });

  it("rejects a client trying to submit an already-submitted dossier", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    await setDossierStatus(dossier.id, "submitted", { id: owner.id, role: "client" });

    const result = await setDossierStatus(dossier.id, "submitted", { id: owner.id, role: "client" });
    expect(result).toEqual({ ok: false, error: "invalid_transition" });
  });

  it("rejects a non-owner client with not_found", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const result = await setDossierStatus(dossier.id, "submitted", { id: other.id, role: "client" });
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("lets an admin set any status regardless of the current one", async () => {
    const owner = await makeUser();
    const admin = await makeUser("admin");
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const result = await setDossierStatus(dossier.id, "completed", { id: admin.id, role: "admin" });
    expect(result).toEqual({ ok: true, previousStatus: "not_started" });
  });
});
