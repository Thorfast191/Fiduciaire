"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormAlert } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/I18nProvider";

interface ClientRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * The mockup's "Comptes clients" list: one row per client with, for a super
 * admin, "Passer administrateur" and "Supprimer". An ordinary admin sees the
 * list read-only — changing who can reach the admin area, and closing accounts,
 * are super-admin powers.
 */
export default function ClientAccounts({
  clients,
  canManage,
}: {
  clients: ClientRow[];
  canManage: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function promote(id: string) {
    setBusy(`promote:${id}`);
    setError(null);
    try {
      const res = await fetch("/api/admins", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setError(t.admin.users.errPromote);
        return;
      }
      router.refresh();
    } catch {
      setError(t.admin.users.errPromote);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t.admin.users.confirmDelete)) return;
    setBusy(`delete:${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(t.admin.users.errDelete);
        return;
      }
      router.refresh();
    } catch {
      setError(t.admin.users.errDelete);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {error ? (
        <div className="mt-4">
          <FormAlert variant="error">{error}</FormAlert>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        {clients.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-muted">
            {t.admin.users.noClients}
          </p>
        ) : (
          clients.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-3.5 border-b border-line px-5 py-4 last:border-b-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[14px] font-bold text-brand">
                {(c.firstName[0] ?? "") + (c.lastName[0] ?? "")}
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold text-strong">
                  {c.firstName} {c.lastName}
                </span>
                <span className="truncate text-[13.5px] text-muted">
                  {c.email}
                </span>
              </span>

              {canManage ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => promote(c.id)}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-line-strong px-3.5 py-2 text-[13.5px] font-semibold text-brand transition hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    {busy === `promote:${c.id}`
                      ? t.admin.users.promoting
                      : t.admin.users.promote}
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => remove(c.id)}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-red-600/30 px-3.5 py-2 text-[13.5px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                    {busy === `delete:${c.id}`
                      ? t.admin.users.deleting
                      : t.admin.users.deleteClient}
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </>
  );
}
