import { db } from "@/db/client";
import { auditLog } from "@/db/schema";

export interface AuditLogInput {
  actorUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  await db.insert(auditLog).values({
    actorUserId: entry.actorUserId ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    metadata: entry.metadata,
    ip: entry.ip,
  });
}
