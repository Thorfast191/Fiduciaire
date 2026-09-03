import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, dossiers, dossierNotifications } from "@/db/schema";
import {
  acknowledgeNotification,
  countUnacknowledged,
  listNotificationsForDossier,
  sendDossierNotification,
} from "@/lib/notifications";
import { notificationEmailTemplate } from "@/lib/email/templates/notificationEmail";

async function makeClient(locale: "fr" | "en" = "fr") {
  const [u] = await db
    .insert(users)
    .values({
      email: `notif-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "Nina",
      lastName: "Client",
      role: "client",
      locale,
    })
    .returning();
  return u;
}

async function makeAdmin() {
  const [u] = await db
    .insert(users)
    .values({
      email: `notif-admin-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "A",
      lastName: "D",
      role: "admin",
    })
    .returning();
  return u;
}

async function makeDossier(clientId: string) {
  const [d] = await db
    .insert(dossiers)
    .values({ clientId, taxYear: 960000 + Math.floor(Math.random() * 30000) })
    .returning();
  return d;
}

describe("sendDossierNotification", () => {
  it("records the notification and leaves it unacknowledged", async () => {
    const client = await makeClient();
    const admin = await makeAdmin();
    const dossier = await makeDossier(client.id);

    const result = await sendDossierNotification({
      dossierId: dossier.id,
      sentBy: admin.id,
      kind: "documents_requested",
      message: "  Merci d'envoyer le certificat de salaire.  ",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Whitespace is trimmed so the client never sees ragged text.
    expect(result.notification.message).toBe(
      "Merci d'envoyer le certificat de salaire.",
    );
    expect(result.notification.acknowledgedAt).toBeNull();
    expect(await countUnacknowledged(dossier.id)).toBe(1);
  });

  it("stores an empty message as null rather than blank text", async () => {
    const client = await makeClient();
    const admin = await makeAdmin();
    const dossier = await makeDossier(client.id);

    const result = await sendDossierNotification({
      dossierId: dossier.id,
      sentBy: admin.id,
      kind: "action_required",
      message: "   ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.notification.message).toBeNull();
  });

  it("reports a dossier that does not exist", async () => {
    const admin = await makeAdmin();

    const result = await sendDossierNotification({
      dossierId: randomUUID(),
      sentBy: admin.id,
      kind: "action_required",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("dossier_not_found");
  });
});

describe("acknowledgeNotification", () => {
  it("marks the notification read for its own client", async () => {
    const client = await makeClient();
    const admin = await makeAdmin();
    const dossier = await makeDossier(client.id);

    const sent = await sendDossierNotification({
      dossierId: dossier.id,
      sentBy: admin.id,
      kind: "documents_requested",
    });
    if (!sent.ok) throw new Error("setup failed");

    expect(
      await acknowledgeNotification({
        notificationId: sent.notification.id,
        dossierId: dossier.id,
        clientId: client.id,
      }),
    ).toBe(true);
    expect(await countUnacknowledged(dossier.id)).toBe(0);

    const [row] = await db
      .select()
      .from(dossierNotifications)
      .where(eq(dossierNotifications.id, sent.notification.id));
    expect(row.acknowledgedAt).not.toBeNull();
  });

  it("refuses to acknowledge through a different dossier", async () => {
    const client = await makeClient();
    const admin = await makeAdmin();
    const dossier = await makeDossier(client.id);
    const otherDossier = await makeDossier(client.id);

    const sent = await sendDossierNotification({
      dossierId: dossier.id,
      sentBy: admin.id,
      kind: "documents_requested",
    });
    if (!sent.ok) throw new Error("setup failed");

    // Same client, but routed through a dossier the notification is not on.
    expect(
      await acknowledgeNotification({
        notificationId: sent.notification.id,
        dossierId: otherDossier.id,
        clientId: client.id,
      }),
    ).toBe(false);

    expect(await countUnacknowledged(dossier.id)).toBe(1);
  });

  it("refuses to acknowledge another client's notification", async () => {
    const owner = await makeClient();
    const stranger = await makeClient();
    const admin = await makeAdmin();
    const dossier = await makeDossier(owner.id);

    const sent = await sendDossierNotification({
      dossierId: dossier.id,
      sentBy: admin.id,
      kind: "action_required",
    });
    if (!sent.ok) throw new Error("setup failed");

    expect(
      await acknowledgeNotification({
        notificationId: sent.notification.id,
        dossierId: dossier.id,
        clientId: stranger.id,
      }),
    ).toBe(false);

    // Still pending for the real owner.
    expect(await countUnacknowledged(dossier.id)).toBe(1);
  });
});

describe("listNotificationsForDossier", () => {
  it("returns newest first", async () => {
    const client = await makeClient();
    const admin = await makeAdmin();
    const dossier = await makeDossier(client.id);

    await sendDossierNotification({
      dossierId: dossier.id,
      sentBy: admin.id,
      kind: "documents_requested",
    });
    await sendDossierNotification({
      dossierId: dossier.id,
      sentBy: admin.id,
      kind: "action_required",
    });

    const rows = await listNotificationsForDossier(dossier.id);

    expect(rows).toHaveLength(2);
    expect(rows[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      rows[1].createdAt.getTime(),
    );
  });
});

describe("notificationEmailTemplate", () => {
  it("renders in the recipient's locale", () => {
    const fr = notificationEmailTemplate({
      kind: "documents_requested",
      firstName: "Nina",
      taxYear: 2025,
      locale: "fr",
    });
    const en = notificationEmailTemplate({
      kind: "documents_requested",
      firstName: "Nina",
      taxYear: 2025,
      locale: "en",
    });

    expect(fr.subject).toContain("Pièces complémentaires");
    expect(en.subject).toContain("Additional documents");
    expect(fr.text).toContain("Bonjour Nina");
    expect(en.text).toContain("Hello Nina");
    expect(fr.text).toContain("2025");
  });

  it("uses different copy for each kind and defaults to French", () => {
    const docs = notificationEmailTemplate({
      kind: "documents_requested",
      firstName: "N",
      taxYear: 2025,
    });
    const action = notificationEmailTemplate({
      kind: "action_required",
      firstName: "N",
      taxYear: 2025,
    });

    expect(docs.subject).not.toBe(action.subject);
    expect(docs.subject).toContain("Fiduvia");
    expect(docs.text).toContain("Bonjour");
  });

  it("escapes the admin's note in the HTML part", () => {
    const mail = notificationEmailTemplate({
      kind: "action_required",
      firstName: "N",
      taxYear: 2025,
      message: '<script>alert("x")</script>',
    });

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});
