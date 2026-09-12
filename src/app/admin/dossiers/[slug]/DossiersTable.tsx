"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_CLASS, STATUS_ORDER } from "@/lib/dossierStatus";
import { useI18n } from "@/lib/i18n/I18nProvider";
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
  reservedBy: string | null;
  reservedByName: string | null;
  canton: string;
  express: boolean;
  situation: string;
}

/** First name only — how the mockup labels a reservation ("Réservé par Veasna"). */
function firstNameOf(fullName: string | null): string {
  return (fullName ?? "").trim().split(/\s+/)[0] ?? "";
}

/**
 * The mockup's admin dossier table: a search box over a bordered card whose rows
 * carry an initials avatar, the client's name and email, an inline status
 * control, a canton, and — the heart of the admin space — a "Réservé par"
 * column. A free dossier shows "Réserver"; a claimed one shows who holds it,
 * and the holder (or any super admin) can release it. A "Réservé par" filter
 * narrows the list to one agent, or to the unassigned ones.
 *
 * Search and filtering are client-side: the server already bounds the result
 * set to one tax period, which is small enough to hold in the page.
 */
/**
 * The pill under a client's name. Anything other than the five known
 * situations falls back to "Normale", which is what an unanswered declaration
 * amounts to.
 */
const SITUATION_KEYS = [
  "standard",
  "arrivee",
  "taxation_office",
  "deces",
  "depart",
] as const;

