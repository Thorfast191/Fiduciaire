/**
 * Message sent from the marketing site's contact form by an anonymous visitor.
 *
 * Always rendered in French: the recipient is the Fiduvia team. Every field
 * comes from an untrusted visitor, so all of it is escaped before it reaches
 * the HTML part, and the reply-to identity is stated in the body rather than
 * used as an envelope sender.
 */
export function publicContactEmailTemplate(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const name = `${params.firstName} ${params.lastName}`.trim();
  const subject = `[Site] Message de ${name}`;

  const text = [
    `De : ${name} <${params.email}>`,
    params.phone ? `Téléphone : ${params.phone}` : null,
    "",
    params.message,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = [
    `<p><strong>De :</strong> ${escape(name)} &lt;${escape(params.email)}&gt;</p>`,
    params.phone
      ? `<p><strong>Téléphone :</strong> ${escape(params.phone)}</p>`
      : null,
    `<p style="white-space:pre-line">${escape(params.message)}</p>`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, html, text };
}
