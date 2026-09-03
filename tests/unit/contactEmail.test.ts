import { describe, it, expect } from "vitest";
import { contactEmailTemplate } from "@/lib/email/templates/contactEmail";

describe("contactEmailTemplate", () => {
  it("carries the sender, subject and message into both bodies", () => {
    const mail = contactEmailTemplate({
      fromName: "Camille Rochat",
      fromEmail: "camille@exemple.ch",
      subject: "Question sur mes acomptes",
      message: "Bonjour,\nune question.",
    });

    expect(mail.subject).toBe("[Espace client] Question sur mes acomptes");
    expect(mail.text).toContain("Camille Rochat");
    expect(mail.text).toContain("camille@exemple.ch");
    expect(mail.text).toContain("une question.");
    expect(mail.html).toContain("Camille Rochat");
  });

  it("escapes HTML so a message cannot inject markup into the email", () => {
    const mail = contactEmailTemplate({
      fromName: "<b>X</b>",
      fromEmail: "x@example.test",
      subject: "a & b",
      message: '<script>alert("x")</script>',
    });

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("&lt;b&gt;X&lt;/b&gt;");
    expect(mail.html).toContain("a &amp; b");

    // The plain-text part is not markup, so it keeps the original characters.
    expect(mail.text).toContain('<script>alert("x")</script>');
  });
});
