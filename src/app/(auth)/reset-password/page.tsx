"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", code: "", newPassword: "" });
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    if (!body.ok) {
      setError(body.error);
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Réinitialiser le mot de passe</h1>
      <input type="email" placeholder="E-mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Code reçu par e-mail" required maxLength={6} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
      <input type="password" placeholder="Nouveau mot de passe" required minLength={10} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Réinitialiser</button>
    </form>
  );
}
