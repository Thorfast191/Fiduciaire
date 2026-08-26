"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  }

  if (sent) {
    return <p>Si un compte existe avec cette adresse, un code de réinitialisation a été envoyé.</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Mot de passe oublié</h1>
      <input type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Envoyer le code</button>
    </form>
  );
}
