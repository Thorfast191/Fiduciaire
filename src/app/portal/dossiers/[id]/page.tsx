import DossierDetail from "./DossierDetail";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main style={{ maxWidth: 700, margin: "60px auto", fontFamily: "sans-serif" }}>
      <p>
        <a href="/portal">← Retour à mes dossiers</a>
      </p>
      <DossierDetail dossierId={id} />
    </main>
  );
}
