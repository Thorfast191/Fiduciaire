import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLog } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

export async function isLoginRateLimited(
  email: string,
  ip: string,
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.action, "login_failed"),
        eq(auditLog.ip, ip),
        sql`${auditLog.metadata} ->> 'email' = ${email}`,
        gte(auditLog.createdAt, since),
      ),
    );

  return Number(count) >= MAX_FAILURES;
}

export async function recordLoginFailure(
  email: string,
  ip: string,
): Promise<void> {
  await writeAuditLog({
    action: "login_failed",
    metadata: { email },
    ip,
  });
}

export async function recordLoginSuccess(
  userId: string,
  email: string,
  ip: string,
): Promise<void> {
  await writeAuditLog({
    actorUserId: userId,
    action: "login_succeeded",
    metadata: { email },
    ip,
  });
}

const OTP_WINDOW_MINUTES = 15;
const MAX_OTP_ISSUANCES = 5;

export async function isOtpIssuanceRateLimited(
  userId: string,
  purpose: string,
): Promise<boolean> {
  const since = new Date(Date.now() - OTP_WINDOW_MINUTES * 60 * 1000);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.action, "otp_issued"),
        eq(auditLog.actorUserId, userId),
        sql`${auditLog.metadata} ->> 'purpose' = ${purpose}`,
        gte(auditLog.createdAt, since),
      ),
    );

  return Number(count) >= MAX_OTP_ISSUANCES;
}

export async function recordOtpIssuance(
  userId: string,
  purpose: string,
): Promise<void> {
  await writeAuditLog({
    actorUserId: userId,
    action: "otp_issued",
    metadata: { purpose },
  });
}

export async function recordOtpFailure(
  userId: string,
  purpose: string,
): Promise<void> {
  await writeAuditLog({
    actorUserId: userId,
    action: "otp_failed",
    metadata: { purpose },
  });
}

const PUBLIC_CONTACT_WINDOW_MINUTES = 60;
const MAX_PUBLIC_CONTACT_MESSAGES = 5;

/**
 * Caps the anonymous marketing-site contact form per IP. The form emails a
 * fixed address (`CONTACT_EMAIL`) rather than anything the sender supplies, so
 * the worst case is noise in Fiduvia's own inbox — this keeps that bounded.
 */
export async function isPublicContactRateLimited(ip: string): Promise<boolean> {
  const since = new Date(
    Date.now() - PUBLIC_CONTACT_WINDOW_MINUTES * 60 * 1000,
  );

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.action, "public_contact_sent"),
        eq(auditLog.ip, ip),
        gte(auditLog.createdAt, since),
      ),
    );

  return Number(count) >= MAX_PUBLIC_CONTACT_MESSAGES;
}
