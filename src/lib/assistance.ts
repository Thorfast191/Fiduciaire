import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assistanceSubscriptions, payments } from "@/db/schema";
import type { AssistanceSubscription, Payment } from "@/db/schema";
import { assistanceTotal, type AssistanceKey } from "@/lib/declaration";

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
