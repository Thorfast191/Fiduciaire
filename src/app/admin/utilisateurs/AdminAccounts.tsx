"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormAlert } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/I18nProvider";

interface AdminRow {
  id: string;
  name: string;
  email: string;
  isSuper: boolean;
}

export default function AdminAccounts({
  admins,
  canManage,
}: {
  admins: AdminRow[];
  canManage: boolean;
}) {
  const t = useT();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy("add");
    setError(null);

    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error ?? t.common.genericError);
        return;
      }

      setForm({ firstName: "", lastName: "", email: "", password: "" });
      router.refresh();
    } catch {
      setError(t.common.genericError);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    setError(null);

    try {
      const res = await fetch("/api/admins", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
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
    <section className="mt-6 rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6">
      <h2 className="disp text-[17px] font-bold">
        {t.admin.users.adminsTitle}
      </h2>

      <p className="mt-1 text-[13px] text-muted">{t.admin.users.adminsSub}</p>

      <div className="mt-4 flex flex-col gap-2">
        {admins.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-xl border border-line px-4 py-2.5"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                a.isSuper
                  ? "bg-petrol-900 text-white"
                  : "bg-teal-100 text-brand"
              }`}
            >
              {a.name
                .split(" ")
                .map((p) => p[0] ?? "")
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14.5px] font-semibold text-strong">
                {a.name}
              </span>
              <span className="truncate text-[12.5px] text-muted">
                {a.email}
              </span>
            </span>

            {a.isSuper ? (
              <span className="rounded-full bg-petrol-900 px-2.5 py-1 font-mono text-[9px] tracking-[0.1em] text-white">
                {t.admin.users.superBadge}
              </span>
            ) : canManage ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => remove(a.id)}
                className="rounded-lg border border-red-600/30 px-3 py-1.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t.admin.users.remove}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {error ? (
        <div className="mt-4">
          <FormAlert variant="error">{error}</FormAlert>
        </div>
      ) : null}

      {canManage ? (
        <div className="mt-5 rounded-xl border border-line bg-sunken/40 p-4 sm:p-5">
          <h3 className="text-[14px] font-semibold text-strong">
            {t.admin.users.addTitle}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              id="adminFirstName"
              label={t.auth.fields.firstName}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Field
              id="adminLastName"
              label={t.auth.fields.lastName}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
            <Field
              id="adminEmail"
              label={t.auth.fields.email}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Field
              id="adminPassword"
              label={t.auth.fields.password}
              type="password"
              minLength={10}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="button"
            onClick={add}
            disabled={busy !== null}
            className="mt-4 inline-flex h-[46px] items-center justify-center rounded-xl bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "add" ? t.admin.users.adding : t.admin.users.addBtn}
          </button>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-sunken px-4 py-3 text-[12.5px] text-muted">
          {t.admin.users.onlySuperAdmin}
        </p>
      )}
    </section>
  );
}
