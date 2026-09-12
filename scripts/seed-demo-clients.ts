import dotenv from "dotenv";

dotenv.config();

/**
 * Fill an empty admin space with the reference demo's clients and dossiers.
 *
 *   tsx scripts/seed-demo-clients.ts [taxYear] [password]
 *
 * Creates (or refreshes) the four clients fiduvia.ch shows — Camille Rochat,
 * Marco Bianchi, Luca Moret, Sophie Favre — each with one declaration for the
 * given period, carrying the status, canton, express flag and reception date
 * the reference shows them with. Where an administrator of that name exists,
 * the dossier is reserved for them, so "Réservé par" is populated too.
 *
 * Re-running is safe: accounts are matched on email and dossiers on the
 * (client, year, prestation) key, so nothing is duplicated.
 *
 * Demonstration data. Never run this against production.
 */
async function main() {
  const { db } = await import("../src/db/client");
  const { users, dossiers } = await import("../src/db/schema");
  const { hashPassword } = await import("../src/lib/auth/password");
  const { eq, and } = await import("drizzle-orm");

  const taxYear = Number(process.argv[2]) || new Date().getFullYear() - 1;
  const password = process.argv[3] || "a-long-enough-p4ssword!";

  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) {
    console.error(`Not a usable tax year: ${process.argv[2]}`);
    process.exit(1);
  }

  const DEMO = [
    {
      firstName: "Camille",
      lastName: "Rochat",
      email: "camille.rochat@exemple.ch",
      phone: "+41 79 123 45 67",
      street: "Rue du Lac 12",
      postalCode: "1003",
      city: "Lausanne",
      status: "completed" as const,
      canton: "Vaud",
      cantonCode: "VD",
      express: false,
      etatCivil: "marie",
      receivedOn: `${taxYear + 1}-05-14`,
      reserveFor: "Veasna",
    },
    {
      firstName: "Marco",
      lastName: "Bianchi",
      email: "m.bianchi@exemple.ch",
      phone: "+41 78 456 12 34",
      street: "Rue de Conthey 8",
      postalCode: "1950",
      city: "Sion",
      status: "documents_requested" as const,
      canton: "Valais",
      cantonCode: "VS",
      express: true,
      etatCivil: "celibataire",
      receivedOn: `${taxYear + 1}-03-04`,
      reserveFor: "Jeremy",
    },
    {
      firstName: "Luca",
      lastName: "Moret",
      email: "luca.moret@exemple.ch",
      phone: "+41 79 987 65 43",
      street: "Avenue de la Gare 3",
      postalCode: "1920",
      city: "Martigny",
      status: "reclamation" as const,
      canton: "Valais",
      cantonCode: "VS",
      express: false,
      etatCivil: "celibataire",
      receivedOn: `${taxYear + 1}-02-16`,
      reserveFor: "Veasna",
    },
    {
      firstName: "Sophie",
      lastName: "Favre",
      email: "sophie.favre@exemple.ch",
      phone: "+41 76 222 33 44",
      street: "Chemin des Vignes 5",
      postalCode: "1006",
      city: "Lausanne",
      status: "documents_received" as const,
      canton: "Vaud",
      cantonCode: "VD",
      express: false,
      etatCivil: "celibataire",
      receivedOn: `${taxYear + 1}-05-21`,
      reserveFor: "Veasna",
    },
  ];

  // Active administrators, so "Réservé par" can be filled by first name.
  const admins = await db
    .select({ id: users.id, firstName: users.firstName, role: users.role })
    .from(users);
  // Accent-insensitive, so "Jérémy" in the database matches "Jeremy" here.
  const fold = (name: string) =>
    name
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  const adminByFirstName = new Map(
    admins
      .filter((a) => a.role === "admin" || a.role === "super_admin")
      .map((a) => [fold(a.firstName), a.id]),
  );

  const passwordHash = await hashPassword(password);

  for (const d of DEMO) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, d.email));

    let clientId: string;
    if (existing) {
      await db
        .update(users)
        .set({
          firstName: d.firstName,
          lastName: d.lastName,
          phone: d.phone,
          street: d.street,
          postalCode: d.postalCode,
          city: d.city,
          role: "client",
          disabledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
      clientId = existing.id;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          email: d.email,
          passwordHash,
          firstName: d.firstName,
          lastName: d.lastName,
          phone: d.phone,
          street: d.street,
          postalCode: d.postalCode,
          city: d.city,
          role: "client",
          emailVerifiedAt: new Date(),
          termsAcceptedAt: new Date(),
        })
        .returning({ id: users.id });
      clientId = created.id;
    }

    const answers = {
      canton: d.cantonCode,
      express: d.express,
      etatCivil: d.etatCivil,
      situation: "standard",
      revenus: { salarie: true },
      children: [],
      immeubles: [],
      comments: {},
      assistance: {},
      fortuneTypes: {},
      proprietaireImmeuble: "non",
    };
    const receivedAt = new Date(`${d.receivedOn}T09:00:00Z`);
    const reservedBy = adminByFirstName.get(fold(d.reserveFor)) ?? null;

    const [row] = await db
      .select({ id: dossiers.id })
      .from(dossiers)
      .where(
        and(
          eq(dossiers.clientId, clientId),
          eq(dossiers.taxYear, taxYear),
          eq(dossiers.serviceType, "declaration"),
        ),
      );

    if (row) {
      await db
        .update(dossiers)
        .set({
          status: d.status,
          answers,
          currentStep: 6,
          reservedBy,
          reservedAt: reservedBy ? receivedAt : null,
          createdAt: receivedAt,
          updatedAt: new Date(),
        })
        .where(eq(dossiers.id, row.id));
    } else {
      await db.insert(dossiers).values({
        clientId,
        taxYear,
        serviceType: "declaration",
        status: d.status,
        answers,
        currentStep: 6,
        reservedBy,
        reservedAt: reservedBy ? receivedAt : null,
        createdAt: receivedAt,
      });
    }

    console.log(
      `${d.firstName} ${d.lastName} — ${d.status}, ${d.cantonCode}` +
        (reservedBy ? `, réservé par ${d.reserveFor}` : ", non attribué"),
    );
  }

  console.log(`\n${DEMO.length} clients and declarations ready for ${taxYear}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
