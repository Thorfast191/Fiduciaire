import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
  uniqueIndex,
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
  // Language for transactional email. The UI reads a cookie, which a mail
  // job has no access to, so the preference is persisted per user.
  locale: text("locale", { enum: ["fr", "en"] })
    .notNull()
    .default("fr"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  /**
   * When the user accepted the CGVU at signup.
   *
   * Stored rather than merely validated: for a Swiss fiduciary the acceptance
   * is the evidence that the contractual relationship was formed, which the
   * client's own CGV assert ("l'acceptation électronique des CGVU … constituent
   * la preuve de l'accord du Client"). Nullable because accounts created by an
   * administrator never pass through the public signup form.
   */
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const sessions = pgTable(
  "sessions",
  {
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
  },
  (t) => [
    // Resolved on every authenticated request; unique because a token hash
    // identifies exactly one session.
    uniqueIndex("sessions_token_hash_idx").on(t.tokenHash),
    // Revoking every session for a user happens on each password reset.
    index("sessions_user_id_idx").on(t.userId),
  ],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
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
  },
  (t) => [
    // Both issuing and consuming a code select on (user, purpose) and take
    // the newest row.
    index("otp_codes_user_purpose_idx").on(t.userId, t.purpose, t.createdAt),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
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
  },
  (t) => [
    // The two rate limiters in src/lib/auth/rateLimit.ts: failed logins are
    // counted per (action, ip, window), OTP issuance per (action, user,
    // window). This table only grows, so both need covering indexes.
    index("audit_log_action_ip_idx").on(t.action, t.ip, t.createdAt),
    index("audit_log_action_actor_idx").on(
      t.action,
      t.actorUserId,
      t.createdAt,
    ),
  ],
);

export const dossiers = pgTable(
  "dossiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id),
    taxYear: integer("tax_year").notNull(),
    status: text("status", {
      enum: ["not_started", "submitted", "in_review", "completed"],
    })
      .notNull()
      .default("not_started"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    // One dossier per client per tax year. The client home shows a single
    // declaration card for the selected period, and the admin table assumes the
    // same, so a second row for a year is not a variant — it is an ambiguity
    // neither screen can resolve. Also serves the client-portal lookup, so the
    // separate (client_id, tax_year) index is no longer needed.
    uniqueIndex("dossiers_client_tax_year_idx").on(t.clientId, t.taxYear),
    index("dossiers_tax_year_idx").on(t.taxYear),
  ],
);

/**
 * Fiscal periods the firm has opened. Admins create a period and activate or
 * deactivate it; only active periods are offered to clients. Dossiers still
 * carry their own `tax_year`, so deactivating a period hides it from new
 * filings without touching existing ones.
 */
export const taxPeriods = pgTable("tax_periods", {
  year: integer("year").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id),
    filename: text("filename").notNull(),
    category: text("category", {
      enum: [
        "salaire",
        "releves_bancaires",
        "assurance",
        "pilier3",
        "justificatifs",
        "autre",
      ],
    }).notNull(),
    storageKey: text("storage_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    // Every dossier view lists its documents; the owner listing is the
    // client's own "my documents" query.
    index("documents_dossier_id_idx").on(t.dossierId),
    index("documents_owner_id_idx").on(t.ownerId),
  ],
);

export type Role = "client" | "admin" | "super_admin";
export type OtpPurpose = "login" | "signup" | "password_reset";
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DossierStatus =
  "not_started" | "submitted" | "in_review" | "completed";
export type DocumentCategory =
  | "salaire"
  | "releves_bancaires"
  | "assurance"
  | "pilier3"
  | "justificatifs"
  | "autre";
export type Dossier = typeof dossiers.$inferSelect;

/**
 * Messages an administrator sends to a client about one dossier — the brief's
 * "notification automatique depuis l'espace administrateur", covering both
 * requesting supporting documents and flagging that action is required.
 *
 * Kept as rows rather than fire-and-forget email so the client sees the request
 * in their space even if the mail is lost, and so an admin can tell whether it
 * has been read.
 */
export const dossierNotifications = pgTable(
  "dossier_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id),
    sentBy: uuid("sent_by")
      .notNull()
      .references(() => users.id),
    kind: text("kind", {
      enum: ["documents_requested", "action_required"],
    }).notNull(),
    /** Optional free text from the admin, shown to the client verbatim. */
    message: text("message"),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    // The client's dossier view reads the unacknowledged ones for that dossier.
    index("dossier_notifications_dossier_idx").on(t.dossierId, t.createdAt),
  ],
);

export type TaxPeriod = typeof taxPeriods.$inferSelect;

export type DossierNotification = typeof dossierNotifications.$inferSelect;
export type NotificationKind = DossierNotification["kind"];
