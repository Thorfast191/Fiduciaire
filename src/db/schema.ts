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
import { SERVICE_TYPES } from "@/lib/serviceTypes";
import { DOCUMENT_CATEGORIES } from "@/lib/documentCategories";

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
    /**
     * Which prestation this dossier is. Every row predating service types is a
     * tax declaration, which is why that is the default.
     */
    serviceType: text("service_type", { enum: SERVICE_TYPES })
      .notNull()
      .default("declaration"),
    status: text("status", {
      // `documents_requested` / `documents_received` are the mockup's
      // `demande_piece` / `pieces_recues`: a file waiting on the client is a
      // different state from one the firm is actively working, and the
      // distinction drives what the client is shown.
      enum: [
        "not_started",
        "submitted",
        "in_review",
        "documents_requested",
        "documents_received",
        "completed",
      ],
    })
      .notNull()
      .default("not_started"),
    /**
     * The declaration questionnaire's answers. JSON rather than columns: the
     * shape is a form, not a query surface — nothing filters or aggregates on
     * an individual answer, and the mockup's own model is a single object per
     * year. `src/lib/declaration.ts` owns its shape and tolerates old rows.
     */
    answers: jsonb("answers").notNull().default({}),
    /** Which of the seven questionnaire pages the client is on. */
    currentStep: integer("current_step").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    // One dossier per client per tax year *per prestation*. Within a single
    // prestation a second row for a year is still an ambiguity no screen can
    // resolve — but a client may legitimately have a declaration and a capital
    // request for the same year, so the service type is part of the key.
    uniqueIndex("dossiers_client_year_service_idx").on(
      t.clientId,
      t.taxYear,
      t.serviceType,
    ),
    index("dossiers_tax_year_idx").on(t.taxYear),
    index("dossiers_service_type_idx").on(t.serviceType),
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
    // The list lives in `src/lib/documents.ts` so the column, the upload route
    // and the questionnaire's requirement matching cannot drift apart.
    category: text("category", { enum: DOCUMENT_CATEGORIES }).notNull(),
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
export type Dossier = typeof dossiers.$inferSelect;
/**
 * Derived from the columns rather than restated.
 *
 * Both were hand-written unions that had to be kept in step with the table
 * definitions by hand — and had already fallen out of step once the status
 * vocabulary grew. Deriving them means adding a value in one place.
 */
export type DossierStatus = Dossier["status"];
export type DocumentCategory = Document["category"];

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

/**
 * A client's Fiduvia Assistance subscription for one tax period.
 *
 * One row per client per year: subscribing again for the same period replaces
 * the selection rather than stacking, which is how the mockup's à la carte
 * panel behaves.
 */
export const assistanceSubscriptions = pgTable(
  "assistance_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id),
    taxYear: integer("tax_year").notNull(),
    /** Selected option keys, from `ASSISTANCE_OPTIONS`. */
    services: jsonb("services").notNull().default([]),
    /** Price in CHF at the time of subscribing, so later price changes do not rewrite history. */
    totalChf: integer("total_chf").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("assistance_client_year_idx").on(t.clientId, t.taxYear),
  ],
);

/**
 * A payment a client has made. Recorded by the firm rather than collected
 * online: there is no gateway yet, so this is the ledger the "Mes paiements"
 * screen reads, and the row an administrator creates once money arrives.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id),
    taxYear: integer("tax_year").notNull(),
    /** What was paid for, e.g. a declaration or a capital benefit. */
    label: text("label").notNull(),
    method: text("method", {
      enum: ["bank_transfer", "card", "twint", "other"],
    })
      .notNull()
      .default("bank_transfer"),
    amountChf: integer("amount_chf").notNull(),
    status: text("status", { enum: ["paid", "pending"] })
      .notNull()
      .default("paid"),
    paidAt: timestamp("paid_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("payments_client_idx").on(t.clientId),
    index("payments_year_idx").on(t.taxYear),
  ],
);

export type AssistanceSubscription =
  typeof assistanceSubscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
