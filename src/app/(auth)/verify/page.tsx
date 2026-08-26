"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const purpose = (params.get("purpose") as "login" | "signup") ?? "login";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code, purpose }),
    });
    const body = await res.json();
    setLoading(false);
    if (!body.ok) {
      setError(body.error);
      return;
    }
    router.push(body.role === "client" ? "/portal" : "/admin");
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Code de vérification</h1>
      <p>Un code a été envoyé à {email}.</p>
      <input
        placeholder="000000"
        required
        maxLength={6}
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>Valider</button>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
