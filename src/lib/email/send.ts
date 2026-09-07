import nodemailer from "nodemailer";
import { env } from "@/lib/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  // 465 is implicit TLS: the connection is encrypted from the first byte.
  // Nodemailer defaults `secure` to false, which makes it open in plaintext and
  // look for STARTTLS — a port 465 server never offers that, so the connection
  // stalls and no mail is sent. Since every login depends on an emailed code,
  // getting this wrong locks everyone out rather than degrading quietly.
  // 587 and 1025 (MailHog) stay on the STARTTLS-or-plaintext path.
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER
    ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
    : undefined,
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