export default function DossiersTable({
  rows,
  slug,
  currentAdminId,
  isSuperAdmin,
  assignableAdmins = [],
}: {
  rows: TableRow[];
  /** Prestation segment, so a row can link to its own detail page. */
  slug: string;
  /** The signed-in admin, so a row knows whether it can release its reservation. */
  currentAdminId: string;
  /** Super admins may release or reassign any colleague's reservation. */
  isSuperAdmin: boolean;
  /** The admins a super admin can assign a dossier to (empty for ordinary admins). */
  assignableAdmins?: { id: string; name: string }[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();

  const situationLabel = (key: string) => {
    const known = (SITUATION_KEYS as readonly string[]).includes(key)
      ? (key as (typeof SITUATION_KEYS)[number])
      : "standard";
    return t.declaration.situations[known];
  };

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DossierStatus | "">("");
  const [reservedFilter, setReservedFilter] = useState<string>("");
  const [saving, setSaving] = useState<string | null>(null);
  const [reserving, setReserving] = useState<string | null>(null);
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

  // The reservers present in this list, for the "Réservé par" filter — id keyed
  // so two admins who share a first name never collapse into one option.
  const reservers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) {
      if (r.reservedBy && !seen.has(r.reservedBy)) {
        seen.set(r.reservedBy, firstNameOf(r.reservedByName));
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (reservedFilter === "__none__" && r.reservedBy) return false;
      if (
        reservedFilter &&
        reservedFilter !== "__none__" &&
        r.reservedBy !== reservedFilter
      )
        return false;
      if (!q) return true;

      return `${r.firstName} ${r.lastName} ${r.email}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, statusFilter, reservedFilter]);

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

  async function toggleReservation(id: string, reserve: boolean) {
    setReserving(id);
    setFailed(null);

    try {
      const res = await fetch(`/api/dossiers/${id}/reserve`, {
        method: reserve ? "POST" : "DELETE",
      });

      if (!res.ok) {
        setFailed(t.admin.dossiers.errReserve);
        return;
      }

      router.refresh();
    } catch {
      setFailed(t.common.genericError);
    } finally {
      setReserving(null);
    }
  }

  // Super admin assigning a dossier to a specific admin ("" = unassign).
  async function assign(id: string, adminId: string) {
    setReserving(id);
    setFailed(null);

    try {
      const res = adminId
        ? await fetch(`/api/dossiers/${id}/reserve`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ adminId }),
          })
        : await fetch(`/api/dossiers/${id}/reserve`, { method: "DELETE" });

      if (!res.ok) {
        setFailed(t.admin.dossiers.errReserve);
        return;
      }

      router.refresh();
    } catch {
      setFailed(t.common.genericError);
    } finally {
      setReserving(null);
    }
  }

  const selectCls =
    "h-[46px] rounded-xl border border-line-default bg-card px-4 text-[14px] text-strong outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10";

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
          onChange={(e) => setStatusFilter(e.target.value as DossierStatus | "")}
          aria-label={t.admin.dossiers.thStatus}
          className={selectCls}
        >
          <option value="">{t.admin.dossiers.allStatuses}</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {t.status[s]}
            </option>
          ))}
        </select>

        <select
          value={reservedFilter}
          onChange={(e) => setReservedFilter(e.target.value)}
          aria-label={t.admin.dossiers.reservedFilterLabel}
          className={selectCls}
        >
          <option value="">{t.admin.dossiers.filterAllReservers}</option>
          {reservers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
          <option value="__none__">{t.admin.dossiers.filterUnreserved}</option>
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
        <div className="min-w-[900px] rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-3.5 border-b border-line px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
            <span className="min-w-0 flex-1">{t.admin.dossiers.thClient}</span>
            <span className="w-[200px] shrink-0">
              {t.admin.dossiers.thStatus}
            </span>
            <span className="w-[160px] shrink-0">
              {t.admin.dossiers.thReservedBy}
            </span>
            {/* Date before canton, as the reference orders them. */}
            <span className="w-[110px] shrink-0">
              {t.admin.dossiers.thReceived}
            </span>
            <span className="w-[70px] shrink-0">{t.admin.dossiers.thCanton}</span>
          </div>

          {visible.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
              {rows.length === 0
                ? t.admin.dossiers.empty
                : t.admin.dossiers.noMatch}
            </p>
          ) : (
            visible.map((r) => {
              const mine = r.reservedBy === currentAdminId;
              const canRelease = mine || isSuperAdmin;

              return (
                <div
                  key={r.id}
                  role="link"
                  tabIndex={0}
                  onClick={(e) => {
                    // The row opens the dossier, as in the reference. Clicks
                    // that land on the status or reservation control are that
                    // control's, not the row's.
                    if (
                      (e.target as HTMLElement).closest(
                        "select, button, a, input, label",
                      )
                    ) {
                      return;
                    }
                    router.push(`/admin/dossiers/${slug}/${r.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/admin/dossiers/${slug}/${r.id}`);
                    }
                  }}
                  className="cursor-pointer border-b border-line px-5 py-3.5 last:border-b-0 hover:bg-sunken/50 focus:bg-sunken/50 focus:outline-none"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex min-w-0 flex-1 items-center gap-[11px]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[12px] font-bold text-brand">
                        {(r.firstName[0] ?? "") + (r.lastName[0] ?? "")}
                      </span>

                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[14.5px] font-semibold text-strong">
                          {r.firstName} {r.lastName}
                        </span>
                        {/* The declaration's situation, as the reference shows
                            it under the name in place of the email. */}
                        <span className="max-w-full self-start truncate rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-teal-700">
                          {situationLabel(r.situation)}
                        </span>
                      </span>
                    </span>

                    <span className="relative w-[200px] shrink-0">
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

                    <span className="w-[160px] shrink-0">
                      {isSuperAdmin && assignableAdmins.length > 0 ? (
                        <select
                          value={r.reservedBy ?? ""}
                          disabled={reserving === r.id}
                          onChange={(e) => assign(r.id, e.target.value)}
                          aria-label={t.admin.dossiers.thReservedBy}
                          className="w-full cursor-pointer rounded-[9px] border border-line-default bg-card px-2.5 py-1.5 text-[12.5px] font-semibold text-strong outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
                        >
                          <option value="">
                            {t.admin.dossiers.filterUnreserved}
                          </option>
                          {assignableAdmins.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      ) : !r.reservedBy ? (
                        <button
                          type="button"
                          disabled={reserving === r.id}
                          onClick={() => toggleReservation(r.id, true)}
                          className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#CCC8BD] bg-card px-3 py-1.5 text-[12.5px] font-semibold text-[#145863] transition hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M5 3h14a2 2 0 0 1 2 2v16l-9-4-9 4V5a2 2 0 0 1 2-2z" />
                          </svg>
                          {reserving === r.id
                            ? t.admin.dossiers.reserving
                            : t.admin.dossiers.reserve}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canRelease || reserving === r.id}
                          onClick={() =>
                            canRelease && toggleReservation(r.id, false)
                          }
                          title={canRelease ? t.admin.dossiers.release : undefined}
                          className={`inline-flex max-w-full items-center truncate rounded-full bg-[#EFEAFB] px-3 py-1.5 text-[12px] font-bold text-[#6B4FC0] ${
                            canRelease
                              ? "cursor-pointer hover:brightness-95"
                              : "cursor-default"
                          } disabled:opacity-60`}
                        >
                          {t.admin.dossiers.reservedByOther.replace(
                            "{name}",
                            firstNameOf(r.reservedByName),
                          )}
                        </button>
                      )}
                    </span>

                    <span className="flex w-[110px] shrink-0 flex-col gap-1">
                      <span className="fx-figure text-[13px] text-muted">
                        {dateFmt.format(new Date(r.createdAt))}
                      </span>
                      {r.express ? (
                        <span className="inline-flex w-fit items-center rounded-full bg-[#FBE7E4] px-2 py-0.5 text-[10.5px] font-bold text-[#C0453B]">
                          {t.admin.dossiers.expressBadge}
                        </span>
                      ) : null}
                    </span>

                    <span className="w-[70px] shrink-0 text-[13px] font-medium text-body">
                      {r.canton || "—"}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
