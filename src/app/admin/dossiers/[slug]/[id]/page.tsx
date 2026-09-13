import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { getT } from "@/lib/i18n";
import {
  getAccessibleDossier,
  getDossierPayment,
  listDossiersForClient,
} from "@/lib/dossiers";
import { listDocumentsForDossier } from "@/lib/documents";
import { listComments } from "@/lib/comments";
import { getClientById } from "@/lib/adminUsers";
import { CLOSURE_CATEGORIES } from "@/lib/documentCategories";
import {
  computePrice,
  normaliseAnswers,
  requiredDocuments,
  summariseAnswers,
} from "@/lib/declaration";
import { SLUG_TO_SERVICE } from "@/lib/serviceTypes";
import InternalComments from "./InternalComments";
import ClosureDocuments from "./ClosureDocuments";
import NotifyClient from "../NotifyClient";
import MarkReceivedButton from "./MarkReceivedButton";
import DossierHeaderCard from "./DossierHeaderCard";
import CapitalDetail from "./CapitalDetail";
import SimulationDetail from "./SimulationDetail";
import DownloadButtons from "./DownloadButtons";

/**
 * What the firm receives when a client submits.
 *
 * The questionnaire writes answers, derives a document list and computes a
 * price; until this screen existed none of that was readable by an
 * administrator, so a submitted declaration had to be chased by telephone.
 * Everything here is already stored — this is a read surface.
 */
