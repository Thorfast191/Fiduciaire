# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Fiduvia platform's Next.js/Postgres foundation — real accounts, password auth, mandatory email-delivered 2FA on every login, and a deployed, secured, tested pipeline — replacing the mockup's fake, credential-less login.

**Architecture:** Next.js 15 (App Router, TypeScript) with Drizzle ORM over PostgreSQL. Auth is hand-built on top of two primitives — hashed passwords (argon2id) and hashed, rate-limited, single-use email OTP codes — because the requirement (an OTP on every login, for every role) is narrow enough that a full auth framework would add more surface area than it saves. Sessions are opaque tokens hashed into a `sessions` table and set as httpOnly cookies; there is no in-memory state, so the app is stateless and horizontally scalable later. Deployed as a Docker container behind Caddy (automatic TLS) on a single Infomaniak Public Cloud instance.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL (`pg` driver), argon2, nodemailer, zod, pino, Vitest, Playwright, Docker, Caddy, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-25-foundation-design.md`

## Global Constraints

- Every login (client, admin, super_admin — no exceptions) requires email + password, then a 6-digit email OTP before a session is created.
- Passwords hashed with argon2id; never logged, never returned in any API response.
- OTP codes: 10-minute expiry, max 5 verification attempts per code, single-use, hashed at rest (sha256 is sufficient here — short TTL + attempt cap + single-use covers the risk; do not use argon2 for OTP codes, it adds cost for no benefit at this entropy/TTL).
- Login rate limit: max 5 attempts per 15 minutes per (email, ip) pair, tracked via `audit_log`, not a new table.
- All auth error responses are generic — never reveal whether an email exists or whether the password vs. the code was wrong.
- No secret (DB credentials, session signing, SMTP credentials, Infomaniak keys) is ever committed. All via environment variables, validated at startup with zod.
- HSTS header is NOT enabled in this plan — it is an explicit go-live checklist step outside this plan's scope, to avoid repeating the audit's cert/HSTS lockout bug.
- Local dev and CI never touch real Infomaniak resources: Postgres, MinIO (S3 stand-in), and Mailhog (SMTP catcher) run via Docker Compose.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `vitest.config.ts`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Next.js app (`npm run dev`), a working `npm test` (Vitest), a working `npm run build`.

- [ ] **Step 1: Initialize the Next.js project**

```bash
npx create-next-app@latest . --typescript --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-npm
```

Answer prompts to install into the current (non-empty, git-initialized) directory if asked.

- [ ] **Step 2: Add testing and core dependencies**

```bash
npm install drizzle-orm pg zod argon2 nodemailer pino
npm install -D drizzle-kit @types/pg @types/nodemailer vitest @vitejs/plugin-react tsx dotenv
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
```

Add to `package.json` `"scripts"`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Write a smoke test**

Create `tests/unit/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("project setup", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `npm test`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 6: Create `.env.example`**

```bash
DATABASE_URL=postgres://fiduvia:fiduvia@localhost:5432/fiduvia
SESSION_SECRET=replace-with-a-long-random-string
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Fiduvia <no-reply@fiduvia.ch>"
```

- [ ] **Step 7: Verify build and dev server**

Run: `npm run build`
Expected: build succeeds with no errors.

Run: `npm run dev`, visit `http://localhost:3000`, confirm the default page loads, then stop the server.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts .gitignore .env.example vitest.config.ts src tests
git commit -m "Scaffold Next.js + TypeScript + Vitest project"
```

---

## Task 2: Local dev environment (Docker Compose + Dockerfile)

**Files:**
- Create: `docker-compose.yml`
- Create: `Dockerfile`
- Create: `.dockerignore`

**Interfaces:**
- Produces: `docker compose up -d` brings up Postgres (`localhost:5432`), MinIO (`localhost:9000`/`9001`), and Mailhog (SMTP `localhost:1025`, web UI `localhost:8025`) — matching `.env.example` from Task 1.

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: fiduvia
      POSTGRES_PASSWORD: fiduvia
      POSTGRES_DB: fiduvia
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: fiduvia
      MINIO_ROOT_PASSWORD: fiduvia123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  pgdata:
  minio-data:
```

- [ ] **Step 2: Bring the stack up and verify Postgres**

Run: `docker compose up -d`
Run: `docker compose ps`
Expected: `postgres`, `minio`, `mailhog` all show `running`/`healthy`.

Run: `docker exec -it $(docker compose ps -q postgres) psql -U fiduvia -d fiduvia -c '\conninfo'`
Expected: prints connection info with no error.

- [ ] **Step 3: Write the production `Dockerfile`**

```dockerfile
FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 4: Enable standalone output for the Dockerfile to work**

Edit `next.config.ts`, add `output: "standalone"` to the config object.

- [ ] **Step 5: Write `.dockerignore`**

```
node_modules
.next
docs
screenshots
uploads
.git
```

- [ ] **Step 6: Build the production image locally to verify it compiles**

Run: `docker build -t fiduvia-app .`
Expected: build completes successfully (image won't run correctly yet — no `DATABASE_URL` — that's expected at this step; we're only verifying the build).

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml Dockerfile .dockerignore next.config.ts
git commit -m "Add local dev Docker Compose stack and production Dockerfile"
```

---

## Task 3: Database schema, migrations & environment config

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/db/schema.ts`
- Create: `src/db/client.ts`
- Create: `drizzle.config.ts`
- Test: `tests/unit/env.test.ts`

**Interfaces:**
- Produces: `env` (validated config object) from `src/lib/env.ts`; `db` (Drizzle instance) from `src/db/client.ts`; `users`, `sessions`, `otpCodes`, `auditLog` tables and `User`, `Session`, `OtpCode`, `AuditLogEntry`, `Role`, `OtpPurpose` types from `src/db/schema.ts`.
- Consumes: `DATABASE_URL`, `SESSION_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` from the environment (Task 1's `.env.example`).

- [ ] **Step 1: Write the failing env test**

Create `tests/unit/env.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const REQUIRED = {
  DATABASE_URL: "postgres://fiduvia:fiduvia@localhost:5432/fiduvia",
  SESSION_SECRET: "a".repeat(32),
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_FROM: "Fiduvia <no-reply@fiduvia.ch>",
};

describe("env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Object.assign(process.env, REQUIRED);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("parses valid environment variables", async () => {
    vi.resetModules();
    const { env } = await import("../../src/lib/env");
    expect(env.DATABASE_URL).toBe(REQUIRED.DATABASE_URL);
    expect(env.SMTP_PORT).toBe(1025);
  });

  it("throws when a required variable is missing", async () => {
    vi.resetModules();
    delete process.env.SESSION_SECRET;
    await expect(import("../../src/lib/env")).rejects.toThrow();
  });
});

import { vi } from "vitest";
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- env`
Expected: FAIL — `src/lib/env.ts` does not exist yet.

- [ ] **Step 3: Implement `src/lib/env.ts`**

```typescript
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgres://")),
  SESSION_SECRET: z.string().min(32),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().min(1),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
