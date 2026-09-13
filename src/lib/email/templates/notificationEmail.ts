import type { NotificationKind } from "@/db/schema";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const COPY: Record<
  Locale,
  {
    subjects: Record<NotificationKind, string>;
    greeting: (name: string) => string;
    intro: Record<NotificationKind, string>;
    cta: string;
    /** Overrides `cta` for the kinds that ask nothing of the client. */
    ctaByKind: Partial<Record<NotificationKind, string>>;
    signoff: string;
    /**
     * Kinds the firm wrote itself, word for word. These are whole letters —
     * their own greeting, their own sign-off — so they replace the assembled
     * greeting / intro / call-to-action / sign-off rather than slotting into
     * it.
     */
    fullBody: Partial<
      Record<NotificationKind, (firstName: string, taxYear: number) => string[]>
    >;
  }
> = {
  fr: {
    subjects: {
      documents_requested: "Pièces complémentaires demandées — Fiduvia",
      action_required: "Action requise sur votre dossier — Fiduvia",
      dossier_completed: "Votre dossier est clôturé — Fiduvia",
      dossier_reclamation: "Réclamation déposée pour votre dossier — Fiduvia",
    },
    greeting: (name) => `Bonjour ${name},`,
    intro: {
      documents_requested:
        "Votre fiduciaire vous demande de transmettre des pièces complémentaires pour votre dossier.",
      action_required: "Votre dossier nécessite une action de votre part.",
      dossier_completed:
        "Votre déclaration a été traitée et votre dossier est désormais clôturé. Vous trouverez les documents de clôture dans votre espace.",
      dossier_reclamation:
        "Une réclamation a été ouverte sur votre dossier auprès de l'administration fiscale. Nous suivons la procédure et revenons vers vous dès que nous avons une réponse.",
    },
    cta: "Connectez-vous à votre espace client pour consulter le détail et y répondre.",
    ctaByKind: {
      dossier_completed:
        "Connectez-vous à votre espace client pour consulter et télécharger vos documents.",
      dossier_reclamation:
        "Connectez-vous à votre espace client pour suivre l'avancement.",
    },
    signoff: "Fiduvia — votre fiduciaire, entièrement en ligne.",
    fullBody: {
      dossier_completed: (firstName, taxYear) => [
        `Bonjour ${firstName},`,
        `Bonne nouvelle : votre déclaration d'impôt ${taxYear} a été finalisée et transmise à l'Administration cantonale des impôts.`,
        "Votre dossier est donc désormais clôturé de notre côté. Vous trouverez en pièce jointe (ou dans votre espace client) une copie de votre déclaration ainsi que les documents de clôture.",
        "Si l'administration fiscale vous contacte pour une pièce complémentaire, nous restons à votre disposition pour vous accompagner.",
        "Merci de votre confiance,",
        "L'équipe Fiduvia",
      ],
      dossier_reclamation: (firstName, taxYear) => [
        `Bonjour ${firstName},`,
        `Nous avons déposé la réclamation concernant votre dossier fiscal ${taxYear} auprès de l'Administration cantonale des impôts. Elle a été transmise avec succès.`,
        "Votre dossier est désormais clôturé de notre côté. Vous trouverez les documents de clôture dans votre espace client.",
        "Si l'administration revient vers vous au sujet de cette réclamation, n'hésitez pas à nous transmettre le courrier, nous vous accompagnerons.",
        "Merci de votre confiance,",
        "L'équipe Fiduvia",
      ],
    },
  },
  en: {
    subjects: {
      documents_requested: "Additional documents requested — Fiduvia",
      action_required: "Action required on your file — Fiduvia",
      dossier_completed: "Your file is closed — Fiduvia",
      dossier_reclamation: "Appeal filed for your file — Fiduvia",
    },
    greeting: (name) => `Hello ${name},`,
    intro: {
      documents_requested:
        "Your accountant is asking you to send additional documents for your file.",
      action_required: "Your file needs action from you.",
      dossier_completed:
        "Your tax return has been processed and your file is now closed. The closing documents are available in your client area.",
      dossier_reclamation:
        "An appeal has been opened on your file with the tax authority. We are following the procedure and will come back to you as soon as we hear back.",
    },
    cta: "Log in to your client area to see the details and respond.",
    ctaByKind: {
      dossier_completed:
        "Log in to your client area to view and download your documents.",
      dossier_reclamation:
        "Log in to your client area to follow its progress.",
    },
    signoff: "Fiduvia — your accounting firm, entirely online.",
    fullBody: {
      dossier_completed: (firstName, taxYear) => [
        `Hello ${firstName},`,
        `Good news: your ${taxYear} tax return has been finalised and filed with the cantonal tax administration.`,
        "Your file is therefore now closed on our side. A copy of your return and the closing documents are attached (or available in your client area).",
        "If the tax administration contacts you for an additional document, we remain at your disposal to help.",
        "Thank you for your trust,",
        "The Fiduvia team",
      ],
      dossier_reclamation: (firstName, taxYear) => [
        `Hello ${firstName},`,
        `We have filed the appeal concerning your ${taxYear} tax file with the cantonal tax administration. It was submitted successfully.`,
        "Your file is now closed on our side. The closing documents are available in your client area.",
        "If the administration comes back to you about this appeal, please forward us the letter and we will help you.",
        "Thank you for your trust,",
        "The Fiduvia team",
      ],
    },
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
  const cta = copy.ctaByKind[params.kind] ?? copy.cta;

  // A letter the firm wrote is sent as written: no assembled greeting, no
  // appended call to action, no second sign-off underneath their own.
  const written = copy.fullBody[params.kind];
  if (written) {
    const paragraphs = written(params.firstName, params.taxYear);
    return {
      subject,
      text: paragraphs.join("\n\n"),
      html: paragraphs
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("\n"),
    };
  }

  const lines = [
    copy.greeting(params.firstName),
    "",
    `${copy.intro[params.kind]} (${params.taxYear})`,
  ];

  if (params.message?.trim()) {
    lines.push("", params.message.trim());
  }

  lines.push("", cta, "", copy.signoff);

  const html = [
    `<p>${escapeHtml(copy.greeting(params.firstName))}</p>`,
    `<p>${escapeHtml(copy.intro[params.kind])} (${params.taxYear})</p>`,
    params.message?.trim()
      ? `<p style="white-space:pre-wrap">${escapeHtml(params.message.trim())}</p>`
      : "",
    `<p>${escapeHtml(cta)}</p>`,
    `<p style="color:#807c72">${escapeHtml(copy.signoff)}</p>`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text: lines.join("\n") };
}
