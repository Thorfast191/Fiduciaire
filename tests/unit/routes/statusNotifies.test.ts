import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "../../../src/db/client";
import { users, dossiers, dossierNotifications } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import {
  createSession,
  SESSION_COOKIE_NAME,
} from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
import { PATCH as setStatus } from "../../../src/app/api/dossiers/[id]/status/route";
import { notificationEmailTemplate } from "../../../src/lib/email/templates/notificationEmail";

/**
 * Closing a dossier, or opening a réclamation on it, tells the client by
 * e-mail without anyone remembering to. The two must not say the same thing:
 * one is the work finishing, the other is a dispute starting.
 */
async function makeUser(role: "client" | "admin") {
  const [user] = await db
    .insert(users)
    .values({
      email: `status-notify-${Date.now()}-${Math.random()}@example.test`,
      passwordHash: await hashPassword("irrelevant-here"),
      firstName: "Test",
      lastName: "Client",
      role,
    })
    .returning();
  return user;
}

async function patch(id: string, status: string, token: string) {
  const request = new NextRequest("http://localhost/api/dossiers/x/status", {
    method: "PATCH",
    body: JSON.stringify({ status }),
    headers: { "content-type": "application/json" },
  });
  request.cookies.set(SESSION_COOKIE_NAME, token);
  return setStatus(request, { params: Promise.resolve({ id }) });
}

async function kinds(dossierId: string) {
  const rows = await db
    .select({ kind: dossierNotifications.kind })
    .from(dossierNotifications)
    .where(eq(dossierNotifications.dossierId, dossierId));
  return rows.map((r) => r.kind);
}

/** A dossier mid-flight, ready to be closed or disputed. */
async function inReviewDossier() {
  const client = await makeUser("client");
  const admin = await makeUser("admin");
  const { token } = await createSession(admin.id, {});
  const dossier = await createDossier({
    clientId: client.id,
    taxYear: 2000 + Math.floor(Math.random() * 90),
    serviceType: "declaration",
  });
  await db
    .update(dossiers)
    .set({ status: "in_review" })
    .where(eq(dossiers.id, dossier.id));
  return { id: dossier.id, token };
}

describe("a status change notifies the client", () => {
  it("sends one notification when the dossier is closed", async () => {
    const { id, token } = await inReviewDossier();
    expect((await patch(id, "completed", token)).status).toBe(200);
    expect(await kinds(id)).toEqual(["dossier_completed"]);
  });

  it("sends a different one for a réclamation", async () => {
    const { id, token } = await inReviewDossier();
    expect((await patch(id, "reclamation", token)).status).toBe(200);
    expect(await kinds(id)).toEqual(["dossier_reclamation"]);
  });

  it("does not send again when the status is re-selected", async () => {
    const { id, token } = await inReviewDossier();
    await patch(id, "completed", token);
    await patch(id, "completed", token);
    expect(await kinds(id)).toEqual(["dossier_completed"]);
  });

  it("stays quiet for the statuses that are not news", async () => {
    const { id, token } = await inReviewDossier();
    await patch(id, "documents_received", token);
    expect(await kinds(id)).toEqual([]);
  });

  it("keeps a record the client can see in their space", async () => {
    const { id, token } = await inReviewDossier();
    await patch(id, "completed", token);
    const [row] = await db
      .select()
      .from(dossierNotifications)
      .where(
        and(
          eq(dossierNotifications.dossierId, id),
          eq(dossierNotifications.kind, "dossier_completed"),
        ),
      );
    expect(row).toBeTruthy();
    expect(row.acknowledgedAt).toBeNull();
  });
});

describe("the two e-mails read differently", () => {
  const render = (kind: "dossier_completed" | "dossier_reclamation") =>
    notificationEmailTemplate({
      kind,
      firstName: "Sophie",
      taxYear: 2025,
      locale: "fr",
    });

  it("gives each its own subject", () => {
    const closed = render("dossier_completed");
    const appeal = render("dossier_reclamation");
    expect(closed.subject).not.toBe(appeal.subject);
    expect(closed.subject).toMatch(/clôtur/i);
    expect(appeal.subject).toMatch(/réclamation/i);
  });

  it("gives each its own body", () => {
    expect(render("dossier_completed").text).not.toBe(
      render("dossier_reclamation").text,
    );
  });

  it("sends the firm's own letter, not an assembled one", () => {
    const text = render("dossier_completed").text;
    // Their wording, their sign-off, and nothing bolted on underneath it.
    expect(text).toMatch(/^Bonjour Sophie,/);
    expect(text.trimEnd()).toMatch(/L'équipe Fiduvia$/);
    expect(text).toMatch(/Administration cantonale des impôts/);
    expect(text).not.toMatch(/y répondre/i);
    expect(text).not.toMatch(/entièrement en ligne/);
  });

  it("puts the tax year in both letters", () => {
    expect(render("dossier_completed").text).toContain("2025");
    expect(render("dossier_reclamation").text).toContain("2025");
  });

  it("says the réclamation was filed, not merely opened", () => {
    const appeal = render("dossier_reclamation");
    expect(appeal.subject).toMatch(/déposée/i);
    expect(appeal.text).toMatch(/Nous avons déposé la réclamation/);
  });

  it("renders in the client's own language", () => {
    const en = notificationEmailTemplate({
      kind: "dossier_completed",
      firstName: "Sophie",
      taxYear: 2025,
      locale: "en",
    });
    expect(en.subject).toMatch(/closed/i);
  });
});
