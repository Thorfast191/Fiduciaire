"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";

interface Period {
  year: number;
  isActive: boolean;
}

export default function PeriodsManager({
  periods,
  nextYear,
}: {
  periods: Period[];
  nextYear: number;
}) {
  const t = useT();
  const router = useRouter();

  const [busy, setBusy] = useState<number | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(
    method: "POST" | "PATCH",
    body: Record<string, unknown>,
    key: number | "create",
  ) {
    setBusy(key);
    setError(null);

    try {
      const res = await fetch("/api/tax-periods", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error ?? t.common.genericError);
        return;
      }

      router.refresh();
    } catch {
      setError(t.common.genericError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="disp text-[17px] font-bold">
            {t.admin.periods.cardTitle}
          </h2>

          <p className="mt-1 text-[13px] text-muted">
            {t.admin.periods.cardSub}
          </p>
        </div>

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => send("POST", { year: nextYear }, "create")}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-100 px-4 py-2.5 text-[14px] font-semibold text-brand transition-colors hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "create"
            ? t.admin.periods.working
            : `${t.admin.periods.create} ${nextYear}`}
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-600/25 bg-red-100 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        {periods.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">
            {t.admin.periods.empty}
          </p>
        ) : (
          periods.map((p) => (
            <div
              key={p.year}
              className="flex items-center gap-4 rounded-xl border border-line px-4 py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-teal-50 text-brand">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="h-[18px] w-[18px]"
                  aria-hidden="true"
                >
                  <rect x="4" y="6" width="16" height="14" rx="2" />
                  <path d="M4 10h16M9 3v4M15 3v4" />
                </svg>
              </span>

              <span className="disp flex-1 text-[19px] font-bold">
                {p.year}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  p.isActive
                    ? "bg-green-100 text-green-600"
                    : "bg-sunken text-muted"
                }`}
              >
                {p.isActive ? t.admin.periods.active : t.admin.periods.inactive}
              </span>

              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  send("PATCH", { year: p.year, isActive: !p.isActive }, p.year)
                }
                className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  p.isActive
                    ? "border-red-600/30 text-red-600 hover:bg-red-100"
                    : "border-line-default text-brand hover:bg-sunken"
                }`}
              >
                {busy === p.year
                  ? t.admin.periods.working
                  : p.isActive
                    ? t.admin.periods.deactivate
                    : t.admin.periods.activate}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
