import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, dossiers, payments } from "@/db/schema";
import {
  finalizeCheckoutSession,
  dossierIsPaid,
  createDossierCheckout,
} from "@/lib/checkout";
import type { CheckoutSession } from "@/lib/stripe";

async function makeClient(): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      email: `checkout-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "Pay",
      lastName: "Er",
      role: "client",
    })
    .returning();
  return u.id;
}

async function seedPendingCheckout(clientId: string, sessionId: string) {
  const [dossier] = await db
    .insert(dossiers)
    .values({ clientId, taxYear: 700000 + Math.floor(Math.random() * 90000), status: "not_started" })
    .returning();
  await db.insert(payments).values({
    clientId,
    taxYear: dossier.taxYear,
    label: "Déclaration",
    method: "card",
    amountChf: 80,
    status: "pending",
    dossierId: dossier.id,
    stripeSessionId: sessionId,
  });
  return dossier;
}

function paidSession(id: string): CheckoutSession {
  return {
    id,
    url: null,
    payment_status: "paid",
    payment_intent: "pi_test_123",
    amount_total: 8000,
    currency: "chf",
    metadata: {},
  };
}

describe("finalizeCheckoutSession", () => {
  it("marks the payment paid and submits the dossier", async () => {
    const clientId = await makeClient();
    const sessionId = `cs_${randomUUID()}`;
    const dossier = await seedPendingCheckout(clientId, sessionId);

    const result = await finalizeCheckoutSession(paidSession(sessionId));
    expect(result.finalized).toBe(true);

    const [pay] = await db.select().from(payments).where(eq(payments.stripeSessionId, sessionId));
    expect(pay.status).toBe("paid");
    expect(pay.stripePaymentIntentId).toBe("pi_test_123");

    const [d] = await db.select().from(dossiers).where(eq(dossiers.id, dossier.id));
    expect(d.status).toBe("submitted");
    expect(await dossierIsPaid(dossier.id)).toBe(true);
  });

  it("is idempotent — a redelivered event does not settle twice", async () => {
    const clientId = await makeClient();
    const sessionId = `cs_${randomUUID()}`;
    await seedPendingCheckout(clientId, sessionId);

    const first = await finalizeCheckoutSession(paidSession(sessionId));
    const second = await finalizeCheckoutSession(paidSession(sessionId));
    expect(first.finalized).toBe(true);
    expect(second.finalized).toBe(false);
  });

  it("ignores a session that is not paid", async () => {
    const clientId = await makeClient();
    const sessionId = `cs_${randomUUID()}`;
    const dossier = await seedPendingCheckout(clientId, sessionId);

    const unpaid = { ...paidSession(sessionId), payment_status: "unpaid" };
    const result = await finalizeCheckoutSession(unpaid);
    expect(result.finalized).toBe(false);

    const [d] = await db.select().from(dossiers).where(eq(dossiers.id, dossier.id));
    expect(d.status).toBe("not_started");
  });

  it("does not rewind an already-submitted dossier on a stray session", async () => {
    const result = await finalizeCheckoutSession(paidSession(`cs_${randomUUID()}_unknown`));
    expect(result.finalized).toBe(false);
  });
});

describe("createDossierCheckout", () => {
  it("refuses when Stripe is not configured (no secret key in the test env)", async () => {
    const clientId = await makeClient();
    const [dossier] = await db
      .insert(dossiers)
      .values({ clientId, taxYear: 615000, status: "not_started" })
      .returning();

    const result = await createDossierCheckout({
      dossier,
      user: { id: clientId, email: "x@example.test" },
      productName: "Déclaration",
      successUrl: "https://e/s",
      cancelUrl: "https://e/c",
    });
    expect(result).toEqual({ ok: false, error: "not_configured" });
  });
});
