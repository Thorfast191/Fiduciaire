/**
 * Message a signed-in client sends from the portal's Contacts page.
 *
 * Always rendered in French: the recipient is the Fiduvia team, not the client,
 * so the sender's own locale is irrelevant. Their name and address are taken
 * from the session rather than the request body, so the form cannot be used to
 * forge a sender.
 */
export function contactEmailTemplate(params: {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const subject = `[Espace client] ${params.subject}`;

  const text = [
    `De : ${params.fromName} <${params.fromEmail}>`,
    `Sujet : ${params.subject}`,
    "",
    params.message,
  ].join("\n");

  const html = `
    <p><strong>De :</strong> ${escape(params.fromName)} &lt;${escape(params.fromEmail)}&gt;</p>
    <p><strong>Sujet :</strong> ${escape(params.subject)}</p>
    <hr />
    <p style="white-space:pre-wrap">${escape(params.message)}</p>
  `;

  return { subject, html, text };
}
