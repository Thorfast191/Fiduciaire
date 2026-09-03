import type { NotificationKind } from "@/db/schema";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const COPY: Record<
  Locale,
  {
    subjects: Record<NotificationKind, string>;
    greeting: (name: string) => string;
    intro: Record<NotificationKind, string>;
    cta: string;
    signoff: string;
  }
> = {
  fr: {
    subjects: {
      documents_requested: "Pièces complémentaires demandées — Fiduvia",
      action_required: "Action requise sur votre dossier — Fiduvia",
    },
    greeting: (name) => `Bonjour ${name},`,
    intro: {
      documents_requested:
        "Votre fiduciaire vous demande de transmettre des pièces complémentaires pour votre dossier.",
      action_required: "Votre dossier nécessite une action de votre part.",
    },
    cta: "Connectez-vous à votre espace client pour consulter le détail et y répondre.",
    signoff: "Fiduvia — votre fiduciaire, entièrement en ligne.",
  },
  en: {
    subjects: {
      documents_requested: "Additional documents requested — Fiduvia",
      action_required: "Action required on your file — Fiduvia",
    },
    greeting: (name) => `Hello ${name},`,
    intro: {
      documents_requested:
        "Your accountant is asking you to send additional documents for your file.",
      action_required: "Your file needs action from you.",
    },
    cta: "Log in to your client area to see the details and respond.",
    signoff: "Fiduvia — your accounting firm, entirely online.",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notification an administrator sends about a dossier, rendered in the
 * recipient's own language (`users.locale`) rather than the admin's.
 *
 * The admin's free-text note is escaped for the HTML part: it is arbitrary
 * input that ends up in someone's mail client.
 */
export function notificationEmailTemplate(params: {
  kind: NotificationKind;
  firstName: string;
  taxYear: number;
  message?: string | null;
  locale?: Locale;
}): { subject: string; html: string; text: string } {
  const copy = COPY[params.locale ?? DEFAULT_LOCALE];
  const subject = copy.subjects[params.kind];

  const lines = [
    copy.greeting(params.firstName),
    "",
    `${copy.intro[params.kind]} (${params.taxYear})`,
  ];

  if (params.message?.trim()) {
    lines.push("", params.message.trim());
  }

  lines.push("", copy.cta, "", copy.signoff);

  const html = [
    `<p>${escapeHtml(copy.greeting(params.firstName))}</p>`,
    `<p>${escapeHtml(copy.intro[params.kind])} (${params.taxYear})</p>`,
    params.message?.trim()
      ? `<p style="white-space:pre-wrap">${escapeHtml(params.message.trim())}</p>`
      : "",
    `<p>${escapeHtml(copy.cta)}</p>`,
    `<p style="color:#807c72">${escapeHtml(copy.signoff)}</p>`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text: lines.join("\n") };
}
