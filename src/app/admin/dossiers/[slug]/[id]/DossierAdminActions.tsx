"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_CLASS, STATUS_ORDER } from "@/lib/dossierStatus";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DossierStatus } from "@/db/schema";

interface PeriodOption {
  year: number;
  id: string;
}

/**
 * The admin dossier detail header controls, matching the mockup: the "Réservé
 * par / Libérer" pill, a tax-period switch across the client's dossiers, an
 * inline status dropdown, and "Clôturer le dossier" with a confirmation.
 */
export default function DossierAdminActions({
  dossierId,
  slug,
  status,
  reservedBy,
  reservedByName,
  currentAdminId,
  isSuperAdmin,
  periodOptions,
  currentYear,
}: {
  dossierId: string;
  slug: string;
  status: DossierStatus;
  reservedBy: string | null;
  reservedByName: string | null;
  currentAdminId: string;
  isSuperAdmin: boolean;
  periodOptions: PeriodOption[];
  currentYear: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mine = reservedBy === currentAdminId;
  const canRelease = mine || isSuperAdmin;
  const firstName = (reservedByName ?? "").trim().split(/\s+/)[0] ?? "";

  async function reserve(reserveIt: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/reserve`, {
        method: reserveIt ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
        return;
      }
      router.refresh();
    } catch {
      setError(t.admin.detail.errAction);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(next: DossierStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
        return;
      }
      setConfirmClose(false);
      router.refresh();
    } catch {
      setError(t.admin.detail.errAction);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Reservation */}
        {!reservedBy ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => reserve(true)}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CCC8BD] bg-card px-3 py-1.5 text-[13px] font-semibold text-[#145863] transition hover:bg-sunken disabled:opacity-60"
          >
            {t.admin.dossiers.reserve}
          </button>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#EFEAFB] px-3 py-1.5 text-[12.5px] font-bold text-[#6B4FC0]">
              {t.admin.dossiers.reservedByOther.replace("{name}", firstName)}
            </span>
            {canRelease ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => reserve(false)}
                className="text-[13px] font-semibold text-muted underline transition hover:text-strong disabled:opacity-60"
              >
                {t.admin.dossiers.release}
              </button>
            ) : null}
          </span>
        )}

        {/* Tax period switch across this client's dossiers */}
        {periodOptions.length > 1 ? (
          <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-body">
            {t.admin.detail.periodLabel}
            <select
              value={currentYear}
              onChange={(e) => {
                const opt = periodOptions.find(
                  (o) => o.year === Number(e.target.value),
                );
                if (opt) router.push(`/admin/dossiers/${slug}/${opt.id}`);
              }}
              className="rounded-lg border border-line-default bg-card px-3 py-1.5 text-[13px] font-semibold text-strong outline-none hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
            >
              {periodOptions.map((o) => (
                <option key={o.id} value={o.year}>
                  {o.year}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted">
          {t.admin.detail.statusLabel}
          <select
            value={status}
            disabled={busy}
            onChange={(e) => changeStatus(e.target.value as DossierStatus)}
            className={`cursor-pointer appearance-none rounded-[10px] border-0 px-3 py-2 text-[13px] font-bold outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-50 ${STATUS_CLASS[status]}`}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {t.status[s]}
              </option>
            ))}
          </select>
        </label>

        {status !== "completed" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmClose(true)}
            className="rounded-[10px] bg-brand px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
          >
            {t.admin.detail.close}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-[13px] text-red-600">
          {error}
        </p>
      ) : null}

      {confirmClose ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,21,38,0.5)] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[420px] rounded-[20px] bg-card p-7 text-center shadow-[0_40px_90px_-30px_rgba(13,21,38,0.6)]">
            <h2 className="text-[19px] font-bold text-strong">
              {t.admin.detail.closeConfirmTitle}
            </h2>
            <p className="mt-2 text-[14.5px] leading-[1.55] text-muted">
              {t.admin.detail.closeConfirmBody}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmClose(false)}
                className="flex-1 rounded-[11px] border border-line-default bg-card px-3 py-3 text-[15px] font-semibold text-body transition hover:bg-sunken disabled:opacity-60"
              >
                {t.admin.detail.closeNo}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => changeStatus("completed")}
                className="flex-1 rounded-[11px] bg-brand px-3 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
              >
                {busy ? t.admin.detail.closing : t.admin.detail.closeYes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
