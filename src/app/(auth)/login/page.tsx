"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
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
    router.push(`/verify?email=${encodeURIComponent(form.email)}&purpose=login`);
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Se connecter</h1>
      <input type="email" placeholder="E-mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Mot de passe" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>Se connecter</button>
      <p><a href="/forgot-password">Mot de passe oublié ?</a></p>
    </form>
  );
}
