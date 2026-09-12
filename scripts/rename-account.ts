import dotenv from "dotenv";

dotenv.config();

/**
 * Change an account's email address, keeping the same user row (and therefore
 * its role, dossiers and reservations).
 *
 *   tsx scripts/rename-account.ts <oldEmail> <newEmail>
 *
 * Pair it with `seed-admin.ts <newEmail> <password> <role>` afterwards to set
 * the password on the renamed account.
 */
async function main() {
  const { db } = await import("../src/db/client");
  const { users } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");

  const oldEmail = process.argv[2]?.toLowerCase();
  const newEmail = process.argv[3]?.toLowerCase();
  if (!oldEmail || !newEmail) {
    console.error("Usage: tsx scripts/rename-account.ts <oldEmail> <newEmail>");
    process.exit(1);
  }

  const rows = await db
    .update(users)
    .set({ email: newEmail, updatedAt: new Date() })
    .where(eq(users.email, oldEmail))
    .returning({ id: users.id });

  console.log(
    rows.length
      ? `Renamed ${oldEmail} -> ${newEmail}`
      : `No account found for ${oldEmail}`,
  );
  process.exit(0);
}

main();
