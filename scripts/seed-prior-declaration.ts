import dotenv from "dotenv";
dotenv.config();

/**
 * Dev helper: give a client a completed prior-year declaration so the
 * "Vous avez déposé une déclaration en {year}" / "Reprendre ces éléments"
 * box appears on their current declaration. Usage:
 *   npx tsx scripts/seed-prior-declaration.ts <email> [year]
 */
async function main() {
  const { db } = await import("../src/db/client");
  const { users, dossiers, taxPeriods } = await import("../src/db/schema");
  const { emptyAnswers } = await import("../src/lib/declaration");
  const { eq } = await import("drizzle-orm");

  const email = process.argv[2];
  const year = Number(process.argv[3] ?? 2024);
  if (!email) {
    console.error("usage: tsx scripts/seed-prior-declaration.ts <email> [year]");
    process.exit(1);
  }

  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u) {
    console.error("No such user:", email);
    process.exit(1);
  }

  await db
    .insert(taxPeriods)
    .values({ year, isActive: false })
    .onConflictDoNothing();

  const answers = {
    ...emptyAnswers(),
    canton: "Vaud",
    etatCivil: "marie" as const,
    children: [
      {
        firstName: "Léa",
        lastName: u.lastName || "Rochat",
        birthDate: "2016-04-12",
        avs: "",
        situation: "etudiant",
        contributions: "oui" as const,
        menageCommun: "oui" as const,
        menageAutreParent: "oui" as const,
      },
    ],
    revenus: { salarie: true },
    fortuneTypes: { epargne: true },
    loyersPayes: "oui" as const,
    pilier3: true,
  };

  await db
    .insert(dossiers)
    .values({
      clientId: u.id,
      taxYear: year,
      serviceType: "declaration",
      status: "completed",
      answers,
    })
    .onConflictDoNothing();

  console.log(`Seeded a completed ${year} declaration for ${email}`);
  process.exit(0);
}

main();
