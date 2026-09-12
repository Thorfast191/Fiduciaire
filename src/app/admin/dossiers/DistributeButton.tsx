"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";

/** One administrator a dossier can be handed to. */
export interface DistributeAdmin {
  id: string;
  name: string;
  email: string;
  initials: string;
}

/** The prestations the wizard distributes, in the reference's order. */
const CATEGORIES = [
  "declaration",
  "capital",
  "simulation",
  "acompte",
] as const;

type Category = (typeof CATEGORIES)[number];

/**
 * "Distribuer les dossiers" — the reference's two-step wizard.
 *
 * Step one picks the administrators, step two sets how many free dossiers of
 * each prestation each of them receives. The per-prestation ceilings come from
 * the same count the "Dossiers libres" card shows, so the wizard can never
 * offer more than exists; the server re-checks anyway, since the pool can move
 * while the modal is open.
 */
export default function DistributeButton({
  periode,
  admins,
  free,
  labels,
  mode,
}: {
  periode: number;
  admins: DistributeAdmin[];
  /** Unreserved dossiers of the period, per prestation. */
  free: Record<string, number>;
  /** Service-type → display label. */
  labels: Record<string, string>;
  /**
   * "wizard" is the super admin's two-step allocation. "auto" is the ordinary
   * admin's single click, which spreads the free pool evenly — the reference
   * shows that button for a case worker and the wizard only for a super admin.
   */
  mode: "wizard" | "auto";
}) {
  const t = useT();
  const h = t.admin.hub;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>(
    {},
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  /** The one-click even split: no allocations, so the server spreads them. */
  async function autoDistribute() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/dossiers/distribute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taxYear: periode }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setNote({ ok: false, text: h.distributeError });
        return;
      }
      const assigned = Number(payload?.assigned ?? 0);
      setNote({
        ok: assigned > 0,
        text:
          assigned === 0
            ? h.distributeNone
            : h.distributed.replace("{n}", String(assigned)),
      });
      router.refresh();
    } catch {
      setNote({ ok: false, text: h.distributeError });
    } finally {
      setBusy(false);
    }
  }

  function start() {
    setStep(1);
    setSelected([]);
    setCounts({});
    setNote(null);
    setOpen(true);
  }

  function toggleAdmin(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  /**
   * What is still on the table for a prestation: the free pool minus everything
   * the other administrators have already been given in this same modal, so two
   * columns can never be set to claim the same dossier.
   */
  function remaining(adminId: string, category: Category) {
    const claimedByOthers = selected
      .filter((id) => id !== adminId)
      .reduce((sum, id) => sum + (counts[id]?.[category] ?? 0), 0);
    return Math.max(0, (free[category] ?? 0) - claimedByOthers);
  }

  function setCount(adminId: string, category: Category, value: number) {
    setCounts((prev) => ({
      ...prev,
      [adminId]: { ...(prev[adminId] ?? {}), [category]: value },
    }));
  }

  async function apply() {
    const allocations = selected.flatMap((adminId) =>
      CATEGORIES.map((serviceType) => ({
        adminId,
        serviceType,
        count: counts[adminId]?.[serviceType] ?? 0,
      })).filter((a) => a.count > 0),
    );

    if (allocations.length === 0) {
      setNote({ ok: false, text: h.distribNothing });
      return;
    }

    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/dossiers/distribute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taxYear: periode, allocations }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setNote({ ok: false, text: h.distributeError });
        return;
      }

      const assigned = Number(payload?.assigned ?? 0);
      setOpen(false);
      setNote({
        ok: assigned > 0,
        text:
          assigned === 0
            ? h.distribNothing
            : h.distribDoneToast.replace("{n}", String(assigned)),
      });
      router.refresh();
    } catch {
      setNote({ ok: false, text: h.distributeError });
    } finally {
      setBusy(false);
    }
  }

  const rowBase =
    "flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition-colors";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={mode === "auto" ? autoDistribute : start}
        disabled={mode === "auto" && busy}
        className="inline-flex items-center gap-2 rounded-[11px] bg-petrol-800 px-[18px] py-[11px] text-[14px] font-semibold text-white transition hover:bg-petrol-900 focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mode === "auto"
          ? busy
            ? h.distributing
            : h.distributeAuto
          : h.distribute}
      </button>

      {note ? (
        <span
          role="status"
          className={`absolute right-0 top-[calc(100%+8px)] z-10 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-medium shadow-sm ${
            note.ok
              ? "bg-teal-100 text-brand"
              : "border border-red-600/25 bg-red-100 text-red-600"
          }`}
        >
          {note.text}
        </span>
      ) : null}

      {open && mode === "wizard" ? (
        <div
          className="fixed inset-0 z-[98] flex items-center justify-center bg-[rgba(13,21,38,0.55)] p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[82vh] w-full max-w-[520px] overflow-y-auto rounded-[20px] bg-card p-7 text-left shadow-[0_40px_90px_-30px_rgba(13,21,38,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 1 ? (
              <>
                <h2 className="disp text-[20px] font-bold text-strong">
                  {h.distribTitle1}
                </h2>
                <p className="mt-1.5 text-[14.5px] leading-[1.55] text-muted">
                  {h.distribSub1}
                </p>

                <div className="mt-5 flex flex-col gap-2.5">
                  {admins.length === 0 ? (
                    <p className="text-[14px] text-muted">{h.distribNoAdmins}</p>
                  ) : (
                    admins.map((a) => {
                      const on = selected.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAdmin(a.id)}
                          aria-pressed={on}
                          className={`${rowBase} ${
                            on
                              ? "border-brand bg-teal-50"
                              : "border-line hover:border-line-strong"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] border text-[11px] font-bold text-white ${
                              on ? "border-brand bg-brand" : "border-line-strong"
                            }`}
                          >
                            {on ? "✓" : ""}
                          </span>

                          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-petrol-900 text-[12.5px] font-bold text-white">
                            {a.initials}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-semibold text-strong">
                              {a.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[13px] text-muted">
                              {a.email}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-[11px] border border-line-default bg-card px-4 py-3 text-[15px] font-semibold text-body transition hover:border-teal-300"
                  >
                    {h.distribCancelBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={selected.length === 0}
                    className="flex-1 rounded-[11px] bg-brand px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {h.distribNextBtn}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="disp text-[20px] font-bold text-strong">
                  {h.distribTitle2}
                </h2>
                <p className="mt-1.5 text-[14.5px] leading-[1.55] text-muted">
                  {h.distribSub2}
                </p>

                <div className="mt-5 flex flex-col gap-[18px]">
                  {admins
                    .filter((a) => selected.includes(a.id))
                    .map((a) => (
                      <div
                        key={a.id}
                        className="rounded-[14px] border border-line p-4"
                      >
                        <span className="disp block text-[16px] font-bold text-strong">
                          {a.name}
                        </span>

                        <div className="mt-3.5 flex flex-col gap-3">
                          {CATEGORIES.map((cat) => {
                            const max = remaining(a.id, cat);
                            const value = counts[a.id]?.[cat] ?? 0;
                            const avail =
                              max === 1 ? h.distribAvail1 : h.distribAvail;
                            return (
                              <div
                                key={cat}
                                className="flex items-center gap-3.5"
                              >
                                <label
                                  htmlFor={`dist-${a.id}-${cat}`}
                                  className="min-w-0 flex-1 text-[14.5px] text-body"
                                >
                                  <span className="block font-semibold">
                                    {labels[cat]}
                                  </span>
                                  <span className="mt-px block text-[12.5px] text-muted">
                                    {max} {avail}
                                  </span>
                                </label>

                                <select
                                  id={`dist-${a.id}-${cat}`}
                                  value={Math.min(value, max)}
                                  disabled={max === 0}
                                  onChange={(e) =>
                                    setCount(a.id, cat, Number(e.target.value))
                                  }
                                  className="h-[44px] w-[86px] shrink-0 rounded-[11px] border border-line-default bg-card px-3 text-[15px] text-strong outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {Array.from(
                                    { length: max + 1 },
                                    (_, n) => n,
                                  ).map((n) => (
                                    <option key={n} value={n}>
                                      {n}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>

                {note && !note.ok ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-600/25 bg-red-100 px-4 py-2.5 text-[13px] text-red-600"
                  >
                    {note.text}
                  </p>
                ) : null}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-[11px] border border-line-default bg-card px-4 py-3 text-[15px] font-semibold text-body transition hover:border-teal-300"
                  >
                    {h.distribBackBtn}
                  </button>
                  <button
                    type="button"
                    onClick={apply}
                    disabled={busy}
                    className="flex-1 rounded-[11px] bg-brand px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? h.distributing : h.distribApplyBtn}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
