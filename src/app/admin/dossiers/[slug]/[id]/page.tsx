import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { getT, getLocale } from "@/lib/i18n";
import { getAccessibleDossier } from "@/lib/dossiers";
import { listDocumentsForDossier } from "@/lib/documents";
import { getClientById } from "@/lib/adminUsers";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DOCUMENT_CATALOGUE,
  computePrice,
  normaliseAnswers,
  requiredDocuments,
  summariseAnswers,
} from "@/lib/declaration";
import { SLUG_TO_SERVICE, serviceLabel } from "@/lib/serviceTypes";
import { DocumentLink } from "./DocumentLink";

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
  const [{ slug, id }, user, { t }, locale] = await Promise.all([
    params,
    getCurrentUser(),
    getT(),
    getLocale(),
  ]);

  const serviceType = SLUG_TO_SERVICE[slug];
  if (!serviceType || !user) notFound();

  const access = await getAccessibleDossier(id, { id: user.id, role: user.role });
  if (!access.ok) notFound();

  const [documents, client] = await Promise.all([
    listDocumentsForDossier(id),
    getClientById(access.dossier.clientId),
  ]);

  const s = t.declaration.summary;
  const d = t.declaration;
  const answers = normaliseAnswers(access.dossier.answers);
  const price = computePrice(answers);
  const required = requiredDocuments(answers);

  const uploaded = new Map<string, (typeof documents)[number]>(
    documents.map((doc) => [doc.category, doc]),
  );

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
      independant: d.revenus.independant,
      rentier: d.revenus.rentier,
      chomage: d.revenus.chomage,
    },
    wealth: {
      epargne: d.fortune.epargne,
      titres: d.fortune.titres,
      crypto: d.fortune.crypto,
      assuranceVie: d.fortune.assuranceVie,
      immeuble: d.fortune.immeuble,
    },
  });

  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-CH" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const isDeclaration = serviceType === "declaration";

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
            {isDeclaration ? s.title : serviceLabel(t, serviceType)}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted">{s.sub}</p>
        </div>

        <StatusBadge status={access.dossier.status} />
      </div>

      {/* Who and when */}
      <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Fact label={s.client} value={client ? `${client.firstName} ${client.lastName}` : s.none} sub={client?.email} />
        <Fact label={s.period} value={String(access.dossier.taxYear)} />
        <Fact label={s.submittedOn} value={dateFmt.format(access.dossier.updatedAt)} />
      </div>

      {access.dossier.status === "not_started" ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--amber-600)]/30 bg-[#FBF0DD] px-5 py-4 text-[14px] text-[#B26A00]">
          {s.notSubmitted}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-start gap-4">
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
              <span className="fx-eyebrow text-[var(--text-muted)]">
                {s.priceTitle}
              </span>

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
                  CHF {price.total}
                </span>
              </div>
            </section>
          ) : null}

          <section className="rounded-[var(--radius-md)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]">
            <span className="fx-eyebrow text-[var(--text-muted)]">
              {s.docsTitle}
            </span>

            <div className="mt-3 flex flex-col gap-2.5">
              {(isDeclaration ? required : documents.map((doc) => doc.category)).map(
                (key) => {
                  const doc = uploaded.get(key);
                  const meta = DOCUMENT_CATALOGUE[key];
                  return (
                    <div
                      key={key}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5 last:border-0 last:pb-0"
                    >
                      <span className="min-w-[150px] flex-1">
                        <span className="block text-[14px] font-medium text-strong">
                          {meta?.title ?? key}
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

              {(isDeclaration ? required : documents).length === 0 ? (
                <p className="text-[13.5px] text-muted">{s.none}</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-card p-4 shadow-[var(--shadow-xs)]">
      <span className="fx-eyebrow text-[var(--text-muted)]">{label}</span>
      <div className="disp mt-1 text-[17px] font-bold">{value}</div>
      {sub ? <p className="mt-0.5 text-[12.5px] text-muted">{sub}</p> : null}
    </div>
  );
}
