import dotenv from "dotenv";

dotenv.config();

/**
 * Create or fix an administrator account.
 *
 *   tsx scripts/seed-admin.ts <email> <password> [admin|super_admin] [firstName] [lastName]
 *
 * Defaults to `super_admin` (the bootstrap account). Pass `admin` for an
 * ordinary administrator. If the email already exists (e.g. someone signed up
 * as a client), their role and password are updated in place — this is how you
 * turn an existing account into an admin, or reset an admin's password. An
 * existing account keeps its name unless you pass one on a fresh insert.
 */
async function main() {
  const { db } = await import("../src/db/client");
  const { users } = await import("../src/db/schema");
  const { hashPassword } = await import("../src/lib/auth/password");

  const email = process.argv[2]?.toLowerCase();
  const password = process.argv[3];
  const role = process.argv[4] === "admin" ? "admin" : "super_admin";
  const firstName = process.argv[5] || "Admin";
  const lastName = process.argv[6] || "Fiduvia";

  if (!email || !password) {
    console.error(
      "Usage: tsx scripts/seed-admin.ts <email> <password> [admin|super_admin] [firstName] [lastName]",
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  await db
    .insert(users)
    .values({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      // Promote/reset an existing account, but leave their name intact.
      set: {
        passwordHash,
        role,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  console.log(`Upserted ${role} ${email}`);
  process.exit(0);
}

main();
