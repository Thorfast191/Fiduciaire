import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { payments } from "@/db/schema";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getClientById } from "@/lib/adminUsers";
import { getT, getLocale } from "@/lib/i18n";
import { assignInvoiceNumber, renderInvoice } from "@/lib/invoices";

/**
 * Streams the PDF invoice for a settled payment.
 *
 * The client who made the payment, or any administrator, may download it. An
 * invoice exists only once the payment is paid; the number is assigned on first
 * download if it was not already set at settlement, so both online and
 * firm-recorded payments are covered.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const [payment] = await db.select().from(payments).where(eq(payments.id, id));

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!payment || (!isAdmin && payment.clientId !== user.id)) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  // No invoice for a payment that has not settled.
  if (payment.status !== "paid") {
    return NextResponse.json({ ok: false, error: "not_paid" }, { status: 409 });
  }

  const [invoiceNumber, client, { t }, locale] = await Promise.all([
    assignInvoiceNumber(payment.id),
    getClientById(payment.clientId),
    getT(),
    getLocale(),
  ]);

  if (!invoiceNumber || !client) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 500 });
  }

  const pdf = renderInvoice({ payment, invoiceNumber, client, locale, t });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="facture-${invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
