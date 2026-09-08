import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { payments, type Dossier } from "@/db/schema";
import {
  computePrice,
  normaliseAnswers,
  requiredDocuments,
} from "@/lib/declaration";
import { listDocumentsForDossier } from "@/lib/documents";
import { markDossierSubmitted } from "@/lib/dossiers";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
  stripeConfigured,
  type CheckoutSession,
} from "@/lib/stripe";

export type CheckoutResult =
  | { ok: true; url: string }
  | {
      ok: false;
      error:
        | "not_configured"
        | "not_payable"
        | "already_submitted"
        | "already_paid"
        | "documents_incomplete"
        | "invalid_amount";
    };

/** Is there already a settled online payment for this dossier? */
export async function dossierIsPaid(dossierId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.dossierId, dossierId),
        eq(payments.status, "paid"),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * Opens a Stripe Checkout session for a client to pay for, and thereby submit,
 * their declaration. The price is computed here from the stored answers — never
 * taken from the client — and the required documents must all be present, so
 * the pay-and-submit step cannot be reached with an incomplete file.
 */
export async function createDossierCheckout(params: {
  dossier: Dossier;
  user: { id: string; email: string };
  productName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  const { dossier, user } = params;

  if (!stripeConfigured()) return { ok: false, error: "not_configured" };
  // Only declarations carry a computed, self-service price; other prestations
  // are priced by the firm and settled separately.
  if (dossier.serviceType !== "declaration")
    return { ok: false, error: "not_payable" };
  if (dossier.status !== "not_started")
    return { ok: false, error: "already_submitted" };
  if (await dossierIsPaid(dossier.id))
    return { ok: false, error: "already_paid" };

  const answers = normaliseAnswers(dossier.answers);

  const required = requiredDocuments(answers);
  const uploaded = new Set<string>(
    (await listDocumentsForDossier(dossier.id)).map((d) => d.category),
  );
  if (!required.every((key) => uploaded.has(key)))
    return { ok: false, error: "documents_incomplete" };

  const amountChf = computePrice(answers).total;
  if (!Number.isFinite(amountChf) || amountChf <= 0)
    return { ok: false, error: "invalid_amount" };

  const session = await createCheckoutSession({
    amountChf,
    productName: params.productName,
    customerEmail: user.email,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    clientReferenceId: dossier.id,
    metadata: {
      dossierId: dossier.id,
      clientId: user.id,
      taxYear: String(dossier.taxYear),
    },
    idempotencyKey: `checkout_${dossier.id}_${dossier.updatedAt.getTime()}`,
  });

  await db.insert(payments).values({
    clientId: user.id,
    taxYear: dossier.taxYear,
    label: params.productName,
    method: "card",
    amountChf,
    status: "pending",
    dossierId: dossier.id,
    stripeSessionId: session.id,
  });

  return { ok: true, url: session.url };
}

/**
 * Settles a paid Checkout session: flips its pending payment to paid and submits
 * the dossier. Idempotent and safe under a race between the webhook and the
 * success-page confirmation — the pending→paid flip is a conditional update, so
 * exactly one caller wins and only that caller submits.
 */
export async function finalizeCheckoutSession(
  session: CheckoutSession,
): Promise<{ finalized: boolean }> {
  if (session.payment_status !== "paid") return { finalized: false };

  const updated = await db
    .update(payments)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: session.payment_intent,
    })
    .where(
      and(
        eq(payments.stripeSessionId, session.id),
        eq(payments.status, "pending"),
      ),
    )
    .returning({ dossierId: payments.dossierId });

  const dossierId = updated[0]?.dossierId;
  if (!dossierId) return { finalized: false };

  await markDossierSubmitted(dossierId);
  return { finalized: true };
}

/** Retrieves the session from Stripe, then finalizes it (redirect fallback). */
export async function confirmCheckoutById(
  sessionId: string,
): Promise<{ finalized: boolean; dossierId?: string }> {
  const session = await retrieveCheckoutSession(sessionId);
  const dossierId = session.metadata?.dossierId;
  const { finalized } = await finalizeCheckoutSession(session);
  return { finalized, dossierId };
}
