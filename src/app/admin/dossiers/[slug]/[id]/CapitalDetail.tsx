import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";
import { DocumentLink } from "./DocumentLink";
import CloseDossierButton from "./CloseDossierButton";
import { STATUS_CLASS } from "@/lib/dossierStatus";
import type { DossierStatus } from "@/db/schema";

/**
 * A capital benefit as the reference shows it to an administrator.
 *
 * Nothing like the declaration workspace: a capital dossier is one withdrawal
 * year, one canton, one flat fee and one attestation from the insurer or bank.
 * The reference gives it a header card, a three-figure strip and a single
 * document card, so that is what this renders rather than the questionnaire
 * layout the generic detail page uses.
 */
export const CAPITAL_FEE_CHF = 50;

export default function CapitalDetail({
  t,
  slug,
  dossierId,
  clientName,
  clientEmail,
  status,
  withdrawalYear,
  canton,
  attestation,
}: {
  t: Messages;
  slug: string;
  dossierId: string;
  clientName: string;
  clientEmail: string;
  status: DossierStatus;
  withdrawalYear: number;
  canton: string;
  attestation: { id: string; filename: string } | null;
}) {
  const d = t.admin.detail;

  return (
    <div className="max-w-[1040px]">
      <Link
        href={`/admin/dossiers/${slug}`}
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-strong"
      >
        ← {t.declaration.summary.backToList}
      </Link>

      <div className="mt-2.5 rounded-[18px] border border-line bg-card px-[26px] py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-[11px]">
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] bg-[#FBEFE3] text-[#B26A00]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-[22px] w-[22px]"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </span>
              <h1 className="disp text-[24px] font-bold tracking-[-0.02em]">
                {clientName}
              </h1>
            </div>

            <div className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-muted">
              <span className="flex text-subtle">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-[18px] w-[18px]"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </span>
              {clientEmail}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-[13px] py-[7px] text-[13px] font-bold ${STATUS_CLASS[status]}`}
            >
              {t.status[status]}
            </span>

            <CloseDossierButton
              dossierId={dossierId}
              closed={status === "completed"}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        <div className="min-w-[240px] flex-1 rounded-2xl border border-line bg-card px-6 py-[22px]">
          <div className="flex flex-wrap gap-9">
            <div>
              <div className="text-[12.5px] font-semibold text-muted">
                {t.admin.dossiers.thWithdrawalYear}
              </div>
              <div className="fx-figure mt-0.5 text-[22px] font-extrabold text-strong">
                {withdrawalYear}
              </div>
            </div>

            <div>
              <div className="text-[12.5px] font-semibold text-muted">
                {t.admin.dossiers.thCanton}
              </div>
              <div className="fx-figure mt-0.5 text-[22px] font-extrabold text-strong">
                {canton || "—"}
              </div>
            </div>

            <div>
              <div className="text-[12.5px] font-semibold text-muted">
                {d.capitalFeeLabel}
              </div>
              <div
                className="fx-figure mt-0.5 text-[22px] font-extrabold"
                style={{ color: "var(--brand)" }}
              >
                CHF {CAPITAL_FEE_CHF}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-[260px] flex-1 rounded-2xl border border-line bg-card px-6 py-[22px]">
          <h2 className="mb-3.5 text-[16px] font-bold text-strong">
            {d.capitalDocTitle}
          </h2>

          <div className="flex items-center gap-3.5 rounded-xl border border-line px-3.5 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-teal-100 text-brand">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="h-[22px] w-[22px]"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-semibold text-strong">
                {attestation?.filename ?? "—"}
              </div>
            </div>

            {attestation ? (
              <DocumentLink
                documentId={attestation.id}
                label={d.capitalDownloadDoc}
                variant="solid"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
