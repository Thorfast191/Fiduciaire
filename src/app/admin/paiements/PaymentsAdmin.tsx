"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";

interface Row {
  id: string;
  taxYear: number;
  label: string;
  method: "bank_transfer" | "card" | "twint" | "other";
  amountChf: number;
  status: "paid" | "pending";
  paidAt: string;
  clientName: string;
  email: string;
}

interface Sub {
  id: string;
  taxYear: number;
  services: string[];
  totalChf: number;
  clientName: string;
  email: string;
}

export function PaymentsAdmin({
  t,
  locale,
  rows,
  subscriptions,
  clients,
  periods,
}: {
  t: Messages;
  locale: string;
  rows: Row[];
  subscriptions: Sub[];
  clients: { id: string; name: string; email: string }[];
  periods: number[];
}) {
  const router = useRouter();
  const p = t.admin.payments;

  const [form, setForm] = useState({
    clientId: "",
    taxYear: String(periods[0] ?? new Date().getFullYear() - 1),
    label: "",
    method: "bank_transfer",
    amountChf: "",
    status: "paid",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-CH" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  async function record(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          taxYear: Number(form.taxYear),
          label: form.label,
          method: form.method,
          amountChf: Number(form.amountChf),
          status: form.status,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(p.failed);
        return;
      }
      setForm({ ...form, label: "", amountChf: "" });
      router.refresh();
    } catch {
      setError(p.failed);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: Row) {
    setBusy(true);
    try {
      await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          status: row.status === "paid" ? "pending" : "paid",
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 flex flex-col gap-5">
      {/* Record */}
      <section className="rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-xs)]">
        <span className="fx-eyebrow text-[var(--text-muted)]">
          {p.recordTitle}
        </span>

        <form onSubmit={record} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-[220px] flex-1 flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.client}</span>
            <select
              required
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="fx-field-input h-[46px] py-0"
            >
              <option value="">{p.chooseClient}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.email}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-[110px] flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.year}</span>
            <select
              value={form.taxYear}
              onChange={(e) => setForm({ ...form, taxYear: e.target.value })}
              className="fx-field-input h-[46px] py-0"
            >
              {periods.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.label}</span>
            <input
              required
              value={form.label}
              placeholder={p.labelPlaceholder}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="fx-field-input"
            />
          </label>

          <label className="flex w-[170px] flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.method}</span>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="fx-field-input h-[46px] py-0"
            >
              {(["bank_transfer", "card", "twint", "other"] as const).map((m) => (
                <option key={m} value={m}>
                  {t.payments.methods[m]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-[130px] flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.amount}</span>
            <input
              required
              type="number"
              min="0"
              value={form.amountChf}
              onChange={(e) => setForm({ ...form, amountChf: e.target.value })}
              className="fx-field-input"
            />
          </label>

          <label className="flex w-[140px] flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.status}</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="fx-field-input h-[46px] py-0"
            >
              <option value="paid">{t.payments.paid}</option>
              <option value="pending">{t.payments.pending}</option>
            </select>
          </label>

          <button type="submit" disabled={busy} className="fx-btn-send h-[46px]">
            {busy ? p.recording : p.record}
          </button>
        </form>

        {error ? (
          <p role="alert" className="mt-3 text-[13px] text-[#A2443A]">
            {error}
          </p>
        ) : null}
      </section>

      {/* Ledger */}
      <section className="rounded-[var(--radius-lg)] border border-line bg-card shadow-[var(--shadow-xs)]">
        <div className="border-b border-line px-6 py-4">
          <span className="fx-eyebrow text-[var(--text-muted)]">
            {p.ledgerTitle}
          </span>
        </div>

        {rows.length === 0 ? (
          <p className="px-6 py-6 text-[14px] text-muted">{p.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="fx-figure px-6 py-4 text-[13px] text-muted">
                      {dateFmt.format(new Date(r.paidAt))}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[14px] font-semibold text-strong">
                        {r.clientName}
                      </div>
                      <div className="text-[12px] text-muted">{r.email}</div>
                    </td>
                    <td className="px-4 py-4 text-[13.5px] text-body">
                      {r.label}
                      <div className="text-[12px] text-muted">
                        {t.payments.period.replace("{year}", String(r.taxYear))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-muted">
                      {t.payments.methods[r.method]}
                    </td>
                    <td className="fx-figure px-4 py-4 text-right text-[15px] font-bold text-strong">
                      CHF {r.amountChf}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggle(r)}
                        className={`rounded-full px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] transition-opacity disabled:opacity-50 ${
                          r.status === "paid"
                            ? "bg-green-100 text-green-600"
                            : "bg-[#FBF0DD] text-[#B26A00]"
                        }`}
                        title={r.status === "paid" ? p.markPending : p.markPaid}
                      >
                        {r.status === "paid" ? t.payments.paid : t.payments.pending}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Assistance subscriptions */}
      <section className="rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-xs)]">
        <span className="fx-eyebrow text-[var(--text-muted)]">
          {p.subsTitle}
        </span>

        {subscriptions.length === 0 ? (
          <p className="mt-3 text-[14px] text-muted">{p.subsEmpty}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {subscriptions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0"
              >
                <span>
                  <span className="block text-[14px] font-semibold text-strong">
                    {s.clientName}
                  </span>
                  <span className="text-[12.5px] text-muted">
                    {t.payments.period.replace("{year}", String(s.taxYear))} ·{" "}
                    {s.services.length} {p.subsServices}
                  </span>
                </span>

                <span className="fx-figure text-[15px] font-bold text-strong">
                  CHF {s.totalChf}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
