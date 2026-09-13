import dotenv from "dotenv";

dotenv.config();

/**
 * Print the SQL that creates or updates an administrator, with the password
 * already hashed.
 *
 *   tsx scripts/print-account-sql.ts <email> <password> <admin|super_admin> [firstName] [lastName]
 *
 * Why print instead of connect: production's Postgres is not published off the
 * compose network and the server carries no dev dependencies, so neither this
 * script nor `seed-admin.ts` can reach it. Argon2 hashing has to happen
 * somewhere with node_modules — here — and the result is piped into psql
 * inside the container, the same way the migrations were.
 *
 * The hash is salted, so re-running produces different SQL for the same
 * password. That is expected.
 */
async function main() {
  const [email, password, role, firstName, lastName] = process.argv.slice(2);

  if (!email || !password || !role) {
    console.error(
      "usage: tsx scripts/print-account-sql.ts <email> <password> <admin|super_admin> [firstName] [lastName]",
    );
    process.exit(1);
  }
  if (role !== "admin" && role !== "super_admin") {
    console.error(`role must be "admin" or "super_admin", got "${role}"`);
    process.exit(1);
  }

  const { hashPassword } = await import("../src/lib/auth/password");
  const { isStrongPassword } = await import("../src/lib/auth/passwordPolicy");

  if (!isStrongPassword(password)) {
    console.error(
      "password does not meet the policy the signup form enforces " +
        "(10+ characters, a digit and a symbol)",
    );
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const lit = (v: string) => `'${v.replace(/'/g, "''")}'`;

  // `email_verified_at` is set so the account can sign in without confirming;
  // the login still sends a one-time code, which is the real second factor.
  console.log(`-- ${role} ${email}`);
  console.log(`INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified_at)
VALUES (${lit(email.toLowerCase())}, ${lit(hash)}, ${lit(firstName ?? "Admin")}, ${lit(lastName ?? "Fiduvia")}, ${lit(role)}, now())
ON CONFLICT (email) DO UPDATE
   SET password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       email_verified_at = COALESCE(users.email_verified_at, now()),
       disabled_at = NULL;`);
  process.exit(0);
}

main();
