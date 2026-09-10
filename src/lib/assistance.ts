import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assistanceSubscriptions, payments, users } from "@/db/schema";
import type { AssistanceSubscription, Payment } from "@/db/schema";
import { assistanceTotal, type AssistanceKey } from "@/lib/declaration";
import { assignInvoiceNumber } from "@/lib/invoices";

export async function listSubscriptions(
  clientId: string,
): Promise<AssistanceSubscription[]> {
  return db
    .select()
    .from(assistanceSubscriptions)
    .where(eq(assistanceSubscriptions.clientId, clientId))
    .orderBy(desc(assistanceSubscriptions.taxYear));
}

export async function getSubscription(
  clientId: string,
  taxYear: number,
): Promise<AssistanceSubscription | undefined> {
  const [row] = await db
    .select()
    .from(assistanceSubscriptions)
    .where(
      and(
        eq(assistanceSubscriptions.clientId, clientId),
        eq(assistanceSubscriptions.taxYear, taxYear),
      ),
    );
  return row;
}

/**
 * Subscribes, or replaces an existing subscription for the same period.
 *
 * The à la carte panel is a selection, not a basket: choosing again for a year
 * the client already subscribed to means "these are the services I want now",
 * so the row is overwritten rather than duplicated.
 */
export async function saveSubscription(params: {
  clientId: string;
  taxYear: number;
  services: AssistanceKey[];
}): Promise<AssistanceSubscription> {
  const selection = Object.fromEntries(params.services.map((s) => [s, true]));
  const totalChf = assistanceTotal(selection);

  const [row] = await db
    .insert(assistanceSubscriptions)
    .values({
      clientId: params.clientId,
      taxYear: params.taxYear,
      services: params.services,
      totalChf,
    })
    .onConflictDoUpdate({
      target: [
        assistanceSubscriptions.clientId,
        assistanceSubscriptions.taxYear,
      ],
      set: { services: params.services, totalChf, updatedAt: new Date() },
    })
    .returning();

  return row;
}

export interface PaymentTotals {
  totalPaid: number;
  count: number;
  balanceDue: number;
  periods: number;
}

export async function listPayments(clientId: string): Promise<Payment[]> {
  return db
    .select()
    .from(payments)
    .where(eq(payments.clientId, clientId))
    .orderBy(desc(payments.paidAt));
}

/** The three figures above the payments table. */
export function paymentTotals(rows: Payment[]): PaymentTotals {
  const paid = rows.filter((r) => r.status === "paid");
  return {
    totalPaid: paid.reduce((sum, r) => sum + r.amountChf, 0),
    count: rows.length,
    balanceDue: rows
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + r.amountChf, 0),
    periods: new Set(rows.map((r) => r.taxYear)).size,
  };
}

export interface AdminPaymentRow extends Payment {
  firstName: string;
  lastName: string;
  email: string;
}

/** Every payment with its client, newest first, for the admin ledger. */
export async function listAllPayments(limit = 200): Promise<AdminPaymentRow[]> {
  return db
    .select({
      id: payments.id,
      clientId: payments.clientId,
      taxYear: payments.taxYear,
      label: payments.label,
      method: payments.method,
      amountChf: payments.amountChf,
      status: payments.status,
      dossierId: payments.dossierId,
      stripeSessionId: payments.stripeSessionId,
      stripePaymentIntentId: payments.stripePaymentIntentId,
      invoiceNumber: payments.invoiceNumber,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.clientId))
    .orderBy(desc(payments.paidAt))
    .limit(limit);
}

export async function recordPayment(params: {
  clientId: string;
  taxYear: number;
  label: string;
  method: Payment["method"];
  amountChf: number;
  status: Payment["status"];
}): Promise<Payment> {
  const [row] = await db.insert(payments).values(params).returning();
  if (row.status === "paid") await assignInvoiceNumber(row.id);
  return row;
}

export async function setPaymentStatus(
  id: string,
  status: Payment["status"],
): Promise<Payment | undefined> {
  const [row] = await db
    .update(payments)
    .set({ status, ...(status === "paid" ? { paidAt: new Date() } : {}) })
    .where(eq(payments.id, id))
    .returning();
  if (row?.status === "paid") await assignInvoiceNumber(row.id);
  return row;
}

export interface AdminSubscriptionRow extends AssistanceSubscription {
  firstName: string;
  lastName: string;
  email: string;
}

/** Every assistance subscription with its client, for the admin view. */
export async function listAllSubscriptions(
  limit = 200,
): Promise<AdminSubscriptionRow[]> {
  return db
    .select({
      id: assistanceSubscriptions.id,
      clientId: assistanceSubscriptions.clientId,
      taxYear: assistanceSubscriptions.taxYear,
      services: assistanceSubscriptions.services,
      totalChf: assistanceSubscriptions.totalChf,
      createdAt: assistanceSubscriptions.createdAt,
      updatedAt: assistanceSubscriptions.updatedAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(assistanceSubscriptions)
    .innerJoin(users, eq(users.id, assistanceSubscriptions.clientId))
    .orderBy(desc(assistanceSubscriptions.taxYear))
    .limit(limit);
}
