import { describe, it, expect } from "vitest";
import { db } from "../../src/db/client";
import { auditLog } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { writeAuditLog } from "../../src/lib/audit";

describe("writeAuditLog", () => {
  it("inserts a row with the given action and metadata", async () => {
    await writeAuditLog({
      action: "test_event",
      metadata: { foo: "bar" },
      ip: "127.0.0.1",
    });

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, "test_event"));

    expect(rows.length).toBeGreaterThanOrEqual(1);
    const row = rows[rows.length - 1];
    expect(row.metadata).toEqual({ foo: "bar" });
    expect(row.ip).toBe("127.0.0.1");
    expect(row.actorUserId).toBeNull();
  });
});
