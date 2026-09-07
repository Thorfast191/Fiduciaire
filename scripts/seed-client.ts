import dotenv from "dotenv";

dotenv.config();

/** Seeds a pre-verified client account, so staging has a real portal user. */
async function main() {
  const { db } = await import("../src/db/client");
  const { users } = await import("../src/db/schema");
  const { hashPassword } = await import("../src/lib/auth/password");
  const { eq } = await import("drizzle-orm");

  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error("usage: tsx scripts/seed-client.ts <email> <password>");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, emailVerifiedAt: new Date(), termsAcceptedAt: new Date() })
      .where(eq(users.id, existing.id));
    console.log("Updated client", email);
  } else {
    await db.insert(users).values({
      email,
      passwordHash,
      firstName: "Camille",
      lastName: "Rochat",
      role: "client",
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
    });
    console.log("Created client", email);
  }
  process.exit(0);
}

main();
