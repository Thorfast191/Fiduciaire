import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/apiGuards";
import { recordPayment, setPaymentStatus } from "@/lib/assistance";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, readJsonBody } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

const createSchema = z.object({
  clientId: z.string().uuid(),
  taxYear: z.number().int().min(2000).max(2100),
  label: z.string().trim().min(1).max(200),
  method: z.enum(["bank_transfer", "card", "twint", "other"]),
  amountChf: z.number().int().min(0).max(1_000_000),
  status: z.enum(["paid", "pending"]),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["paid", "pending"]),
});

/** Records a payment the firm has received. */
export async function POST(request: NextRequest) {
  const e = apiErrors(request);
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const parsed = createSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const payment = await recordPayment(parsed.data);

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: "payment_recorded",
    targetType: "payment",
    targetId: payment.id,
    metadata: { amountChf: payment.amountChf, status: payment.status },
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true, payment });
}

/** Marks a payment settled or back to pending. */
export async function PATCH(request: NextRequest) {
  const e = apiErrors(request);
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const parsed = patchSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const payment = await setPaymentStatus(parsed.data.id, parsed.data.status);
  if (!payment) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: "payment_status_changed",
    targetType: "payment",
    targetId: payment.id,
    metadata: { status: payment.status },
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true, payment });
}
