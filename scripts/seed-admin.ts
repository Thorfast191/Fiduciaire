import dotenv from "dotenv";

dotenv.config();

async function main() {
  const { db } = await import("../src/db/client");
  const { users } = await import("../src/db/schema");
  const { hashPassword } = await import("../src/lib/auth/password");

  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error("Usage: tsx scripts/seed-admin.ts <email> <password>");
    process.exit(1);
  }
  await db.insert(users).values({
    email,
    passwordHash: await hashPassword(password),
    firstName: "Admin",
    lastName: "Fiduvia",
    role: "super_admin",
    emailVerifiedAt: new Date(),
  });
  console.log(`Created super_admin ${email}`);
  process.exit(0);
}

main();
