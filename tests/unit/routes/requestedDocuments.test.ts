import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "../../../src/db/client";
import { users, dossierNotifications } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import {
  createSession,
  SESSION_COOKIE_NAME,
} from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
import { POST as notify } from "../../../src/app/api/dossiers/[id]/notifications/route";

/**
 * A document request has to survive as data, not only as a sentence in an
 * e-mail: the client's space turns each entry into its own upload slot, and it
 * cannot do that from prose.
 */
async function makeUser(role: "client" | "admin") {
  const [user] = await db
    .insert(users)
    .values({
      email: `reqdocs-${Date.now()}-${Math.random()}@example.test`,
      passwordHash: await hashPassword("irrelevant-here"),
      firstName: "Test",
      lastName: "Person",
      role,
    })
    .returning();
  return user;
}

async function fixture() {
  const client = await makeUser("client");
  const admin = await makeUser("admin");
  const { token } = await createSession(admin.id, {});
  const dossier = await createDossier({
    clientId: client.id,
    taxYear: 2000 + Math.floor(Math.random() * 90),
    serviceType: "declaration",
  });
  return { dossierId: dossier.id, token };
}

function post(id: string, body: unknown, token: string) {
  const request = new NextRequest(
    "http://localhost/api/dossiers/x/notifications",
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    },
  );
  request.cookies.set(SESSION_COOKIE_NAME, token);
  return notify(request, { params: Promise.resolve({ id }) });
}

async function latest(dossierId: string) {
  const [row] = await db
    .select()
    .from(dossierNotifications)
    .where(eq(dossierNotifications.dossierId, dossierId))
    .orderBy(desc(dossierNotifications.createdAt))
    .limit(1);
  return row;
}

describe("a document request is stored as data", () => {
  it("keeps the categories and the typed-in pieces apart", async () => {
    const { dossierId, token } = await fixture();
    const res = await post(
      dossierId,
      {
        kind: "documents_requested",
        message: "• Certificat de salaire",
        requestedDocuments: {
          categories: ["certSalaire", "fraisMedicaux"],
          custom: ["Attestation de dons"],
        },
      },
      token,
    );
    expect(res.status).toBe(200);

    const row = await latest(dossierId);
    expect(row.requestedDocuments).toEqual({
      categories: ["certSalaire", "fraisMedicaux"],
      custom: ["Attestation de dons"],
    });
  });

  it("still accepts a request that names nothing, as before", async () => {
    const { dossierId, token } = await fixture();
    const res = await post(
      dossierId,
      { kind: "action_required", message: "Merci de nous rappeler." },
      token,
    );
    expect(res.status).toBe(200);
    expect((await latest(dossierId)).requestedDocuments).toBeNull();
  });

  it("refuses a category the upload route would reject anyway", async () => {
    const { dossierId, token } = await fixture();
    // Catching it here means the client never gets a slot that cannot work.
    const res = await post(
      dossierId,
      {
        kind: "documents_requested",
        requestedDocuments: { categories: ["not-a-real-category"], custom: [] },
      },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("refuses an empty label among the typed-in pieces", async () => {
    const { dossierId, token } = await fixture();
    const res = await post(
      dossierId,
      {
        kind: "documents_requested",
        requestedDocuments: { categories: [], custom: ["   "] },
      },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("is refused outright for a client", async () => {
    const { dossierId } = await fixture();
    const client = await makeUser("client");
    const { token } = await createSession(client.id, {});
    const res = await post(
      dossierId,
      {
        kind: "documents_requested",
        requestedDocuments: { categories: ["certSalaire"], custom: [] },
      },
      token,
    );
    expect(res.status).toBe(403);
  });
});
