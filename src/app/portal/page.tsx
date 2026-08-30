import { getCurrentUser } from "@/lib/auth/guards";
import DocumentsPanel from "./DocumentsPanel";

export default async function PortalHomePage() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Mon espace client</h1>
      <p>Connecté en tant que {user?.firstName} {user?.lastName} ({user?.email}).</p>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Se déconnecter</button>
      </form>
      <DocumentsPanel />
    </main>
  );
}
