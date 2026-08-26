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
