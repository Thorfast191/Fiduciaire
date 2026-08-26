import crypto from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { otpCodes, type OtpPurpose } from "@/db/schema";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type ConsumeOtpResult =
  | { ok: true }
  | { ok: false; reason: "invalid_or_expired" | "too_many_attempts" };

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Short TTL + single-use + attempt cap make a plain SHA-256 digest
// sufficient here; argon2 would add cost for no real benefit at this
// entropy and lifetime.
function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function createOtp(
  userId: string,
  purpose: OtpPurpose,
): Promise<string> {
  const code = generateCode();
  await db.insert(otpCodes).values({
    userId,
    purpose,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  return code;
}

export async function consumeOtp(
  userId: string,
  purpose: OtpPurpose,
  code: string,
): Promise<ConsumeOtpResult> {
  const [row] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, userId),
        eq(otpCodes.purpose, purpose),
        isNull(otpCodes.consumedAt),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "invalid_or_expired" };
  }

  if (row.attemptCount >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (hashCode(code) !== row.codeHash) {
    await db
      .update(otpCodes)
      .set({ attemptCount: row.attemptCount + 1 })
      .where(eq(otpCodes.id, row.id));
    const nextAttempt = row.attemptCount + 1;
    return {
      ok: false,
      reason: nextAttempt >= MAX_ATTEMPTS ? "too_many_attempts" : "invalid_or_expired",
    };
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, row.id));

  return { ok: true };
}