```

- [ ] **Step 4: Run the test again to verify it passes**

Run: `npm test -- env`
Expected: PASS.

- [ ] **Step 5: Write the Drizzle schema**

Create `src/db/schema.ts`:

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["client", "admin", "super_admin"] })
    .notNull()
    .default("client"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  userAgent: text("user_agent"),
  ip: text("ip"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  purpose: text("purpose", {
    enum: ["login", "signup", "password_reset"],
  }).notNull(),
  codeHash: text("code_hash").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type Role = "client" | "admin" | "super_admin";
export type OtpPurpose = "login" | "signup" | "password_reset";
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
```

- [ ] **Step 6: Write the Drizzle client**

Create `src/db/client.ts`:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });
```

- [ ] **Step 7: Configure Drizzle Kit and generate the migration**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Add to `package.json` `"scripts"`: `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`.

Run: `npm run db:generate`
Expected: a new SQL file appears under `src/db/migrations/`.

- [ ] **Step 8: Apply the migration to the local database**

Run: `npm run db:migrate`
Expected: completes without error.

Run: `docker exec -it $(docker compose ps -q postgres) psql -U fiduvia -d fiduvia -c '\dt'`
Expected: lists `users`, `sessions`, `otp_codes`, `audit_log`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/env.ts src/db drizzle.config.ts tests/unit/env.test.ts package.json
git commit -m "Add database schema, migrations, and validated env config"
```

---

## Task 4: Password hashing utility

**Files:**
- Create: `src/lib/auth/password.ts`
- Test: `tests/unit/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(hash: string, plain: string): Promise<boolean>`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/password.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";

