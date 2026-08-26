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
