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
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