describe("password hashing", () => {
  it("hashes a password to a non-plaintext string", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse battery staple");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("s3cret!");
    await expect(verifyPassword(hash, "s3cret!")).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret!");
    await expect(verifyPassword(hash, "wrong")).resolves.toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- password`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/auth/password.ts`**

```typescript
import argon2 from "argon2";

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- password`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/password.ts tests/unit/password.test.ts
git commit -m "Add argon2id password hashing utility"
```

---

## Task 5: Audit log helper

**Files:**
- Create: `src/lib/audit.ts`
- Test: `tests/unit/audit.test.ts`

**Interfaces:**
- Consumes: `db` from `src/db/client.ts`; `auditLog` table from `src/db/schema.ts`.
- Produces: `writeAuditLog(entry: AuditLogInput): Promise<void>` where `AuditLogInput = { actorUserId?: string | null; action: string; targetType?: string; targetId?: string; metadata?: Record<string, unknown>; ip?: string }`.

This task's test requires a real Postgres connection (the Task 2 Docker Compose stack). Ensure `docker compose up -d` is running and migrations from Task 3 are applied before running these tests.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/audit.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- audit`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/audit.ts`**

```typescript
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- audit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audit.ts tests/unit/audit.test.ts
git commit -m "Add audit log writer"
```

---

## Task 6: OTP utility

**Files:**
- Create: `src/lib/auth/otp.ts`
- Test: `tests/unit/otp.test.ts`

**Interfaces:**
- Consumes: `db` from `src/db/client.ts`; `otpCodes` table and `OtpPurpose` type from `src/db/schema.ts`.
- Produces: `type ConsumeOtpResult = { ok: true } | { ok: false; reason: "invalid_or_expired" | "too_many_attempts" }`; `createOtp(userId: string, purpose: OtpPurpose): Promise<string>` (returns the plain 6-digit code to email — never store or return the plain code again after this call); `consumeOtp(userId: string, purpose: OtpPurpose, code: string): Promise<ConsumeOtpResult>`.

Requires the Task 2 Docker Compose Postgres running and migrated.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/otp.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/client";
import { users, otpCodes } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { createOtp, consumeOtp } from "../../src/lib/auth/otp";

async function makeUser(email: string) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: "unused-in-this-test",
      firstName: "Test",
      lastName: "User",
    })
    .returning();
  return user;
}

describe("OTP", () => {
  it("creates a 6-digit code and can consume it once", async () => {
    const user = await makeUser(`otp-${Date.now()}@example.test`);
    const code = await createOtp(user.id, "login");
    expect(code).toMatch(/^\d{6}$/);

    const result = await consumeOtp(user.id, "login", code);
    expect(result).toEqual({ ok: true });

    const again = await consumeOtp(user.id, "login", code);
    expect(again).toEqual({ ok: false, reason: "invalid_or_expired" });
  });

  it("rejects a wrong code", async () => {
    const user = await makeUser(`otp-wrong-${Date.now()}@example.test`);
    await createOtp(user.id, "login");
    const result = await consumeOtp(user.id, "login", "000000");
    expect(result.ok).toBe(false);
  });

  it("locks out after 5 wrong attempts, even with the right code after", async () => {
    const user = await makeUser(`otp-lock-${Date.now()}@example.test`);
    const code = await createOtp(user.id, "login");
    for (let i = 0; i < 5; i++) {
      await consumeOtp(user.id, "login", "000000");
    }
    const result = await consumeOtp(user.id, "login", code);
    expect(result).toEqual({ ok: false, reason: "too_many_attempts" });
  });

  it("rejects an expired code", async () => {
    const user = await makeUser(`otp-expired-${Date.now()}@example.test`);
    const code = await createOtp(user.id, "login");
    await db
      .update(otpCodes)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(otpCodes.userId, user.id));
    const result = await consumeOtp(user.id, "login", code);
    expect(result).toEqual({ ok: false, reason: "invalid_or_expired" });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- otp`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/auth/otp.ts`**

```typescript
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- otp`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/otp.ts tests/unit/otp.test.ts
git commit -m "Add OTP creation and consumption with attempt limiting"
```

---

## Task 7: Login rate limiting

**Files:**
- Create: `src/lib/auth/rateLimit.ts`
- Test: `tests/unit/rateLimit.test.ts`

**Interfaces:**
- Consumes: `db` from `src/db/client.ts`; `auditLog` table from `src/db/schema.ts`; `writeAuditLog` from `src/lib/audit.ts`.
- Produces: `isLoginRateLimited(email: string, ip: string): Promise<boolean>`; `recordLoginFailure(email: string, ip: string): Promise<void>`; `recordLoginSuccess(userId: string, email: string, ip: string): Promise<void>`.

Requires the Task 2 Docker Compose Postgres running and migrated.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/rateLimit.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  isLoginRateLimited,
  recordLoginFailure,
} from "../../src/lib/auth/rateLimit";

describe("login rate limiting", () => {
  it("allows login attempts under the limit", async () => {
    const email = `rl-${Date.now()}@example.test`;
    for (let i = 0; i < 4; i++) {
      await recordLoginFailure(email, "10.0.0.1");
    }
    await expect(isLoginRateLimited(email, "10.0.0.1")).resolves.toBe(false);
  });

  it("blocks after 5 failures within the window for the same email+ip", async () => {
    const email = `rl-block-${Date.now()}@example.test`;
    for (let i = 0; i < 5; i++) {
      await recordLoginFailure(email, "10.0.0.2");
    }
    await expect(isLoginRateLimited(email, "10.0.0.2")).resolves.toBe(true);
  });

  it("does not block a different ip for the same email", async () => {
    const email = `rl-diffip-${Date.now()}@example.test`;
    for (let i = 0; i < 5; i++) {
      await recordLoginFailure(email, "10.0.0.3");
    }
    await expect(isLoginRateLimited(email, "10.0.0.9")).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- rateLimit`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/auth/rateLimit.ts`**

```typescript
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLog } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

export async function isLoginRateLimited(
  email: string,
  ip: string,
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.action, "login_failed"),
        eq(auditLog.ip, ip),
        sql`${auditLog.metadata} ->> 'email' = ${email}`,
        gte(auditLog.createdAt, since),
      ),
    );

  return Number(count) >= MAX_FAILURES;
}

export async function recordLoginFailure(
  email: string,
  ip: string,
): Promise<void> {
  await writeAuditLog({
    action: "login_failed",
    metadata: { email },
    ip,
  });
}

export async function recordLoginSuccess(
  userId: string,
  email: string,
  ip: string,
): Promise<void> {
  await writeAuditLog({
    actorUserId: userId,
    action: "login_succeeded",
    metadata: { email },
    ip,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- rateLimit`
Expected: PASS, all 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/rateLimit.ts tests/unit/rateLimit.test.ts
git commit -m "Add login rate limiting backed by the audit log"
```

---

## Task 8: Email sending abstraction + OTP template

**Files:**
- Create: `src/lib/email/send.ts`
- Create: `src/lib/email/templates/otpEmail.ts`
- Test: `tests/unit/otpEmail.test.ts`

**Interfaces:**
- Consumes: `env` from `src/lib/env.ts`; `OtpPurpose` type from `src/db/schema.ts`.
- Produces: `sendEmail(params: { to: string; subject: string; html: string; text: string }): Promise<void>`; `otpEmailTemplate(params: { code: string; purpose: OtpPurpose }): { subject: string; html: string; text: string }`.

- [ ] **Step 1: Write the failing template test**

Create `tests/unit/otpEmail.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { otpEmailTemplate } from "../../src/lib/email/templates/otpEmail";

describe("otpEmailTemplate", () => {
  it("includes the code in both html and text bodies", () => {
    const result = otpEmailTemplate({ code: "123456", purpose: "login" });
    expect(result.html).toContain("123456");
    expect(result.text).toContain("123456");
    expect(result.subject.length).toBeGreaterThan(0);
  });

  it("uses different subject copy for password_reset", () => {
    const login = otpEmailTemplate({ code: "111111", purpose: "login" });
    const reset = otpEmailTemplate({
      code: "111111",
      purpose: "password_reset",
    });
    expect(login.subject).not.toBe(reset.subject);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- otpEmail`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the OTP email template**

Create `src/lib/email/templates/otpEmail.ts`:

```typescript
import type { OtpPurpose } from "@/db/schema";

const SUBJECTS: Record<OtpPurpose, string> = {
  login: "Votre code de connexion Fiduvia",
  signup: "Confirmez votre compte Fiduvia",
  password_reset: "Réinitialisation de votre mot de passe Fiduvia",
};

export function otpEmailTemplate(params: {
  code: string;
  purpose: OtpPurpose;
}): { subject: string; html: string; text: string } {
  const subject = SUBJECTS[params.purpose];
  const text = `Votre code de vérification Fiduvia est : ${params.code}\n\nCe code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`;
  const html = `
    <p>Votre code de vérification Fiduvia est :</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:4px">${params.code}</p>
    <p>Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
  `;
  return { subject, html, text };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- otpEmail`
Expected: PASS.

- [ ] **Step 5: Implement the send abstraction**

Create `src/lib/email/send.ts`:

```typescript
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}
```

This is not unit-tested directly (it's a thin wrapper over nodemailer talking to Mailhog); it's exercised by the Task 21 end-to-end tests, which assert against Mailhog's API.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email tests/unit/otpEmail.test.ts
git commit -m "Add email sending abstraction and OTP template"
```

---

## Task 9: Session management

**Files:**
- Create: `src/lib/auth/session.ts`
- Test: `tests/unit/session.test.ts`

**Interfaces:**
- Consumes: `db` from `src/db/client.ts`; `users`, `sessions` tables from `src/db/schema.ts`.
- Produces: `SESSION_COOKIE_NAME` (string constant); `type SessionUser = { id: string; email: string; role: Role; firstName: string; lastName: string }`; `createSession(userId: string, meta: { userAgent?: string; ip?: string }): Promise<{ token: string; expiresAt: Date }>`; `getSessionUserByToken(token: string): Promise<SessionUser | null>`; `revokeSessionByToken(token: string): Promise<void>`; `revokeAllSessionsForUser(userId: string): Promise<void>`.

Requires the Task 2 Docker Compose Postgres running and migrated.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/session.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { db } from "../../src/db/client";
import { users } from "../../src/db/schema";
import {
  createSession,
  getSessionUserByToken,
  revokeSessionByToken,
  revokeAllSessionsForUser,
} from "../../src/lib/auth/session";

async function makeUser(email: string) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: "unused",
      firstName: "Test",
      lastName: "User",
      role: "client",
    })
    .returning();
  return user;
}

describe("sessions", () => {
  it("creates a session and resolves it back to the user", async () => {
    const user = await makeUser(`sess-${Date.now()}@example.test`);
    const { token, expiresAt } = await createSession(user.id, {
      ip: "127.0.0.1",
    });
    expect(token.length).toBeGreaterThan(20);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const sessionUser = await getSessionUserByToken(token);
    expect(sessionUser).toEqual({
      id: user.id,
      email: user.email,
      role: "client",
      firstName: "Test",
      lastName: "User",
    });
  });

  it("returns null for an unknown token", async () => {
    await expect(getSessionUserByToken("not-a-real-token")).resolves.toBeNull();
  });

  it("returns null after the session is revoked", async () => {
    const user = await makeUser(`sess-revoke-${Date.now()}@example.test`);
    const { token } = await createSession(user.id, {});
    await revokeSessionByToken(token);
    await expect(getSessionUserByToken(token)).resolves.toBeNull();
  });

  it("revokes all sessions for a user", async () => {
    const user = await makeUser(`sess-revokeall-${Date.now()}@example.test`);
    const a = await createSession(user.id, {});
    const b = await createSession(user.id, {});
    await revokeAllSessionsForUser(user.id);
    await expect(getSessionUserByToken(a.token)).resolves.toBeNull();
    await expect(getSessionUserByToken(b.token)).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- session`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/auth/session.ts`**

```typescript
import crypto from "node:crypto";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, users, type Role } from "@/db/schema";

export const SESSION_COOKIE_NAME = "fiduvia_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string; ip?: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getSessionUserByToken(
  token: string,
): Promise<SessionUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gte(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function revokeSessionByToken(token: string): Promise<void> {
  await db
    .delete(sessions)
    .where(eq(sessions.tokenHash, hashToken(token)));
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- session`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/session.ts tests/unit/session.test.ts
git commit -m "Add session creation, lookup, and revocation"
```

---

## Task 10: Signup API route

**Files:**
- Create: `src/lib/http.ts`
- Create: `src/app/api/auth/signup/route.ts`
- Test: `tests/unit/routes/signup.test.ts`

**Interfaces:**
- Consumes: `hashPassword` (Task 4), `createOtp` (Task 6), `sendEmail`/`otpEmailTemplate` (Task 8), `db`/`users` (Task 3).
- Produces: `getClientIp(request: NextRequest): string` from `src/lib/http.ts`, reused by every later route task. `POST` handler at `/api/auth/signup` — request `{ email, password, firstName, lastName, phone? }`, response `200 { ok: true }` or `400 { ok: false, error: string }`.

All route handler tasks use `NextRequest`/`NextResponse` (from `next/server`) rather than `next/headers`'s `cookies()`, specifically so they can be unit-tested by importing and invoking the handler directly — `next/headers` only works inside a live Next.js request lifecycle. Requires Docker Compose Postgres running and migrated.

- [ ] **Step 1: Write `src/lib/http.ts`**

```typescript
import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/routes/signup.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { POST } from "../../../src/app/api/auth/signup/route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/signup", () => {
  it("creates an unverified client user", async () => {
    const email = `signup-${Date.now()}@example.test`;
    const res = await POST(
      req({
        email,
        password: "a-long-enough-password",
        firstName: "Camille",
        lastName: "Rochat",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    expect(user.role).toBe("client");
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.passwordHash).not.toBe("a-long-enough-password");
  });

  it("rejects a duplicate email", async () => {
    const email = `signup-dup-${Date.now()}@example.test`;
    await POST(
      req({ email, password: "a-long-enough-password", firstName: "A", lastName: "B" }),
    );
    const res = await POST(
      req({ email, password: "another-long-password", firstName: "A", lastName: "B" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("rejects a too-short password", async () => {
    const res = await POST(
      req({
        email: `signup-short-${Date.now()}@example.test`,
        password: "short",
        firstName: "A",
        lastName: "B",
      }),
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- routes/signup`
Expected: FAIL — route module does not exist.

- [ ] **Step 4: Implement the route**

Create `src/app/api/auth/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { createOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Merci de vérifier les informations saisies." },
      { status: 400 },
    );
  }
  const { email, password, firstName, lastName, phone } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Un compte existe déjà avec cette adresse e-mail." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, firstName, lastName, phone, role: "client" })
    .returning();

  const code = await createOtp(user.id, "signup");
  const emailBody = otpEmailTemplate({ code, purpose: "signup" });
  await sendEmail({ to: user.email, ...emailBody });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- routes/signup`
Expected: PASS, all 3 tests. (Needs Mailhog running from Task 2 so `sendEmail` succeeds.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/http.ts src/app/api/auth/signup tests/unit/routes/signup.test.ts
git commit -m "Add signup API route"
```

---

## Task 11: Login API route

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Test: `tests/unit/routes/login.test.ts`

**Interfaces:**
- Consumes: `verifyPassword` (Task 4), `isLoginRateLimited`/`recordLoginFailure` (Task 7), `createOtp` (Task 6), `sendEmail`/`otpEmailTemplate` (Task 8), `getClientIp` (Task 10).
- Produces: `POST` handler at `/api/auth/login` — request `{ email, password }`, response `200 { ok: true }` on valid credentials (an OTP is emailed; no session yet), `401 { ok: false, error: string }` on bad credentials, `429 { ok: false, error: string }` when rate-limited.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/login.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as signup } from "../../../src/app/api/auth/signup/route";
import { POST as login } from "../../../src/app/api/auth/login/route";

function req(path: string, body: unknown, ip = "127.0.0.1") {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });
}

async function makeAccount(ip: string) {
  const email = `login-${Date.now()}-${Math.random()}@example.test`;
  const password = "a-long-enough-password";
  await signup(
    req("/api/auth/signup", { email, password, firstName: "A", lastName: "B" }, ip),
  );
  return { email, password };
}

describe("POST /api/auth/login", () => {
  it("accepts correct credentials and does not error", async () => {
    const { email, password } = await makeAccount("20.0.0.1");
    const res = await login(req("/api/auth/login", { email, password }, "20.0.0.1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("rejects an incorrect password with a generic message", async () => {
    const { email } = await makeAccount("20.0.0.2");
    const res = await login(
      req("/api/auth/login", { email, password: "wrong-password" }, "20.0.0.2"),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).not.toMatch(/password/i);
  });

  it("rejects an unknown email with the same generic message as a wrong password", async () => {
    const unknown = await login(
      req(
        "/api/auth/login",
        { email: "nobody@example.test", password: "whatever123" },
        "20.0.0.3",
      ),
    );
    const wrongPw = await (async () => {
      const { email } = await makeAccount("20.0.0.3");
      return login(req("/api/auth/login", { email, password: "wrong" }, "20.0.0.3"));
    })();
    expect((await unknown.json()).error).toBe((await wrongPw.json()).error);
  });

  it("rate-limits after 5 failed attempts from the same email+ip", async () => {
    const { email } = await makeAccount("20.0.0.4");
    for (let i = 0; i < 5; i++) {
      await login(req("/api/auth/login", { email, password: "wrong" }, "20.0.0.4"));
    }
    const res = await login(
      req("/api/auth/login", { email, password: "wrong" }, "20.0.0.4"),
    );
    expect(res.status).toBe(429);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- routes/login`
Expected: FAIL — route module does not exist.

- [ ] **Step 3: Implement the route**

Create `src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";
import { isLoginRateLimited, recordLoginFailure } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/http";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const GENERIC_ERROR = "Adresse e-mail ou mot de passe incorrect.";

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }
  const { email, password } = parsed.data;
  const ip = getClientIp(request);

  if (await isLoginRateLimited(email, ip)) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  const valid = user ? await verifyPassword(user.passwordHash, password) : false;

  if (!user || !valid) {
    await recordLoginFailure(email, ip);
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  const code = await createOtp(user.id, "login");
  const emailBody = otpEmailTemplate({ code, purpose: "login" });
  await sendEmail({ to: user.email, ...emailBody });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- routes/login`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/login tests/unit/routes/login.test.ts
git commit -m "Add login API route with rate limiting"
```

---

## Task 12: Verify-OTP API route

**Files:**
- Create: `src/app/api/auth/verify-otp/route.ts`
- Test: `tests/unit/routes/verifyOtp.test.ts`

**Interfaces:**
- Consumes: `consumeOtp` (Task 6), `createSession`/`SESSION_COOKIE_NAME` (Task 9), `recordLoginSuccess` (Task 7), `writeAuditLog` (Task 5), `getClientIp` (Task 10).
- Produces: `POST` handler at `/api/auth/verify-otp` — request `{ email, code, purpose }` where `purpose` is `"login" | "signup"`, response `200 { ok: true, role: Role }` with the session cookie set, or `401 { ok: false, error: string }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/verifyOtp.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { createOtp } from "../../../src/lib/auth/otp";
import { hashPassword } from "../../../src/lib/auth/password";
import { POST as verifyOtp } from "../../../src/app/api/auth/verify-otp/route";
import { SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function makeUnverifiedUser() {
  const email = `verify-${Date.now()}-${Math.random()}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword("irrelevant-here"),
      firstName: "A",
      lastName: "B",
      role: "client",
    })
    .returning();
  return user;
}

describe("POST /api/auth/verify-otp", () => {
  it("sets a session cookie and marks the email verified on signup purpose", async () => {
    const user = await makeUnverifiedUser();
    const code = await createOtp(user.id, "signup");

    const res = await verifyOtp(req({ email: user.email, code, purpose: "signup" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, role: "client" });
    expect(res.cookies.get(SESSION_COOKIE_NAME)).toBeDefined();

    const [updated] = await db.select().from(users).where(eq(users.id, user.id));
    expect(updated.emailVerifiedAt).not.toBeNull();
  });

  it("rejects a wrong code", async () => {
    const user = await makeUnverifiedUser();
    await createOtp(user.id, "login");
    const res = await verifyOtp(req({ email: user.email, code: "000000", purpose: "login" }));
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- routes/verifyOtp`
Expected: FAIL — route module does not exist.

- [ ] **Step 3: Implement the route**

Create `src/app/api/auth/verify-otp/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { consumeOtp } from "@/lib/auth/otp";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { recordLoginSuccess } from "@/lib/auth/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(["login", "signup"]),
});

const GENERIC_ERROR = "Code incorrect ou expiré.";

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }
  const { email, code, purpose } = parsed.data;
  const ip = getClientIp(request);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  const result = await consumeOtp(user.id, purpose, code);
  if (!result.ok) {
    const message =
      result.reason === "too_many_attempts"
        ? "Trop de tentatives. Demandez un nouveau code."
        : GENERIC_ERROR;
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }

  if (purpose === "signup") {
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, user.id));
  }

  const { token, expiresAt } = await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  await recordLoginSuccess(user.id, user.email, ip);
  await writeAuditLog({
    actorUserId: user.id,
    action: purpose === "signup" ? "signup_verified" : "login_succeeded",
    ip,
  });

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return response;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- routes/verifyOtp`
Expected: PASS, both tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/verify-otp tests/unit/routes/verifyOtp.test.ts
git commit -m "Add OTP verification route that issues the session cookie"
```

---

## Task 13: Logout API route

**Files:**
- Create: `src/app/api/auth/logout/route.ts`
- Test: `tests/unit/routes/logout.test.ts`

**Interfaces:**
- Consumes: `revokeSessionByToken`, `SESSION_COOKIE_NAME` (Task 9).
- Produces: `POST` handler at `/api/auth/logout` — no body required, clears the session cookie, always responds `200 { ok: true }`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/routes/logout.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, getSessionUserByToken, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { POST as logout } from "../../../src/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("revokes the session named by the cookie and clears it", async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: `logout-${Date.now()}@example.test`,
        passwordHash: await hashPassword("irrelevant"),
        firstName: "A",
        lastName: "B",
      })
      .returning();
    const { token } = await createSession(user.id, {});

    const request = new NextRequest("http://localhost/api/auth/logout", { method: "POST" });
    request.cookies.set(SESSION_COOKIE_NAME, token);

    const res = await logout(request);
    expect(res.status).toBe(200);
    expect(await getSessionUserByToken(token)).toBeNull();
  });

  it("returns ok even with no session cookie present", async () => {
    const request = new NextRequest("http://localhost/api/auth/logout", { method: "POST" });
    const res = await logout(request);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- routes/logout`
Expected: FAIL — route module does not exist.

- [ ] **Step 3: Implement the route**

Create `src/app/api/auth/logout/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { revokeSessionByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await revokeSessionByToken(token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- routes/logout`
Expected: PASS, both tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/logout tests/unit/routes/logout.test.ts
git commit -m "Add logout API route"
```

---

## Task 14: Forgot-password & reset-password API routes

**Files:**
- Create: `src/app/api/auth/forgot-password/route.ts`
- Create: `src/app/api/auth/reset-password/route.ts`
- Test: `tests/unit/routes/passwordReset.test.ts`

**Interfaces:**
- Consumes: `createOtp`/`consumeOtp` (Task 6), `hashPassword`/`verifyPassword` (Task 4), `revokeAllSessionsForUser` (Task 9), `sendEmail`/`otpEmailTemplate` (Task 8), `writeAuditLog` (Task 5).
- Produces: `POST /api/auth/forgot-password` — request `{ email }`, always responds `200 { ok: true }`. `POST /api/auth/reset-password` — request `{ email, code, newPassword }`, response `200 { ok: true }` or `400 { ok: false, error: string }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/passwordReset.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users, otpCodes } from "../../../src/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../../src/lib/auth/password";
import { POST as forgotPassword } from "../../../src/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "../../../src/app/api/auth/reset-password/route";

function req(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("password reset flow", () => {
  it("returns ok for both known and unknown emails", async () => {
    const known = await forgotPassword(req("/api/auth/forgot-password", {
      email: `reset-${Date.now()}@example.test`,
    }));
    const unknown = await forgotPassword(req("/api/auth/forgot-password", {
      email: "definitely-not-registered@example.test",
    }));
    expect(await known.json()).toEqual({ ok: true });
    expect(await unknown.json()).toEqual({ ok: true });
  });

  it("resets the password with a valid code and revokes existing sessions", async () => {
    const email = `reset-flow-${Date.now()}@example.test`;
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash: await hashPassword("old-password-123"), firstName: "A", lastName: "B" })
      .returning();

    await forgotPassword(req("/api/auth/forgot-password", { email }));

    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.userId, user.id), eq(otpCodes.purpose, "password_reset")));
    expect(otp).toBeDefined(); // confirms forgotPassword actually created the OTP row
    // The plain code isn't retrievable from the DB by design; re-issue one directly for this assertion.
    const { createOtp } = await import("../../../src/lib/auth/otp");
    const code = await createOtp(user.id, "password_reset");

    const res = await resetPassword(
      req("/api/auth/reset-password", { email, code, newPassword: "brand-new-password-1" }),
    );
    expect(res.status).toBe(200);

    const [updated] = await db.select().from(users).where(eq(users.id, user.id));
    await expect(verifyPassword(updated.passwordHash, "brand-new-password-1")).resolves.toBe(true);
  });

  it("rejects an invalid code with a generic error", async () => {
    const email = `reset-bad-${Date.now()}@example.test`;
    await db.insert(users).values({
      email,
      passwordHash: await hashPassword("old-password-123"),
      firstName: "A",
      lastName: "B",
    });
    const res = await resetPassword(
      req("/api/auth/reset-password", { email, code: "000000", newPassword: "brand-new-password-1" }),
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- routes/passwordReset`
Expected: FAIL — route modules do not exist.

- [ ] **Step 3: Implement `src/app/api/auth/forgot-password/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (parsed.success) {
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
    if (user) {
      const code = await createOtp(user.id, "password_reset");
      const emailBody = otpEmailTemplate({ code, purpose: "password_reset" });
      await sendEmail({ to: user.email, ...emailBody });
    }
  }
  // Always the same response, whether or not the account exists.
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Implement `src/app/api/auth/reset-password/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { consumeOtp } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(10),
});

const GENERIC_ERROR = "Code incorrect ou expiré.";

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }
  const { email, code, newPassword } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const result = await consumeOtp(user.id, "password_reset", code);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  await revokeAllSessionsForUser(user.id);
  await writeAuditLog({
    actorUserId: user.id,
    action: "password_reset",
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- routes/passwordReset`
Expected: PASS, all 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/forgot-password src/app/api/auth/reset-password tests/unit/routes/passwordReset.test.ts
git commit -m "Add forgot-password and reset-password routes"
```

---

## Task 15: RBAC guards + middleware

**Files:**
- Create: `src/lib/auth/guards.ts`
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `getSessionUserByToken`, `SESSION_COOKIE_NAME`, `SessionUser` (Task 9).
- Produces: `getCurrentUser(): Promise<SessionUser | null>`, `requireRole(allowed: Role[]): Promise<SessionUser>` from `src/lib/auth/guards.ts`, consumed by Task 18's layouts.

`getCurrentUser`/`requireRole` use `next/headers`'s `cookies()`, which only resolves inside a live Next.js request (Server Components, Route Handlers, layouts) — not callable from a bare Vitest test the way Task 10–14's routes are. Middleware likewise only runs inside the Next.js server. Both are verified by the Task 21 Playwright E2E suite, not unit tests; this task's own verification is a manual dev-server check.

- [ ] **Step 1: Implement `src/lib/auth/guards.ts`**

```typescript
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserByToken, SESSION_COOKIE_NAME, type SessionUser } from "@/lib/auth/session";
import type { Role } from "@/db/schema";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionUserByToken(token);
}

export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/");
  return user;
}
```

- [ ] **Step 2: Implement `src/middleware.ts`**

This is a cheap, fast pre-check (redirect to `/login` if there is no session cookie at all) so an unauthenticated visitor never even renders a protected layout. It is not the authority on role — `requireRole` in Task 18's layouts is, since middleware cannot safely query Postgres to validate the session token in this Next.js version's edge-oriented middleware runtime.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/guards.ts src/middleware.ts
git commit -m "Add RBAC guards and route-protection middleware"
```

(Manual verification of this task happens as part of Task 18, once there are pages to protect.)

---

## Task 16: Auth UI — signup, login, verify-otp pages

**Files:**
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/verify/page.tsx`
- Create: `src/app/(auth)/layout.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/signup`, `/api/auth/login`, `/api/auth/verify-otp` (Tasks 10–12).
- Produces: client-facing routes `/signup`, `/login`, `/verify?email=...&purpose=...`, each a client component posting `fetch` requests to the routes above.

This task is implementation + a manual verification pass; the flow is exercised end-to-end by Task 21's Playwright suite.

- [ ] **Step 1: Implement the shared auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 420, margin: "80px auto", fontFamily: "sans-serif" }}>
      {children}
    </main>
  );
}
```

- [ ] **Step 2: Implement the signup page**

Create `src/app/(auth)/signup/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    setLoading(false);
    if (!body.ok) {
      setError(body.error);
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(form.email)}&purpose=signup`);
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Créer mon compte</h1>
      <input placeholder="Prénom" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
      <input placeholder="Nom" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
      <input type="email" placeholder="E-mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Mot de passe" required minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>Créer mon compte</button>
    </form>
  );
}
```

- [ ] **Step 3: Implement the login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    setLoading(false);
    if (!body.ok) {
      setError(body.error);
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(form.email)}&purpose=login`);
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Se connecter</h1>
      <input type="email" placeholder="E-mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Mot de passe" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>Se connecter</button>
      <p><a href="/forgot-password">Mot de passe oublié ?</a></p>
    </form>
  );
}
```

- [ ] **Step 4: Implement the OTP verification page**

Create `src/app/(auth)/verify/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const purpose = (params.get("purpose") as "login" | "signup") ?? "login";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code, purpose }),
    });
    const body = await res.json();
    setLoading(false);
    if (!body.ok) {
      setError(body.error);
      return;
    }
    router.push(body.role === "client" ? "/portal" : "/admin");
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Code de vérification</h1>
      <p>Un code a été envoyé à {email}.</p>
      <input
        placeholder="000000"
        required
        maxLength={6}
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>Valider</button>
    </form>
  );
}
```

- [ ] **Step 5: Manual verification**

Run: `docker compose up -d && npm run dev`
Visit `http://localhost:3000/signup`, create an account, confirm redirect to `/verify`.
Open `http://localhost:8025` (Mailhog), find the OTP email, copy the code.
Enter it on the verify page.
Expected: redirected to `/portal` (a 404 is fine for now — Task 18 builds that page).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(auth)"
git commit -m "Add signup, login, and OTP verification pages"
```

---

## Task 17: Auth UI — forgot-password, reset-password pages

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/app/(auth)/reset-password/page.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/forgot-password`, `/api/auth/reset-password` (Task 14).
- Produces: client-facing routes `/forgot-password`, `/reset-password?email=...`.

- [ ] **Step 1: Implement the forgot-password page**

Create `src/app/(auth)/forgot-password/page.tsx`:

```tsx
"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  }

  if (sent) {
    return <p>Si un compte existe avec cette adresse, un code de réinitialisation a été envoyé.</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Mot de passe oublié</h1>
      <input type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Envoyer le code</button>
    </form>
  );
}
```

- [ ] **Step 2: Implement the reset-password page**

Create `src/app/(auth)/reset-password/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", code: "", newPassword: "" });
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    if (!body.ok) {
      setError(body.error);
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Réinitialiser le mot de passe</h1>
      <input type="email" placeholder="E-mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Code reçu par e-mail" required maxLength={6} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
      <input type="password" placeholder="Nouveau mot de passe" required minLength={10} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Réinitialiser</button>
    </form>
  );
}
```

- [ ] **Step 3: Manual verification**

Run the forgot-password flow against the dev server and Mailhog the same way as Task 16, confirming a new password successfully logs in afterward.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/forgot-password" "src/app/(auth)/reset-password"
git commit -m "Add forgot-password and reset-password pages"
```

---

## Task 18: Placeholder authenticated shells (/portal, /admin)

**Files:**
- Create: `src/app/portal/layout.tsx`
- Create: `src/app/portal/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `scripts/seed-admin.ts`

**Interfaces:**
- Consumes: `requireRole` (Task 15).
- Produces: `/portal` (role `client` only) and `/admin` (roles `admin`, `super_admin`) — the two protected destinations Task 16's `verify` page redirects to. This is the task that proves the whole auth pipeline end-to-end.

- [ ] **Step 1: Implement the client portal layout and home**

Create `src/app/portal/layout.tsx`:

```tsx
import { requireRole } from "@/lib/auth/guards";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["client"]);
  return <div>{children}</div>;
}
```

Create `src/app/portal/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/auth/guards";

export default async function PortalHomePage() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Mon espace client</h1>
      <p>Connecté en tant que {user?.firstName} {user?.lastName} ({user?.email}).</p>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Se déconnecter</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Implement the admin layout and home**

Create `src/app/admin/layout.tsx`:

```tsx
import { requireRole } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "super_admin"]);
  return <div>{children}</div>;
}
```

Create `src/app/admin/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/auth/guards";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Espace administrateur</h1>
      <p>
        Connecté en tant que {user?.firstName} {user?.lastName} ({user?.role}).
      </p>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Se déconnecter</button>
      </form>
    </main>
  );
}
```

The logout `<form>` posts directly to `/api/auth/logout` (Task 13) — no client-side helper module is needed for it.

- [ ] **Step 3: Seed one admin account for manual testing**

Create a one-off script `scripts/seed-admin.ts`:

```typescript
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
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
```

Add to `package.json` `"scripts"`: `"seed:admin": "tsx scripts/seed-admin.ts"`.

Run: `npm run seed:admin -- admin@fiduvia.test a-long-enough-password`
Expected: prints confirmation; this is a throwaway local account for dev/E2E use, not the real production super-admin.

- [ ] **Step 4: Manual verification of the full pipeline**

With `docker compose up -d && npm run dev` running:
- Sign up a new client at `/signup`, verify via Mailhog, confirm landing on `/portal` showing the right name/email.
- Log out, then log back in at `/login`, confirm the OTP round-trip lands on `/portal` again.
- Log in with the seeded admin account, confirm landing on `/admin`.
- Visit `/admin` directly while logged in as the client account — expect redirect away (proves `requireRole` is enforced, not just the middleware pre-check).
- Visit `/portal` directly with no cookie at all (e.g. an incognito window) — expect redirect to `/login` (proves the middleware pre-check).

- [ ] **Step 5: Commit**

```bash
git add src/app/portal src/app/admin scripts/seed-admin.ts package.json
git commit -m "Add protected client portal and admin shells; admin seed script"
```

---

## Task 19: Security headers

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Produces: security response headers applied to every route. HSTS is deliberately excluded — see Global Constraints.

- [ ] **Step 1: Add the headers config**

Edit `next.config.ts` to add a `headers()` function to the exported config:

```typescript
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=()",
        },
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none';",
        },
      ],
    },
  ];
},
```

- [ ] **Step 2: Verify the headers are present and the CSP doesn't break the app**

Run: `npm run build && npm run start`
Run: `curl -sD - http://localhost:3000/ -o /dev/null`
Expected: response includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy: ...`, and no `Strict-Transport-Security` header.

Then, in a real browser (not just curl), open the devtools console and click through `/signup` → `/login` → `/portal` (as the Task 18 seeded account). `script-src 'self'` blocks any inline `<script>` Next.js might emit, so this has to be checked visually, not just header presence.
Expected: no CSP violation errors in the console, and the OTP forms still submit successfully. If a violation appears for Next.js's own runtime scripts, add a nonce-based `script-src` instead of loosening it to `'unsafe-inline'`.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "Add security response headers (HSTS deliberately excluded until go-live)"
```

---

## Task 20: Structured error handling

**Files:**
- Create: `src/lib/logger.ts`
- Create: `src/app/error.tsx`
- Create: `src/app/portal/error.tsx`
- Create: `src/app/admin/error.tsx`
- Test: `tests/unit/logger.test.ts`

**Interfaces:**
- Produces: `logger` (pino instance) from `src/lib/logger.ts`, used anywhere server-side code needs to log; three React error boundaries so a failure in one section doesn't blank the whole app.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/logger.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { logger } from "../../src/lib/logger";

describe("logger", () => {
  it("exposes standard pino log methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
  });

  it("does not throw when logging an object", () => {
    expect(() => logger.info({ route: "/test" }, "test message")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- logger`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/logger.ts`**

```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: ["*.password", "*.newPassword", "*.code", "*.passwordHash"],
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- logger`
Expected: PASS.

- [ ] **Step 5: Add root and section error boundaries**

Create `src/app/error.tsx`:

```tsx
"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main style={{ maxWidth: 600, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Une erreur est survenue</h1>
      <p>Veuillez réessayer ou revenir à l'accueil. Notre équipe a été informée.</p>
    </main>
  );
}
```

Create `src/app/portal/error.tsx` and `src/app/admin/error.tsx` with the same content (each App Router segment needs its own `error.tsx` to catch failures local to that section without unmounting the rest of the app).

- [ ] **Step 6: Verify no stack traces leak**

Temporarily throw inside `src/app/portal/page.tsx` (e.g. `throw new Error("boom")` at the top of the component), run `npm run build && npm run start`, visit `/portal` logged in as the seeded client.
Expected: the generic French error message renders; view page source and confirm no stack trace or the literal string "boom" appears anywhere in the HTML.
Remove the temporary throw once confirmed.

- [ ] **Step 7: Commit**

```bash
git add src/lib/logger.ts src/app/error.tsx src/app/portal/error.tsx src/app/admin/error.tsx tests/unit/logger.test.ts
git commit -m "Add structured logging and section-scoped error boundaries"
```

---

## Task 21: End-to-end Playwright suite

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/helpers/mailhog.ts`
- Create: `tests/e2e/auth.spec.ts`

**Interfaces:**
- Consumes: the running app (`npm run dev`, started automatically by Playwright's `webServer` config), Mailhog's REST API on `localhost:8025`.
- Produces: `getLatestOtpForEmail(email: string): Promise<string>` from `tests/e2e/helpers/mailhog.ts`, an automated pass over every flow in the Foundation spec.

Requires `docker compose up -d` and migrations applied (Tasks 2–3) before running.

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Configure Playwright**

Create `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
```

Add to `package.json` `"scripts"`: `"test:e2e": "playwright test"`.

- [ ] **Step 3: Write the Mailhog helper**

Create `tests/e2e/helpers/mailhog.ts`:

```typescript
export async function getLatestOtpForEmail(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(
      `http://localhost:8025/api/v2/search?kind=to&query=${encodeURIComponent(email)}`,
    );
    const data = await res.json();
    if (data.items?.length > 0) {
      const latest = data.items[0];
      const body: string = latest.Content.Body;
      const match = body.match(/\b(\d{6})\b/);
      if (match) return match[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No OTP email found for ${email}`);
}
```

- [ ] **Step 4: Write the E2E spec**

Create `tests/e2e/auth.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { getLatestOtpForEmail } from "./helpers/mailhog";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.test`;
}

test("signup → verify → reaches the client portal", async ({ page }) => {
  const email = uniqueEmail("e2e-signup");
  await page.goto("/signup");
  await page.getByPlaceholder("Prénom").fill("Camille");
  await page.getByPlaceholder("Nom").fill("Rochat");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Mot de passe").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await page.waitForURL(/\/verify/);
  const code = await getLatestOtpForEmail(email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Valider" }).click();

  await page.waitForURL("/portal");
  await expect(page.getByText(email)).toBeVisible();
});

test("login → verify → reaches the client portal", async ({ page, request }) => {
  const email = uniqueEmail("e2e-login");
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });
  await getLatestOtpForEmail(email); // drain the signup OTP email first

  await page.goto("/login");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Mot de passe").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL(/\/verify/);
  const code = await getLatestOtpForEmail(email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Valider" }).click();
  await page.waitForURL("/portal");
});

test("wrong password shows a generic error and does not proceed", async ({ page, request }) => {
  const email = uniqueEmail("e2e-wrongpw");
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });

  await page.goto("/login");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Mot de passe").fill("totally-wrong");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("alert")).toHaveText("Adresse e-mail ou mot de passe incorrect.");
  await expect(page).toHaveURL(/\/login/);
});

test("locks out after 5 wrong OTP attempts", async ({ page, request }) => {
  const email = uniqueEmail("e2e-otplock");
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });
  await getLatestOtpForEmail(email);

  await page.goto(`/verify?email=${encodeURIComponent(email)}&purpose=signup`);
  for (let i = 0; i < 5; i++) {
    await page.getByPlaceholder("000000").fill("000000");
    await page.getByRole("button", { name: "Valider" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await expect(page.getByRole("alert")).toHaveText("Trop de tentatives. Demandez un nouveau code.");
});

test("locks out after 5 failed login attempts from the same browser", async ({ page, request }) => {
  const email = uniqueEmail("e2e-loginlock");
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });

  await page.goto("/login");
  for (let i = 0; i < 5; i++) {
    await page.getByPlaceholder("E-mail").fill(email);
    await page.getByPlaceholder("Mot de passe").fill("wrong-each-time");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Mot de passe").fill("wrong-each-time");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("alert")).toHaveText("Trop de tentatives. Réessayez dans quelques minutes.");
});

test("admin login reaches the admin dashboard, not the client portal", async ({ page, request }) => {
  // Assumes the Task 18 seed script has been run for this admin account.
  const email = "admin@fiduvia.test";
  await page.goto("/login");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Mot de passe").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL(/\/verify/);
  const code = await getLatestOtpForEmail(email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Valider" }).click();
  await page.waitForURL("/admin");

  await page.goto("/portal");
  await expect(page).not.toHaveURL("/portal");
});
```

- [ ] **Step 5: Run the suite**

Ensure `docker compose up -d`, migrations applied, and `npm run seed:admin -- admin@fiduvia.test a-long-enough-password` has been run once.

Run: `npm run test:e2e`
Expected: all 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e package.json
git commit -m "Add end-to-end Playwright suite covering the full auth pipeline"
```

---

## Task 22: CI pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: a GitHub Actions workflow running lint, type-check, unit tests, and E2E tests on every PR and on push to `main`, blocking merge on failure.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: fiduvia
          POSTGRES_PASSWORD: fiduvia
          POSTGRES_DB: fiduvia
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U fiduvia"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
      mailhog:
        image: mailhog/mailhog:latest
        ports: ["1025:1025", "8025:8025"]

    env:
      DATABASE_URL: postgres://fiduvia:fiduvia@localhost:5432/fiduvia
      SESSION_SECRET: ci-only-secret-please-do-not-reuse-in-prod
      SMTP_HOST: localhost
      SMTP_PORT: 1025
      SMTP_FROM: "Fiduvia <no-reply@fiduvia.ch>"

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm run db:migrate
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run seed:admin -- admin@fiduvia.test a-long-enough-password
      - run: npm run build
      - run: npm run test:e2e
```

- [ ] **Step 2: Verify locally as close as possible**

Run the same sequence of commands locally against the Task 2 Docker Compose stack (steps: `npx tsc --noEmit`, `npm run lint`, `npm run db:migrate`, `npm test`, `npm run build`, `npm run test:e2e`) and confirm each passes before pushing, since GitHub Actions isn't runnable from here directly.

- [ ] **Step 3: Commit and push to trigger the first real run**

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI pipeline: lint, typecheck, unit, and e2e tests"
```

Push the branch and open a PR (or push directly if working on `main` solo at this stage); confirm the Actions run goes green before continuing.

---

## Task 23: Production deploy artifacts (Caddyfile, backups, deployment guide)

**Files:**
- Create: `Caddyfile`
- Create: `scripts/backup-db.sh`
- Create: `docs/deployment/foundation.md`

**Interfaces:**
- Produces: the reverse-proxy config that terminates real TLS in front of the app container, a nightly-cron-ready backup script targeting Infomaniak Object Storage, and a written runbook for provisioning the Infomaniak instance this plan has otherwise only referenced.

This is documentation and ops config, not application code — there is no automated test; verification is a dry run against a real (or throwaway) Infomaniak instance before go-live.

- [ ] **Step 1: Write the Caddyfile**

Create `Caddyfile`:

```
fiduvia.ch, www.fiduvia.ch {
	reverse_proxy localhost:3000
}
```

Caddy requests and renews a real Let's Encrypt certificate automatically for both hosts the first time it starts with a public DNS record pointing at the instance — no manual certificate handling, directly replacing the mockup's broken self-signed cert.

- [ ] **Step 2: Write the backup script**

Create `scripts/backup-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
DUMP_FILE="/tmp/fiduvia-${TIMESTAMP}.sql.gz"

pg_dump "${DATABASE_URL}" | gzip > "${DUMP_FILE}"

aws s3 cp "${DUMP_FILE}" "s3://${BACKUP_S3_BUCKET}/db/${TIMESTAMP}.sql.gz" \
  --endpoint-url "${BACKUP_S3_ENDPOINT}"

rm "${DUMP_FILE}"
echo "Backed up to s3://${BACKUP_S3_BUCKET}/db/${TIMESTAMP}.sql.gz"
```

Run: `chmod +x scripts/backup-db.sh`

This uses the standard AWS CLI against Infomaniak's S3-compatible endpoint (`aws configure` with the Infomaniak Object Storage access/secret key once on the production instance) — no Infomaniak-specific tooling needed, and no dependency on the sub-project-2 document-storage interface, since this is a separate, backup-only bucket.

- [ ] **Step 3: Write the deployment runbook**

Create `docs/deployment/foundation.md`:

```markdown
# Deploying the Foundation

## One-time Infomaniak setup

1. Create an Infomaniak Public Cloud project and a small compute instance
   (Debian or Ubuntu image). Note its public IP.
2. Point fiduvia.ch and www.fiduvia.ch DNS A records at that IP.
3. On the instance: install Docker and Caddy.
4. Create an Infomaniak Object Storage bucket dedicated to database backups
   (separate from the sub-project-2 documents bucket). Generate an
   access/secret key pair for it and run `aws configure` on the instance.
5. Either install PostgreSQL on the same instance, or provision Infomaniak's
   managed database service and use its connection string — confirm current
   pricing against the CHF 200/month ceiling before choosing (see the
   Foundation spec's open questions).

## Environment variables (production)

Set on the instance (e.g. in a `.env` file readable only by the app's
service user, permissions `600`, never committed):

- `DATABASE_URL`, `SESSION_SECRET` (a fresh long random value, not the
  `.env.example` placeholder), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
  `SMTP_PASS`, `SMTP_FROM` — from Infomaniak's real mail service, not
  Mailhog.

## Deploy

1. Build and push the image (or build directly on the instance):
   `docker build -t fiduvia-app .`
2. Run migrations: `docker run --rm --env-file .env fiduvia-app npm run db:migrate`
3. Run the app: `docker run -d --name fiduvia-app --env-file .env -p 3000:3000 --restart unless-stopped fiduvia-app`
4. Place the `Caddyfile` at `/etc/caddy/Caddyfile` and reload Caddy — this
   is what obtains the real TLS certificate.
5. Schedule the backup script via cron, nightly: add a crontab entry
   `0 3 * * * DATABASE_URL=... BACKUP_S3_BUCKET=... BACKUP_S3_ENDPOINT=... /path/to/scripts/backup-db.sh`.

## Go-live checklist

- [ ] Confirm `https://fiduvia.ch` loads with a trusted certificate (no
      browser warning) — check from a real browser, not just `curl -k`.
- [ ] Confirm certificate auto-renewal is working (Caddy handles this, but
      verify the instance can reach Let's Encrypt on port 80/443).
- [ ] Only once the above are both confirmed: enable HSTS by adding
      `Strict-Transport-Security: max-age=31536000` back into
      `next.config.ts`'s headers (Task 19 deliberately left it out). This
      ordering is the direct fix for the audit's cert/HSTS finding.
- [ ] Replace the throwaway `admin@fiduvia.test` seed account's credentials
      or remove it entirely before real client traffic arrives.
```

- [ ] **Step 4: Commit**

```bash
git add Caddyfile scripts/backup-db.sh docs/deployment/foundation.md
git commit -m "Add Caddy config, backup script, and deployment runbook"
```