export default async function AdminDossierDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const [{ slug, id }, user, { t }] = await Promise.all([
    params,
    getCurrentUser(),
    getT(),
  ]);

  const serviceType = SLUG_TO_SERVICE[slug];
  if (!serviceType || !user) notFound();

  const access = await getAccessibleDossier(id, { id: user.id, role: user.role });
  if (!access.ok) notFound();

  // An ordinary admin may only open a dossier assigned to them; the super admin
  // opens any. A mismatch reads as "not found" rather than a forbidden page.
  if (user.role === "admin" && access.dossier.reservedBy !== user.id) {
    notFound();
  }

  const [documents, client, siblings, payment, comments, reserver] =
    await Promise.all([
      listDocumentsForDossier(id),
      getClientById(access.dossier.clientId),
      listDossiersForClient(access.dossier.clientId, serviceType),
      getDossierPayment(id),
      listComments(id),
      access.dossier.reservedBy
        ? getClientById(access.dossier.reservedBy)
        : Promise.resolve(undefined),
    ]);

  const isClosure = (cat: string): boolean =>
    (CLOSURE_CATEGORIES as readonly string[]).includes(cat);
  const closureDocs = documents.filter((doc) => isClosure(doc.category));

  const periodOptions = siblings.map((row) => ({
    year: row.taxYear,
    id: row.id,
  }));
  const reservedByName = reserver
    ? `${reserver.firstName} ${reserver.lastName}`.trim()
    : null;

  const d = t.declaration;
  const clientName = client
    ? `${client.firstName} ${client.lastName}`.trim()
    : "—";
  // Simulation and capital answers are written straight into the JSONB by the
  // portal forms; they are not part of the declaration `Answers` shape.
  const raw = (access.dossier.answers ?? {}) as Record<string, unknown>;
  const str = (key: string): string => {
    const v = raw[key];
    return v == null || v === "" ? "" : String(v);
  };

  // ---- Capital: the reference replaces the workspace with its own card ----
  if (serviceType === "capital") {
    const attestation = documents.find(
      (doc) => doc.category === "attestationCapital",
    );
    return (
      <CapitalDetail
        t={t}
        slug={slug}
        dossierId={id}
        clientName={clientName}
        clientEmail={client?.email ?? ""}
        status={access.dossier.status}
        withdrawalYear={Number(str("retraitYear")) || access.dossier.taxYear}
        canton={str("canton")}
        attestation={
          attestation
            ? { id: attestation.id, filename: attestation.filename }
            : null
        }
      />
    );
  }

  // ---- Simulation: figures, not documents; a read-only card ----
  if (serviceType === "simulation") {
    const chf = (key: string): string => {
      const v = str(key);
      if (!v) return "—";
      const n = Number(v);
      return Number.isNaN(n) ? v : `CHF ${n.toLocaleString("fr-CH")}`;
    };
    const marital = str("etatCivil");
    const maritalLabel =
      marital && marital in t.declaration.famille
        ? (t.declaration.famille as unknown as Record<string, string>)[marital]
        : "—";
    const owner = str("simProprietaire") === "true" || raw.simProprietaire === true;
    const properties = Array.isArray(raw.simImmeubles)
      ? (raw.simImmeubles as unknown[])
      : [];
    const c = t.admin.detail.simuCells;

    return (
      <SimulationDetail
        t={t}
        slug={slug}
        dossierId={id}
        clientName={clientName}
        clientEmail={client?.email ?? ""}
        status={access.dossier.status}
        express={raw.express === true || str("express") === "true"}
        cells={[
          { label: t.admin.dossiers.thCanton, value: str("canton") || "—" },
          {
            label: t.admin.dossiers.thReceived,
            value: new Intl.DateTimeFormat("fr-CH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(access.dossier.createdAt),
          },
          { label: c.etatCivil, value: maritalLabel },
          { label: c.enfants, value: str("simChildren") || "0" },
          { label: c.totalRevenus, value: chf("simRevenus") },
          { label: c.totalFortune, value: chf("simFortune") },
          { label: c.proprietaire, value: owner ? d.yes : d.no },
          {
            label: c.immeubles,
            value: owner ? String(properties.length) : "—",
          },
        ]}
        deductions={str("simDeductions")}
      />
    );
  }

  const s = t.declaration.summary;
  const answers = normaliseAnswers(access.dossier.answers);
  const price = computePrice(answers);
  const required = requiredDocuments(answers);

  const uploaded = new Map<string, (typeof documents)[number]>(
    documents.map((doc) => [doc.category, doc]),
  );

  // "Documents reçus N / N" — for a declaration, how many required pieces have
  // arrived; for other prestations, how many (non-closure) files were uploaded.
  const clientDocs = documents.filter((doc) => !isClosure(doc.category));
  const docsTotal = serviceType === "declaration" ? required.length : clientDocs.length;
  const docsReceived =
    serviceType === "declaration"
      ? required.filter((k) => uploaded.has(k)).length
      : clientDocs.length;

  const sections = summariseAnswers(answers, {
    yes: d.yes,
    no: d.no,
    none: s.none,
    situations: d.situations as unknown as Record<string, string>,
    marital: {
      celibataire: d.famille.celibataire,
      marie: d.famille.marie,
      partenariat: d.famille.partenariat,
      divorce: d.famille.divorce,
      veuf: d.famille.veuf,
    },
    income: {
      salarie: d.revenus.salarie,
      etudiant: d.revenus.etudiant,
      independant: d.revenus.independant,
      rentier: d.revenus.rentier,
      chomage: d.revenus.chomage,
      autre: d.revenus.autre,
    },
    wealth: {
      epargne: d.fortune.epargne,
      titres: d.fortune.titres,
      crypto: d.fortune.crypto,
      assuranceVie: d.fortune.assuranceVie,
      immeuble: d.fortune.immeuble,
      aucun: d.fortune.aucun,
    },
  });

  const isDeclaration = serviceType === "declaration";

  // The reference does not print the questionnaire on this page — the answers
  // live in "Télécharger le formulaire (PDF)". What it does surface is the
  // client's free-text remark from each page, as "Commentaires du client".
  const clientRemarks = sections
    .filter((section) => section.remark)
    .map((section) => ({
      page: d.steps[section.step],
      text: section.remark as string,
    }));

  return (
    <div className="max-w-[1040px]">
      <Link
        href={`/admin/dossiers/${slug}?periode=${access.dossier.taxYear}`}
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-strong"
      >
        ← {s.backToList}
      </Link>

      <DossierHeaderCard
        dossierId={id}
        slug={slug}
        clientName={clientName}
        email={client?.email ?? ""}
        phone={client?.phone ?? ""}
        status={access.dossier.status}
        reservedBy={access.dossier.reservedBy}
        reservedByName={reservedByName}
        currentAdminId={user.id}
        isSuperAdmin={user.role === "super_admin"}
        periodOptions={periodOptions}
        currentYear={access.dossier.taxYear}
        express={answers.express === true}
      />

      {access.dossier.status === "not_started" ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--amber-600)]/30 bg-[#FBF0DD] px-5 py-4 text-[14px] text-[#B26A00]">
          {s.notSubmitted}
        </p>
      ) : null}

      {/* The reference stacks both downloads full-width under the header. The
          form PDF only exists for a declaration; every prestation can have its
          uploaded pieces merged. */}
      <DownloadButtons
        dossierId={id}
        clientName={clientName}
        isDeclaration={isDeclaration}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card px-6 py-[18px]">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-[16px] font-bold text-strong">
            {t.admin.detail.docsReceived}
          </h2>
          <span className="fx-figure text-[14px] text-muted">
            {docsReceived} / {docsTotal}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {access.dossier.status !== "documents_received" &&
          access.dossier.status !== "completed" ? (
            <MarkReceivedButton dossierId={id} />
          ) : null}

          <NotifyClient
            dossierId={id}
            clientName={clientName}
            disabled={access.dossier.status === "completed"}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        {isDeclaration ? (
          <section className="min-w-[240px] flex-1 rounded-2xl border border-line bg-card px-6 py-[22px]">
            <div className="mb-3.5 flex items-center justify-between gap-2.5">
              <h2 className="text-[16px] font-bold text-strong">
                {t.admin.detail.priceTitle}
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-[11px] py-[5px] text-[12px] font-bold ${
                  payment?.status === "paid"
                    ? "bg-[#E6F6EE] text-[#1F8A5B]"
                    : "bg-[#FBF0DD] text-[#B26A00]"
                }`}
              >
                {payment?.status === "paid"
                  ? t.admin.detail.paid
                  : t.admin.detail.pendingPayment}
              </span>
            </div>

            <div className="flex flex-col gap-[9px]">
              {price.lines.map((line) => (
                <div
                  key={line.key + (line.count ?? "")}
                  className="flex justify-between gap-3 text-[14px] text-body"
                >
                  <span>
                    {d.price[line.key as keyof typeof d.price]}
                    {line.count && line.count > 1 ? ` × ${line.count}` : ""}
                  </span>
                  <span className="fx-figure whitespace-nowrap font-semibold">
                    CHF {line.amount}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-3.5 h-px bg-line" />

            <div className="flex items-baseline justify-between gap-3">
              <span className="font-bold text-strong">
                {d.transmission.total}
              </span>
              <span
                className="fx-figure text-[22px] font-extrabold leading-none"
                style={{ color: "var(--brand)" }}
              >
                CHF {payment ? payment.amountChf : price.total}
              </span>
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-line pt-3.5">
              <span className="text-[13.5px] font-semibold text-muted">
                {t.admin.detail.paymentStatusLabel}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-[11px] py-[5px] text-[12px] font-bold ${
                  payment?.status === "paid"
                    ? "bg-[#E6F6EE] text-[#1F8A5B]"
                    : "bg-[#FBF0DD] text-[#B26A00]"
                }`}
              >
                {payment?.status === "paid"
                  ? t.admin.detail.paid
                  : t.admin.detail.pendingPayment}
              </span>
            </div>

            <Link
              href="/admin/paiements"
              className="mt-3 block w-full rounded-[11px] border border-[#BFD8DC] bg-card px-3.5 py-[11px] text-center text-[14px] font-semibold text-[#145863] transition hover:bg-sunken"
            >
              {t.admin.detail.extraPayment}
            </Link>
          </section>
        ) : null}

        <div className="min-w-[260px] flex-1">
          <ClosureDocuments
            dossierId={id}
            documents={closureDocs.map((doc) => ({
              id: doc.id,
              category: doc.category,
              filename: doc.filename,
            }))}
          />
        </div>
      </div>

      {clientRemarks.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-line bg-card px-6 py-[22px]">
          <h2 className="mb-3 text-[16px] font-bold text-strong">
            {t.admin.detail.clientCommentsTitle}
          </h2>
          <div className="flex flex-col gap-2.5">
            {clientRemarks.map((remark) => (
              <div
                key={remark.page}
                className="rounded-xl border border-line px-3.5 py-3"
              >
                <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-subtle">
                  {remark.page}
                </div>
                <p className="mt-1.5 whitespace-pre-line text-[14.5px] leading-[1.5] text-strong">
                  {remark.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <InternalComments
        dossierId={id}
        comments={comments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          authorName: c.authorName,
        }))}
      />
    </div>
  );
}
