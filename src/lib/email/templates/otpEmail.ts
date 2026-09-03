import type { OtpPurpose } from "@/db/schema";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const COPY: Record<
  Locale,
  { subjects: Record<OtpPurpose, string>; intro: string; expiry: string }
> = {
  fr: {
    subjects: {
      login: "Votre code de connexion Fiduvia",
      signup: "Confirmez votre compte Fiduvia",
      password_reset: "Réinitialisation de votre mot de passe Fiduvia",
    },
    intro: "Votre code de vérification Fiduvia est :",
    expiry:
      "Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
  },
  en: {
    subjects: {
      login: "Your Fiduvia login code",
      signup: "Confirm your Fiduvia account",
      password_reset: "Reset your Fiduvia password",
    },
    intro: "Your Fiduvia verification code is:",
    expiry:
      "This code expires in 10 minutes. If you did not request it, please ignore this email.",
  },
};

export function otpEmailTemplate(params: {
  code: string;
  purpose: OtpPurpose;
  locale?: Locale;
}): { subject: string; html: string; text: string } {
  const copy = COPY[params.locale ?? DEFAULT_LOCALE];

  const subject = copy.subjects[params.purpose];
  const text = `${copy.intro} ${params.code}\n\n${copy.expiry}`;
  const html = `
    <p>${copy.intro}</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:4px">${params.code}</p>
    <p>${copy.expiry}</p>
  `;

  return { subject, html, text };
}
