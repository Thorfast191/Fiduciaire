import { getCurrentUser } from "@/lib/auth/guards";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Espace administrateur</h1>
      <p>
        Connecté en tant que {user?.firstName} {user?.lastName} ({user?.role}).
      </p>
      <p>
        <a href="/admin/dossiers">Gérer les dossiers fiscaux</a>
      </p>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Se déconnecter</button>
      </form>
    </main>
  );
}
