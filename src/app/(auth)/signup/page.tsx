"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    setLoading(false);
    if (!body.ok) {
      setError(body.error);
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(form.email)}&purpose=signup`);
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Créer mon compte</h1>
      <input placeholder="Prénom" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
      <input placeholder="Nom" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
      <input type="email" placeholder="E-mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Mot de passe" required minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>Créer mon compte</button>
    </form>
  );
}
