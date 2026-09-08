"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUS_CLASS, STATUS_ORDER } from "@/lib/dossierStatus";
import { useI18n } from "@/lib/i18n/I18nProvider";
import NotifyClient from "./NotifyClient";
import type { DossierStatus } from "@/db/schema";

export interface TableRow {
  id: string;
  taxYear: number;
  status: DossierStatus;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  documentCount: number;
}

/**
 * The mockup's admin dossier table (`Fiduvia.dc.html:3049`): a search box over
 * a bordered card whose rows carry an initials avatar, the client's name and
 * email, and an inline status control. Editing status from the row is the
 * mockup's own interaction — it replaces having to paste a dossier id into a
 * separate form.
 *
 * Search and filtering are client-side: the server already bounds the result
 * set to one tax period, which is small enough to hold in the page.
 */
export default function DossiersTable({
  rows,
  slug,
}: {
  rows: TableRow[];
  /** Prestation segment, so a row can link to its own detail page. */
  slug: string;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DossierStatus | "">("");
  const [saving, setSaving] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-CH" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [locale],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;

      return `${r.firstName} ${r.lastName} ${r.email}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, statusFilter]);

  async function changeStatus(id: string, status: DossierStatus) {
    setSaving(id);
    setFailed(null);

    try {
      const res = await fetch(`/api/dossiers/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setFailed(body?.error ?? t.admin.dossiers.errStatus);
        return;
      }

      router.refresh();
    } catch {
      setFailed(t.common.genericError);
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <div className="mt-[18px] flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.admin.dossiers.searchPlaceholder}
          aria-label={t.admin.dossiers.searchPlaceholder}
          className="h-[46px] min-w-[220px] flex-1 rounded-xl border border-line-default bg-card px-4 text-[14.5px] text-strong outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as DossierStatus | "")
          }
          aria-label={t.admin.dossiers.thStatus}
          className="h-[46px] rounded-xl border border-line-default bg-card px-4 text-[14px] text-strong outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
        >
          <option value="">{t.admin.dossiers.allStatuses}</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {t.status[s]}
            </option>
          ))}
        </select>
      </div>

      {failed ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-600/25 bg-red-100 px-4 py-3 text-sm text-red-600"
        >
          {failed}
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px] rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-3.5 border-b border-line px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
            <span className="min-w-0 flex-1">{t.admin.dossiers.thClient}</span>
            <span className="w-[230px] shrink-0">
              {t.admin.dossiers.thStatus}
            </span>
            <span className="w-[90px] shrink-0">{t.admin.dossiers.thYear}</span>
            <span className="w-[120px] shrink-0">
              {t.admin.dossiers.thReceived}
            </span>
          </div>

          {visible.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
              {rows.length === 0
                ? t.admin.dossiers.empty
                : t.admin.dossiers.noMatch}
            </p>
          ) : (
            visible.map((r) => (
              <div
                key={r.id}
                className="border-b border-line px-5 py-3.5 last:border-b-0 hover:bg-sunken/50"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex min-w-0 flex-1 items-center gap-[11px]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[12px] font-bold text-brand">
                      {(r.firstName[0] ?? "") + (r.lastName[0] ?? "")}
                    </span>

                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[14.5px] font-semibold text-strong">
                        {r.firstName} {r.lastName}
                      </span>
                      <span className="truncate text-[12.5px] text-muted">
                        {r.email}
                      </span>
                    </span>
                  </span>

                  <span className="relative w-[230px] shrink-0">
                    <select
                      value={r.status}
                      disabled={saving === r.id}
                      onChange={(e) =>
                        changeStatus(r.id, e.target.value as DossierStatus)
                      }
                      aria-label={`${t.admin.dossiers.thStatus} — ${r.firstName} ${r.lastName}`}
                      className={`w-full cursor-pointer appearance-none rounded-full border-0 py-1.5 pl-3.5 pr-8 text-[12px] font-semibold outline-none transition-opacity focus:ring-4 focus:ring-brand/15 disabled:opacity-50 ${STATUS_CLASS[r.status]}`}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {t.status[s]}
                        </option>
                      ))}
                    </select>

                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-70"
                    >
                      <path
                        d="m6 8 4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <span className="fx-figure w-[90px] shrink-0 text-[14px] text-body">
                    {r.taxYear}
                  </span>

                  <span className="fx-figure w-[120px] shrink-0 text-[13px] text-muted">
                    {dateFmt.format(new Date(r.createdAt))}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/dossiers/${slug}/${r.id}`}
                    className="rounded-lg border border-line-default px-3 py-1.5 text-[12.5px] font-medium text-brand transition hover:border-line-strong hover:bg-sunken"
                  >
                    {t.declaration.summary.open} →
                  </Link>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                      r.documentCount > 0
                        ? "bg-teal-100 text-brand"
                        : "text-subtle"
                    }`}
                    title={
                      r.documentCount > 0
                        ? `${r.documentCount} ${
                            r.documentCount === 1
                              ? t.admin.dossiers.docsUnit
                              : t.admin.dossiers.docsUnitPlural
                          }`
                        : t.admin.dossiers.docsNone
                    }
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        d="M13.5 6.5 8 12a2 2 0 0 1-2.83-2.83l5.66-5.66a3.5 3.5 0 0 1 4.95 4.95l-5.66 5.66a5 5 0 0 1-7.07-7.07l5.3-5.3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {r.documentCount > 0
                      ? `${r.documentCount} ${
                          r.documentCount === 1
                            ? t.admin.dossiers.docsUnit
                            : t.admin.dossiers.docsUnitPlural
                        }`
                      : t.admin.dossiers.docsNone}
                  </span>

                  <NotifyClient
                    dossierId={r.id}
                    clientName={`${r.firstName} ${r.lastName}`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
