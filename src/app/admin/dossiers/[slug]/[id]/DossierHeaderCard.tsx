"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";
import type { DossierStatus } from "@/db/schema";
import StatusMenu from "./StatusMenu";
import CloseDossierButton from "./CloseDossierButton";

interface PeriodOption {
  year: number;
  id: string;
}

/**
 * The dossier detail header, as one card.
 *
 * The reference puts everything about "who and when" in a single white card:
 * the client's name with the reservation chip beside it, a contact line that
 * ends in the tax-period switch, and on the right the status control and
 * "Clôturer le dossier". It replaces the loose action bar this page used to
 * carry above the title.
 */
export default function DossierHeaderCard({
  dossierId,
  slug,
  clientName,
  email,
  phone,
  status,
  reservedBy,
  reservedByName,
  currentAdminId,
  isSuperAdmin,
  periodOptions,
  currentYear,
  express,
}: {
  dossierId: string;
  slug: string;
  clientName: string;
  email: string;
  phone: string;
  status: DossierStatus;
  reservedBy: string | null;
  reservedByName: string | null;
  currentAdminId: string;
  isSuperAdmin: boolean;
  periodOptions: PeriodOption[];
  currentYear: number;
  express: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canRelease = reservedBy === currentAdminId || isSuperAdmin;
  const firstName = (reservedByName ?? "").trim().split(/\s+/)[0] ?? "";

  async function reserve(claim: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/reserve`, {
        method: claim ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
        return;
      }
      router.refresh();
    } catch {
      setError(t.common.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2.5 rounded-[18px] border border-line bg-card px-[26px] py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="disp text-[24px] font-bold tracking-[-0.02em]">
              {clientName}
            </h1>

            {express ? (
              <span className="inline-flex items-center rounded-full bg-[#FBE7E4] px-2.5 py-1 text-[11.5px] font-bold text-[#C0453B]">
                {t.admin.dossiers.expressBadge}
              </span>
            ) : null}

            {reservedBy ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-[#EFEAFB] px-2.5 py-1 text-[12.5px] font-bold text-[#6B4FC0]">
                  {t.admin.dossiers.reservedByOther.replace("{name}", firstName)}
                </span>
                {canRelease ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => reserve(false)}
                    className="ml-0.5 text-[13px] font-semibold text-muted underline transition hover:text-strong disabled:opacity-60"
                  >
                    {t.admin.dossiers.release}
                  </button>
                ) : null}
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => reserve(true)}
                className="rounded-[9px] border border-[#CCC8BD] bg-card px-3 py-[5px] text-[13px] font-semibold text-[#145863] transition hover:border-brand disabled:opacity-60"
              >
                {t.admin.dossiers.reserve}
              </button>
            )}
          </div>

          <div className="mt-[7px] flex flex-wrap items-center gap-2">
            {email ? (
              <span className="inline-flex items-center gap-1.5 text-[14px] text-muted">
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
                {email}
              </span>
            ) : null}

            {email && phone ? (
              <span className="text-line-strong">·</span>
            ) : null}

            {phone ? (
              <span className="inline-flex items-center gap-1.5 text-[14px] text-muted">
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
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 11a16 16 0 0 0 6 6l1.6-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
                  </svg>
                </span>
                {phone}
              </span>
            ) : null}

            {periodOptions.length > 0 ? (
              <>
                {email || phone ? (
                  <span className="text-line-strong">·</span>
                ) : null}
                <span className="text-[13.5px] font-semibold text-body">
                  {t.admin.detail.periodLabel}
                </span>
                <select
                  value={currentYear}
                  aria-label={t.admin.detail.periodLabel}
                  onChange={(e) => {
                    const opt = periodOptions.find(
                      (o) => o.year === Number(e.target.value),
                    );
                    if (opt) router.push(`/admin/dossiers/${slug}/${opt.id}`);
                  }}
                  className="cursor-pointer rounded-lg border border-line-default bg-card py-[5px] pl-[11px] pr-7 text-[13.5px] font-semibold text-strong outline-none hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
                >
                  {periodOptions.map((o) => (
                    <option key={o.id} value={o.year}>
                      {o.year}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-subtle">
              {t.admin.detail.statusLabel}
            </span>
            <StatusMenu dossierId={dossierId} status={status} />
          </div>

          <CloseDossierButton
            dossierId={dossierId}
            closed={status === "completed"}
            compact
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
