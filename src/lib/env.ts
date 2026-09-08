import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgres://")),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().min(1),
  // Where the portal's contact form delivers. Defaults to the firm's public
  // address so a deployment without it still works.
  CONTACT_EMAIL: z.string().email().optional().default("contact@fiduvia.ch"),
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_REGION: z.string().min(1),

  // Public analytics identifiers, loaded on the marketing pages only after the
  // visitor consents. Optional so dev and preview run without any tracking; a
  // blank id simply means that tag is not installed. Not secrets — they end up
  // in client-side HTML — but kept server-side and passed down so the ids can
  // change without a rebuild.
  ANALYTICS_GA_ID: z.string().optional().default(""),
  ANALYTICS_META_PIXEL_ID: z.string().optional().default(""),
  // Google Ads conversion id (AW-…), distinct from the GA4 measurement id.
  ANALYTICS_GOOGLE_ADS_ID: z.string().optional().default(""),

  // Stripe. Optional so dev and the test suite run without payments configured;
  // the checkout route refuses clearly when the secret key is absent. Both are
  // server-only secrets.
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
