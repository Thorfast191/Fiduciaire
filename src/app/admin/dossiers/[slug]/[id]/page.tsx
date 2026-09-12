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
import { documentTitle } from "@/lib/documentTitle";
import { SLUG_TO_SERVICE, serviceLabel } from "@/lib/serviceTypes";
import { DocumentLink } from "./DocumentLink";
import DossierAdminActions from "./DossierAdminActions";
import InternalComments from "./InternalComments";
import ClosureDocuments from "./ClosureDocuments";
import NotifyClient from "../NotifyClient";
import MarkReceivedButton from "./MarkReceivedButton";
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

  const s = t.declaration.summary;
  const d = t.declaration;
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

  const clientAddress = [
    client?.street,
    [client?.postalCode, client?.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="max-w-[1040px]">
      <Link
        href={`/admin/dossiers/${slug}?periode=${access.dossier.taxYear}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-strong"
      >
        ← {s.backToList}
      </Link>

      <div className="mt-2.5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(26px,3.2vw,32px)] font-extrabold leading-[1.05]">
            {client
              ? `${client.firstName} ${client.lastName}`
              : isDeclaration
                ? s.title
                : serviceLabel(t, serviceType)}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-muted">
            {client?.email ? <span>{client.email}</span> : null}
            {client?.phone ? (
              <>
                <span className="text-line-strong">·</span>
                <span>{client.phone}</span>
              </>
            ) : null}
            {/* The postal address is collected at signup; accounts that predate
                that carry none, so the whole row is dropped rather than shown
                half-empty. */}
            {clientAddress ? (
              <>
                <span className="text-line-strong">·</span>
                <span>{clientAddress}</span>
              </>
            ) : null}
          </p>
        </div>

        <DossierAdminActions
          dossierId={id}
          slug={slug}
          status={access.dossier.status}
          reservedBy={access.dossier.reservedBy}
          reservedByName={reservedByName}
          currentAdminId={user.id}
          isSuperAdmin={user.role === "super_admin"}
          periodOptions={periodOptions}
          currentYear={access.dossier.taxYear}
        />
      </div>

      {access.dossier.status === "not_started" ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--amber-600)]/30 bg-[#FBF0DD] px-5 py-4 text-[14px] text-[#B26A00]">
          {s.notSubmitted}
        </p>
      ) : null}

      {/* The reference stacks both downloads full-width above the document
          count. The form PDF only exists for a declaration; every prestation
          can have its uploaded pieces merged. */}
      <DownloadButtons
        dossierId={id}
        clientName={client ? `${client.firstName} ${client.lastName}` : ""}
        isDeclaration={isDeclaration}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-card px-5 py-4 shadow-[var(--shadow-xs)]">
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
            clientName={
              client ? `${client.firstName} ${client.lastName}` : ""
            }
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        {/* Answers */}
        {isDeclaration ? (
          <section className="min-w-[320px] flex-[1.5]">
            <h2 className="disp text-[19px] font-bold">{s.answersTitle}</h2>

            <div className="mt-3 flex flex-col gap-3">
              {sections.map((section) => (
                <div
                  key={section.step}
                  className="rounded-[var(--radius-md)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]"
                >
                  <span className="fx-eyebrow text-[var(--text-muted)]">
                    {d.steps[section.step]}
                  </span>

                  <dl className="mt-3 flex flex-col gap-2">
                    {section.rows.map((row, i) => (
                      <div
                        key={`${row.key}-${i}`}
                        className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0"
                      >
                        <dt className="text-[13.5px] text-muted">
                          {s.labels[row.key as keyof typeof s.labels] ?? row.key}
                        </dt>
                        <dd className="m-0 max-w-[62%] text-right text-[14px] font-medium text-strong">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {section.remark ? (
                    <div className="mt-3 rounded-[var(--radius-sm)] bg-sunken px-3.5 py-3">
                      <span className="fx-eyebrow text-[var(--text-muted)]">
                        {s.remark}
                      </span>
                      <p className="mt-1 whitespace-pre-line text-[13.5px] leading-[1.5] text-body">
                        {section.remark}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Price + documents */}
        <div className="flex min-w-[300px] flex-1 flex-col gap-4">
          {isDeclaration ? (
            <section className="rounded-[var(--radius-md)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between gap-3">
                <span className="fx-eyebrow text-[var(--text-muted)]">
                  {t.admin.detail.priceTitle}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold ${
                    payment?.status === "paid"
                      ? "bg-[#E6F6EE] text-[#1F8A5B]"
                      : "bg-[#FBF0DD] text-[#B26A00]"
                  }`}
                >
                  {payment?.status === "paid"
                    ? t.admin.detail.paid
                    : t.admin.detail.pending}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {price.lines.map((line) => (
                  <div
                    key={line.key + (line.count ?? "")}
                    className="flex items-baseline justify-between gap-3 text-[14px] text-body"
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

              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <span className="text-[15px] font-semibold text-strong">
                  {d.transmission.total}
                </span>
                <span
                  className="fx-figure text-[24px] font-extrabold leading-none"
                  style={{ color: "var(--brand)" }}
                >
                  CHF {payment ? payment.amountChf : price.total}
                </span>
              </div>

              {/* Payment sits inside the tariff card and shows before a payment
                  row exists, as the reference does — an unpaid dossier reads
                  "En attente de paiement" rather than hiding the block. */}
              <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line pt-3.5">
                <span className="text-[13.5px] font-semibold text-muted">
                  {t.admin.detail.paymentStatusLabel}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold ${
                    payment?.status === "paid"
                      ? "bg-[#E6F6EE] text-[#1F8A5B]"
                      : "bg-[#FBF0DD] text-[#B26A00]"
                  }`}
                >
                  {payment?.status === "paid"
                    ? t.admin.detail.paid
                    : t.admin.detail.pending}
                </span>
              </div>

              <Link
                href="/admin/paiements"
                className="mt-3 block w-full rounded-[11px] border border-[#BFD8DC] bg-card px-4 py-2.5 text-center text-[13.5px] font-semibold text-[#145863] transition hover:bg-sunken"
              >
                {t.admin.detail.extraPayment}
              </Link>
            </section>
          ) : null}

          <section className="rounded-[var(--radius-md)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]">
            <span className="fx-eyebrow text-[var(--text-muted)]">
              {s.docsTitle}
            </span>

            <div className="mt-3 flex flex-col gap-2.5">
              {(isDeclaration ? required : clientDocs.map((doc) => doc.category)).map(
                (key) => {
                  const doc = uploaded.get(key);
                  return (
                    <div
                      key={key}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5 last:border-0 last:pb-0"
                    >
                      <span className="min-w-[150px] flex-1">
                        <span className="block text-[14px] font-medium text-strong">
                          {documentTitle(t, key)}
                        </span>
                        {doc ? (
                          <span className="mt-0.5 block text-[12px] text-muted">
                            {doc.filename}
                          </span>
                        ) : null}
                      </span>

                      {doc ? (
                        <DocumentLink
                          documentId={doc.id}
                          label={s.download}
                        />
                      ) : (
                        <span className="rounded-full bg-sunken px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
                          {s.docsMissing}
                        </span>
                      )}
                    </div>
                  );
                },
              )}

              {(isDeclaration ? required : clientDocs).length === 0 ? (
                <p className="text-[13.5px] text-muted">{s.none}</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-4">
        <ClosureDocuments
          dossierId={id}
          documents={closureDocs.map((doc) => ({
            id: doc.id,
            category: doc.category,
            filename: doc.filename,
          }))}
        />
      </div>

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
