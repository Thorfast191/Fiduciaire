import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { invoiceCounters, payments, type Payment } from "@/db/schema";
import { BUSINESS, addressLine } from "@/lib/business";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { Locale } from "@/lib/i18n/config";
import { renderInvoicePdf, type InvoiceData } from "@/lib/pdf/invoice";

/**
 * Take the next invoice sequence for a calendar year and format it, e.g.
 * "FID-2026-0001". The counter row is created or bumped atomically, so two
 * concurrent settlements never receive the same number.
 */
async function allocateInvoiceNumber(year: number): Promise<string> {
  const [row] = await db
    .insert(invoiceCounters)
    .values({ year, lastSeq: 1 })
    .onConflictDoUpdate({
      target: invoiceCounters.year,
      set: { lastSeq: sql`${invoiceCounters.lastSeq} + 1` },
    })
    .returning({ lastSeq: invoiceCounters.lastSeq });
  return `FID-${year}-${String(row.lastSeq).padStart(4, "0")}`;
}

/**
 * Ensure a settled payment has an invoice number, assigning one on first call
 * and returning the existing one afterwards. Idempotent and race-safe: the
 * number is written only while the column is still null, so a loser in a race
 * re-reads the winner's number rather than overwriting it. Unpaid payments get
 * nothing.
 *
 * Called both when a payment settles and lazily when an invoice is first
 * downloaded, so every paid payment — online or firm-recorded — has a number.
 */
export async function assignInvoiceNumber(
  paymentId: string,
): Promise<string | null> {
  const [p] = await db
    .select({ status: payments.status, invoiceNumber: payments.invoiceNumber, paidAt: payments.paidAt })
    .from(payments)
    .where(eq(payments.id, paymentId));

  if (!p || p.status !== "paid") return null;
  if (p.invoiceNumber) return p.invoiceNumber;

  const year = (p.paidAt ?? new Date()).getFullYear();
  const number = await allocateInvoiceNumber(year);

  const [written] = await db
    .update(payments)
    .set({ invoiceNumber: number })
    .where(and(eq(payments.id, paymentId), isNull(payments.invoiceNumber)))
    .returning({ invoiceNumber: payments.invoiceNumber });

  if (written) return written.invoiceNumber;

  // Lost the race — the allocated number is skipped (an acceptable gap) and we
  // return whatever the winner assigned.
  const [again] = await db
    .select({ invoiceNumber: payments.invoiceNumber })
    .from(payments)
    .where(eq(payments.id, paymentId));
  return again?.invoiceNumber ?? null;
}

/** Assemble the localised invoice content for a settled payment. */
export function buildInvoiceData(params: {
  payment: Payment;
  invoiceNumber: string;
  client: { firstName: string; lastName: string; email: string };
  locale: Locale;
  t: Messages;
}): InvoiceData {
  const { payment, invoiceNumber, client, locale, t } = params;
  const inv = t.payments.invoice;

  const issueDate = new Intl.DateTimeFormat(
    locale === "fr" ? "fr-CH" : "en-GB",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  ).format(payment.paidAt ?? new Date());

  const methodLabel =
    t.payments.methods[payment.method as keyof typeof t.payments.methods] ??
    payment.method;

  const legalForm = BUSINESS.legalForm[locale === "fr" ? "fr" : "en"];

  return {
    invoiceNumber,
    issueDate,
    firm: {
      name: BUSINESS.name,
      legalForm,
      owner: BUSINESS.owner,
      addressLine: addressLine(),
      cityLine: `${BUSINESS.postalCode} ${BUSINESS.city}`,
      email: BUSINESS.email,
    },
    client: {
      name: `${client.firstName} ${client.lastName}`.trim(),
      email: client.email,
    },
    service: {
      label: payment.label,
      period: t.payments.period.replace("{year}", String(payment.taxYear)),
      amountChf: payment.amountChf,
    },
    method: methodLabel,
    labels: {
      invoice: inv.title,
      number: inv.number,
      date: inv.date,
      billedTo: inv.billedTo,
      description: inv.description,
      amount: inv.amount,
      total: inv.total,
      paidBy: inv.paidBy.replace("{method}", methodLabel),
      vatNote: inv.vatNote,
      thanks: inv.thanks,
    },
  };
}

/** Convenience: number + data + rendered PDF for a payment. */
export function renderInvoice(params: Parameters<typeof buildInvoiceData>[0]): Buffer {
  return renderInvoicePdf(buildInvoiceData(params));
}
