"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main style={{ maxWidth: 600, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Une erreur est survenue</h1>
      <p>Veuillez réessayer ou revenir à l'accueil. Notre équipe a été informée.</p>
    </main>
  );
}
