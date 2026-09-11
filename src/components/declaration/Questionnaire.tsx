"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { DossierStatus } from "@/db/schema";
import { useCanton } from "@/components/shell/CantonContext";
import {
  CANTONS,
  STEPS,
  computePrice,
  requiredDocuments,
  DOCUMENT_CATALOGUE,
  ASSISTANCE_OPTIONS,
  emptySuccessionEntry,
  type Answers,
  type AssistanceKey,
  type Child,
  type Property,
  type TransportPeriod,
  type SuccessionEntry,
} from "@/lib/declaration";
import { Question, RadioRow, CheckRow, TextField, SelectField } from "./Field";

export interface QuestionnaireProps {
  t: Messages;
  dossierId: string;
  taxYear: number;
  status: DossierStatus;
  initialAnswers: Answers;
  initialStep: number;
  /** Documents already deposited against this dossier, newest kept per category. */
  uploadedDocs: { id: string; category: string; filename: string }[];
  /** Previous year's answers, offered as a starting point. */
  previousYear?: number;
  previousAnswers?: Answers;
}

/** The deposited document shown on a category row: what to download or replace. */
export type UploadedDoc = { id: string; filename: string };

const AUTOSAVE_MS = 900;

/**
 * The seven-page declaration questionnaire (`Fiduvia.dc.html:1871`).
 *
 * Answers live in one object saved as a whole — it is a single form spread over
 * seven pages, and the client always holds the complete state. Saving is
 * debounced so typing does not issue a request per keystroke.
 */
export function Questionnaire({
  t,
  dossierId,
  taxYear,
  status,
  initialAnswers,
  initialStep,
  uploadedDocs,
  previousYear,
  previousAnswers,
}: QuestionnaireProps) {
  const router = useRouter();
  const d = t.declaration;

  const { setCanton: setFlagCanton } = useCanton();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [step, setStep] = useState(initialStep);

  // Keep the topbar canton flag in step with the declaration's canton.
  useEffect(() => {
    if (answers.canton) setFlagCanton(answers.canton);
  }, [answers.canton, setFlagCanton]);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [reused, setReused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readOnly = status !== "not_started";

  const persist = useCallback(
    async (next: Answers, nextStep: number) => {
      if (readOnly) return;
      setSaving(true);
      try {
        // The response has to be checked. Reporting "Enregistré" for a save
        // that in fact failed is worse than reporting nothing: the client
        // keeps filling the form believing their answers are safe, and loses
        // the lot on reload.
        const res = await fetch(`/api/dossiers/${dossierId}/answers`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers: next, currentStep: nextStep }),
        });
        const body = await res.json().catch(() => null);
        setSaveFailed(!res.ok || !body?.ok);
      } catch {
        setSaveFailed(true);
      } finally {
        setSaving(false);
      }
    },
    [dossierId, readOnly],
  );

  // Debounced autosave: a keystroke should not be a request.
  useEffect(() => {
    if (readOnly) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(answers, step), AUTOSAVE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [answers, step, persist, readOnly]);

  // Back from Stripe Checkout. On success, confirm the session server-side (a
  // safety net for the webhook) so the dossier is submitted, then refresh to the
  // read-only submitted view. Either way the query params are cleared so a
  // reload does not re-trigger this.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;
    const sessionId = params.get("session_id");
    const clean = () =>
      window.history.replaceState({}, "", window.location.pathname);

    if (checkout === "success" && sessionId) {
      fetch(`/api/dossiers/${dossierId}/confirm-payment`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then(() => router.refresh())
        .finally(clean);
    } else {
      clean();
    }
  }, [dossierId, router]);

  function patch(update: Partial<Answers>) {
    setAnswers((a) => ({ ...a, ...update }));
  }

  function goTo(next: number) {
    setStep(next);
    persist(answers, next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const price = computePrice(answers);
  const docs = requiredDocuments(answers);
  // Most recent deposited document per category — a re-upload can leave more
  // than one row for a category, and the row shows/acts on the latest.
  const uploaded = new Map<string, UploadedDoc>();
  for (const d of uploadedDocs) uploaded.set(d.category, { id: d.id, filename: d.filename });

  const yesNo = [
    { value: "oui", label: d.yes },
    { value: "non", label: d.no },
  ];

  return (
    <div className="max-w-[1160px]">
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-strong"
      >
        ← {d.backToSpace}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <h1 className="disp text-[clamp(28px,3.4vw,36px)] font-extrabold leading-[1.05]">
          {d.title} {taxYear}
        </h1>

        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-card px-4 py-2.5 shadow-[var(--shadow-xs)]">
          <span className="flex flex-col">
            <span className="fx-eyebrow text-[var(--text-muted)]">
              {d.situationLabel}
            </span>
            <span className="text-[14px] font-semibold text-strong">
              {d.situations[answers.situation]}
            </span>
          </span>

          {readOnly ? null : (
            <Link
              href={`/portal/dossiers/${dossierId}?situation=1`}
              className="rounded-[var(--radius-sm)] bg-teal-100 px-3 py-1.5 text-[12.5px] font-semibold text-brand transition-colors hover:bg-teal-300/40"
            >
              {d.changeSituation}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-6">
        {/* Step rail */}
        <nav className="-mx-1 flex w-full shrink-0 snap-x gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-[230px] lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {STEPS.map((key, i) => {
            const active = i === step;
            const complete = i < step;
            return (
              <button
                key={key}
                type="button"
                onClick={() => goTo(i)}
                className={`flex shrink-0 snap-start items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors lg:w-full lg:shrink lg:gap-3 lg:px-4 lg:py-3 ${
                  active
                    ? "border border-line bg-card shadow-[var(--shadow-sm)]"
                    : "border border-transparent hover:bg-sunken"
                }`}
              >
                <span
                  className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                    active
                      ? "bg-petrol-800 text-white"
                      : complete
                        ? "bg-teal-100 text-brand"
                        : "bg-sunken text-muted"
                  }`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {complete ? "✓" : i + 1}
                </span>

                <span
                  className={`whitespace-nowrap text-[13.5px] leading-[1.25] lg:whitespace-normal lg:text-[14.5px] ${
                    active
                      ? "font-bold text-strong"
                      : "hidden text-muted lg:inline"
                  }`}
                >
                  {d.steps[key]}
                </span>
              </button>
            );
          })}

          <p className="mt-2 hidden px-4 text-[12px] text-muted lg:block">
            {d.requiredNote}
          </p>
        </nav>

        {/* Step body */}
        <div className="min-w-[300px] flex-1">
          <div className="flex flex-col gap-3.5">
            {step === 0 ? (
              <>
                {previousYear && !reused && !readOnly ? (
                  <div
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border p-[22px_26px]"
                    style={{ background: "#D9EFEC", borderColor: "#79C5BD" }}
                  >
                    <div className="max-w-[60ch]">
                      <p
                        className="m-0 text-[15.5px] font-bold"
                        style={{ color: "#145863" }}
                      >
                        {d.reuse.title.replace("{year}", String(previousYear))}
                      </p>
                      <p
                        className="mt-1 text-[13.5px] leading-[1.45]"
                        style={{ color: "#3F6A63" }}
                      >
                        {d.reuse.body}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        // Carry over the stable elements — the one-off events
                        // (situation, héritage, donation, express, taxation
                        // d'office, assistance) are not reused.
                        if (previousAnswers) {
                          patch({
                            canton: previousAnswers.canton,
                            etatCivil: previousAnswers.etatCivil,
                            children: previousAnswers.children,
                            revenus: previousAnswers.revenus,
                            transportPeriods: previousAnswers.transportPeriods,
                            fortuneTypes: previousAnswers.fortuneTypes,
                            dettes: previousAnswers.dettes,
                            proprietaireImmeuble:
                              previousAnswers.proprietaireImmeuble,
                            immeubles: previousAnswers.immeubles,
                            loyersPayes: previousAnswers.loyersPayes,
                            pilier3: previousAnswers.pilier3,
                            rachat2: previousAnswers.rachat2,
                          });
                        }
                        setReused(true);
                      }}
                      className="shrink-0 rounded-[11px] px-[18px] py-[11px] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
                      style={{ background: "var(--brand)" }}
                    >
                      {d.reuse.button}
                    </button>
                  </div>
                ) : null}

                <Question label={d.accueil.canton} required>
                  <SelectField
                    label={d.accueil.canton}
                    value={answers.canton}
                    onChange={(canton) => patch({ canton })}
                    options={[
                      { value: "", label: d.accueil.cantonPlaceholder },
                      ...CANTONS.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                </Question>

                {answers.situation === "depart" ? (
                  <Question label={d.accueil.departureDate}>
                    <TextField
                      label={d.accueil.departureDate}
                      type="date"
                      value={answers.departureDate}
                      onChange={(departureDate) => patch({ departureDate })}
                    />
                  </Question>
                ) : null}

                {answers.situation === "arrivee" ? (
                  <Question label={d.accueil.arrivalDate}>
                    <TextField
                      label={d.accueil.arrivalDate}
                      type="date"
                      value={answers.arrivalDate}
                      onChange={(arrivalDate) => patch({ arrivalDate })}
                    />
                  </Question>
                ) : null}

                <div className="rounded-[var(--radius-lg)] border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6">
                  <CheckRow
                    checked={answers.express}
                    onChange={(express) => patch({ express })}
                    label={d.accueil.express}
                  />
                </div>

                <Question
                  label={d.accueil.assistanceTitle}
                  hint={d.accueil.assistanceSub}
                >
                  <div className="flex flex-col gap-2.5">
                    {ASSISTANCE_OPTIONS.map((o) => (
                      <CheckRow
                        key={o.key}
                        checked={!!answers.assistance[o.key]}
                        onChange={() => {
                          const current = { ...answers.assistance };
                          if (o.key === "ensemble") {
                            patch({
                              assistance: current.ensemble
                                ? {}
                                : { ensemble: true },
                            });
                            return;
                          }
                          const next: Partial<Record<AssistanceKey, boolean>> = {
                            ...current,
                            [o.key]: !current[o.key],
                          };
                          delete next.ensemble;
                          patch({ assistance: next });
                        }}
                        label={t.assistance.options[o.key]}
                      />
                    ))}
                  </div>
                </Question>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Question label={d.famille.maritalStatus} required>
                  <RadioRow
                    name="etatCivil"
                    value={answers.etatCivil}
                    onChange={(v) =>
                      patch({ etatCivil: v as Answers["etatCivil"] })
                    }
                    options={[
                      { value: "celibataire", label: d.famille.celibataire },
                      { value: "marie", label: d.famille.marie },
                      { value: "partenariat", label: d.famille.partenariat },
                      { value: "divorce", label: d.famille.divorce },
                      { value: "veuf", label: d.famille.veuf },
                    ]}
                  />
                </Question>

                <Question label={d.famille.childCount} required>
                  <SelectField
                    label={d.famille.childCount}
                    value={String(answers.children.length)}
                    onChange={(v) => {
                      const n = Number(v);
                      const next = [...answers.children];
                      while (next.length < n) next.push(emptyChild());
                      patch({ children: next.slice(0, n) });
                    }}
                    options={[0, 1, 2, 3, 4, 5, 6].map((n) => ({
                      value: String(n),
                      label: String(n),
                    }))}
                  />

                  {answers.children.map((child, i) => (
                    <div
                      key={i}
                      className="mt-4 rounded-[var(--radius-md)] border border-line bg-sunken p-5"
                    >
                      <p className="disp m-0 text-[15px] font-bold">
                        {d.famille.child} {i + 1}
                        {child.firstName ? ` — ${child.firstName}` : ""}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <TextField
                          label={d.famille.firstName}
                          value={child.firstName}
                          onChange={(v) => patchChild(i, { firstName: v })}
                        />
                        <TextField
                          label={d.famille.lastName}
                          value={child.lastName}
                          onChange={(v) => patchChild(i, { lastName: v })}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <TextField
                          label={d.famille.birthDate}
                          type="date"
                          value={child.birthDate}
                          onChange={(v) => patchChild(i, { birthDate: v })}
                        />
                        <TextField
                          label={d.famille.avs}
                          placeholder="756.xxxx.xxxx.xx"
                          value={child.avs}
                          onChange={(v) => patchChild(i, { avs: v })}
                        />
                      </div>

                      <div className="mt-3">
                        <SelectField
                          label={d.famille.childSituation}
                          value={child.situation}
                          onChange={(v) => patchChild(i, { situation: v })}
                          options={[
                            { value: "etudiant", label: d.famille.situationEtudiant },
                            { value: "salarie", label: d.famille.situationSalarie },
                            { value: "autre", label: d.famille.situationAutre },
                          ]}
                        />
                      </div>

                      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                        <div>
                          <p className="text-[13.5px] text-body">
                            {d.famille.contributions}
                          </p>
                          <div className="mt-2">
                            <RadioRow
                              name={`contrib-${i}`}
                              value={child.contributions}
                              onChange={(v) =>
                                patchChild(i, {
                                  contributions: v as Child["contributions"],
                                })
                              }
                              options={yesNo}
                            />
                          </div>
                        </div>

                        {/* The two ménage questions only appear once the child
                            is declared à charge, as in the reference. */}
                        {child.contributions === "oui" ? (
                          <>
                            <div>
                              <p className="text-[13.5px] text-body">
                                {d.famille.menageCommun}
                              </p>
                              <div className="mt-2">
                                <RadioRow
                                  name={`menage-${i}`}
                                  value={child.menageCommun}
                                  onChange={(v) =>
                                    patchChild(i, {
                                      menageCommun: v as Child["menageCommun"],
                                    })
                                  }
                                  options={yesNo}
                                />
                              </div>
                            </div>

                            <div>
                              <p className="text-[13.5px] text-body">
                                {d.famille.menageAutreParent}
                              </p>
                              <div className="mt-2">
                                <RadioRow
                                  name={`menage-parent-${i}`}
                                  value={child.menageAutreParent}
                                  onChange={(v) =>
                                    patchChild(i, {
                                      menageAutreParent:
                                        v as Child["menageAutreParent"],
                                    })
                                  }
                                  options={yesNo}
                                />
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </Question>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Question label={d.revenus.title} required hint={d.revenus.sub}>
                  <div className="flex flex-col gap-2.5">
                    {(
                      // The reference's income types, in its order — no
                      // "étudiant" here (the student rate is a simulator/tariff
                      // teaser, not a declaration income type).
                      ["salarie", "rentier", "chomage", "independant", "autre"] as const
                    ).map((k) => (
                      <CheckRow
                        key={k}
                        checked={!!answers.revenus[k]}
                        onChange={(on) => {
                          const revenus = { ...answers.revenus, [k]: on };
                          // Turning salaried on offers a first transport period.
                          if (k === "salarie" && on && answers.transportPeriods.length === 0)
                            patch({ revenus, transportPeriods: [emptyTransportPeriod()] });
                          else patch({ revenus });
                        }}
                        label={d.revenus[k]}
                      />
                    ))}
                  </div>
                </Question>

                {answers.revenus.salarie ? (
                  <Question label={d.transport.title}>
                    <p className="-mt-1 mb-3 text-[13.5px] text-muted">
                      {d.transport.sub}
                    </p>

                    <CheckRow
                      checked={answers.movedDuringYear}
                      onChange={(movedDuringYear) => patch({ movedDuringYear })}
                      label={d.transport.moved}
                    />

                    <div className="mt-3 flex flex-col gap-3.5">
                      {answers.transportPeriods.map((p, i) => (
                        <div
                          key={i}
                          className="rounded-[var(--radius-md)] border border-line bg-sunken/40 p-4"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextField
                              label={d.transport.from}
                              value={p.from}
                              onChange={(from) => patchTransport(i, { from })}
                            />
                            <TextField
                              label={d.transport.to}
                              value={p.to}
                              onChange={(to) => patchTransport(i, { to })}
                            />
                          </div>
                          <div className="mt-3">
                            <TextField
                              label={d.transport.rate}
                              value={p.rate}
                              onChange={(rate) => patchTransport(i, { rate })}
                            />
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextField
                              label={d.transport.home}
                              value={p.homePlace}
                              onChange={(homePlace) => patchTransport(i, { homePlace })}
                            />
                            <TextField
                              label={d.transport.work}
                              value={p.workPlace}
                              onChange={(workPlace) => patchTransport(i, { workPlace })}
                            />
                          </div>
                          {answers.transportPeriods.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                patch({
                                  transportPeriods: answers.transportPeriods.filter(
                                    (_, j) => j !== i,
                                  ),
                                })
                              }
                              className="mt-3 text-[12.5px] font-medium text-[#A2443A]"
                            >
                              {d.transport.remove}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          transportPeriods: [
                            ...answers.transportPeriods,
                            emptyTransportPeriod(),
                          ],
                        })
                      }
                      className="mt-3 text-[13px] font-semibold text-brand"
                    >
                      {d.transport.addLine}
                    </button>
                  </Question>
                ) : null}
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Question label={d.fortune.title}>
                  <div className="flex flex-col gap-2.5">
                    {(
                      [
                        "epargne",
                        "immeuble",
                        "titres",
                        "crypto",
                        "assuranceVie",
                        "aucun",
                      ] as const
                    ).map((k) => (
                      <CheckRow
                        key={k}
                        checked={!!answers.fortuneTypes[k]}
                        onChange={(on) => {
                          // "Aucun" is exclusive: it clears the rest, and any
                          // other choice clears it.
                          if (k === "aucun") {
                            patch({ fortuneTypes: on ? { aucun: true } : {} });
                          } else {
                            const next = { ...answers.fortuneTypes, [k]: on };
                            delete next.aucun;
                            patch({ fortuneTypes: next });
                          }
                        }}
                        label={d.fortune[k]}
                      />
                    ))}
                  </div>
                </Question>

                <Question label={d.fortune.dettesTitle}>
                  <RadioRow
                    name="dettes"
                    value={answers.dettes}
                    onChange={(v) => patch({ dettes: v as Answers["dettes"] })}
                    options={[
                      { value: "commerciale", label: d.fortune.dettesCommerciale },
                      { value: "privee", label: d.fortune.dettesPrivee },
                    ]}
                  />
                </Question>

                <Question label={d.fortune.heritageDonationsTitle}>
                  {(() => {
                    const entryLabels = {
                      prenom: d.fortune.entryPrenom,
                      nom: d.fortune.entryNom,
                      lien: d.fortune.entryLien,
                      montant: d.fortune.entryMontant,
                      add: d.fortune.entryAdd,
                      remove: d.fortune.entryRemove,
                    };
                    // Ticking a box seeds one blank entry row, like the mockup.
                    const seed = (list: SuccessionEntry[]) =>
                      list.length ? list : [emptySuccessionEntry()];
                    return (
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <CheckRow
                              checked={answers.heritageEnCours === "oui"}
                              onChange={(on) =>
                                patch({
                                  heritageEnCours: on ? "oui" : "",
                                  heritageEntries: on
                                    ? seed(answers.heritageEntries)
                                    : answers.heritageEntries,
                                })
                              }
                              label={d.fortune.heritage}
                            />
                            <span className="fx-figure shrink-0 whitespace-nowrap rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-brand">
                              {d.fortune.heritageBadge}
                            </span>
                          </div>
                          <p className="mt-1 pl-[30px] text-[12.5px] leading-[1.4] text-muted">
                            {d.fortune.heritageNote}
                          </p>
                          {answers.heritageEnCours === "oui" ? (
                            <SuccessionEntries
                              entries={answers.heritageEntries}
                              labels={entryLabels}
                              onChange={(heritageEntries) =>
                                patch({ heritageEntries })
                              }
                            />
                          ) : null}
                        </div>

                        <div>
                          <CheckRow
                            checked={answers.donationEffectuee === "oui"}
                            onChange={(on) =>
                              patch({
                                donationEffectuee: on ? "oui" : "",
                                donationEffectueeEntries: on
                                  ? seed(answers.donationEffectueeEntries)
                                  : answers.donationEffectueeEntries,
                              })
                            }
                            label={d.fortune.donationEffectuee}
                          />
                          {answers.donationEffectuee === "oui" ? (
                            <SuccessionEntries
                              entries={answers.donationEffectueeEntries}
                              labels={entryLabels}
                              onChange={(donationEffectueeEntries) =>
                                patch({ donationEffectueeEntries })
                              }
                            />
                          ) : null}
                        </div>

                        <div>
                          <CheckRow
                            checked={answers.donationRecue === "oui"}
                            onChange={(on) =>
                              patch({
                                donationRecue: on ? "oui" : "",
                                donationRecueEntries: on
                                  ? seed(answers.donationRecueEntries)
                                  : answers.donationRecueEntries,
                              })
                            }
                            label={d.fortune.donationRecue}
                          />
                          {answers.donationRecue === "oui" ? (
                            <SuccessionEntries
                              entries={answers.donationRecueEntries}
                              labels={entryLabels}
                              onChange={(donationRecueEntries) =>
                                patch({ donationRecueEntries })
                              }
                            />
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </Question>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <div className="rounded-[var(--radius-lg)] border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6">
                  <CheckRow
                    checked={answers.proprietaireImmeuble === "oui"}
                    onChange={(on) =>
                      patch({
                        proprietaireImmeuble: on ? "oui" : "",
                        immeubles:
                          on && answers.immeubles.length === 0
                            ? [emptyProperty()]
                            : answers.immeubles,
                      })
                    }
                    label={d.immeubles.owner}
                  />
                </div>

                {answers.proprietaireImmeuble === "oui"
                  ? answers.immeubles.map((im, i) => (
                      <Question key={i} label={`${d.immeubles.item} ${i + 1}`}>
                        <div className="flex flex-wrap gap-3">
                          <TextField
                            label={d.immeubles.street}
                            value={im.street}
                            onChange={(v) => patchProperty(i, { street: v })}
                          />
                          <TextField
                            label={d.immeubles.postcode}
                            value={im.postcode}
                            onChange={(v) => patchProperty(i, { postcode: v })}
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          <TextField
                            label={d.immeubles.country}
                            value={im.country}
                            onChange={(v) => patchProperty(i, { country: v })}
                          />
                          <TextField
                            label={d.immeubles.share}
                            value={im.share}
                            onChange={(v) => patchProperty(i, { share: v })}
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          <SelectField
                            label={d.immeubles.acquisition}
                            value={im.acquisition}
                            onChange={(v) =>
                              patchProperty(i, {
                                acquisition: v as Property["acquisition"],
                              })
                            }
                            options={[
                              { value: "", label: "—" },
                              { value: "achat", label: d.immeubles.achat },
                              { value: "heritage", label: d.immeubles.heritageMotif },
                              { value: "donation", label: d.immeubles.donation },
                            ]}
                          />
                          <SelectField
                            label={d.immeubles.alienation}
                            value={im.alienation}
                            onChange={(v) =>
                              patchProperty(i, {
                                alienation: v as Property["alienation"],
                              })
                            }
                            options={[
                              { value: "", label: "—" },
                              { value: "vente", label: d.immeubles.vente },
                              { value: "donation", label: d.immeubles.donation },
                            ]}
                          />
                        </div>

                        <p className="mt-4 text-[13.5px] text-body">
                          {d.immeubles.rented}
                        </p>
                        <div className="mt-2">
                          <RadioRow
                            name={`rented-${i}`}
                            value={im.rented}
                            onChange={(v) =>
                              patchProperty(i, { rented: v as Property["rented"] })
                            }
                            options={yesNo}
                          />
                        </div>

                        {im.rented === "oui" ? (
                          <div className="mt-3 flex flex-wrap items-end gap-3">
                            <TextField
                              label={d.immeubles.loyerTouche}
                              placeholder="CHF / an"
                              value={im.loyerTouche}
                              onChange={(v) =>
                                patchProperty(i, { loyerTouche: v })
                              }
                            />
                            <label className="flex cursor-pointer items-center gap-2 py-3 text-[14px] text-body">
                              <input
                                type="checkbox"
                                checked={im.loueMeuble}
                                onChange={(e) =>
                                  patchProperty(i, {
                                    loueMeuble: e.target.checked,
                                  })
                                }
                                className="h-[18px] w-[18px] accent-[var(--brand)]"
                              />
                              {d.immeubles.loueMeuble}
                            </label>
                          </div>
                        ) : null}

                        <p className="mt-4 text-[13.5px] text-body">
                          {d.immeubles.hasDebt}
                        </p>
                        <div className="mt-2">
                          <RadioRow
                            name={`debt-${i}`}
                            value={im.hasDebt}
                            onChange={(v) =>
                              patchProperty(i, {
                                hasDebt: v as Property["hasDebt"],
                              })
                            }
                            options={yesNo}
                          />
                        </div>

                        {im.hasDebt === "oui" ? (
                          <div className="mt-3">
                            <TextField
                              label={d.immeubles.detteMontant}
                              placeholder="CHF"
                              value={im.detteMontant}
                              onChange={(v) =>
                                patchProperty(i, { detteMontant: v })
                              }
                            />
                          </div>
                        ) : null}

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              patch({
                                immeubles: [...answers.immeubles, emptyProperty()],
                              })
                            }
                            className="fx-btn-outline w-auto px-4"
                          >
                            {d.immeubles.add}
                          </button>

                          {answers.immeubles.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                patch({
                                  immeubles: answers.immeubles.filter(
                                    (_, j) => j !== i,
                                  ),
                                })
                              }
                              className="rounded-[10px] border border-line-default px-4 py-3 text-[14.5px] font-semibold text-muted"
                            >
                              {d.immeubles.remove}
                            </button>
                          ) : null}
                        </div>
                      </Question>
                    ))
                  : null}
              </>
            ) : null}

            {step === 5 ? (
              <div className="rounded-[var(--radius-lg)] border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6">
                <div className="flex flex-col gap-3.5">
                  <div>
                    <CheckRow
                      checked={answers.loyersPayes === "oui"}
                      onChange={(on) =>
                        patch({ loyersPayes: on ? "oui" : "" })
                      }
                      label={d.deductions.loyerPaid}
                    />
                    <p className="mt-1 pl-[30px] text-[12.5px] leading-[1.4] text-muted">
                      {d.deductions.loyerNote}
                    </p>
                  </div>

                  <CheckRow
                    checked={answers.pilier3}
                    onChange={(pilier3) => patch({ pilier3 })}
                    label={d.deductions.pilier3}
                  />

                  <CheckRow
                    checked={answers.rachat2}
                    onChange={(rachat2) => patch({ rachat2 })}
                    label={d.deductions.rachat2}
                  />
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <TransmissionStep
                t={t}
                dossierId={dossierId}
                docs={docs}
                uploaded={uploaded}
                price={price}
                readOnly={readOnly}
                consent={{
                  transmitWithoutReview: answers.transmitWithoutReview,
                  reviewBeforeTransmit: answers.reviewBeforeTransmit,
                }}
                comment={answers.comments["p6"] ?? ""}
                onComment={(v) =>
                  patch({ comments: { ...answers.comments, p6: v } })
                }
                onConsent={(u) => patch(u)}
                onUploaded={() => router.refresh()}
                onBack={() => goTo(step - 1)}
              />
            ) : null}

            {/* Per-page remark, as in the mockup */}
            {step < 6 ? (
              <Question label={d.remark}>
                <textarea
                  rows={2}
                  value={answers.comments[`p${step}`] ?? ""}
                  placeholder={d.remarkPlaceholder}
                  onChange={(e) =>
                    patch({
                      comments: {
                        ...answers.comments,
                        [`p${step}`]: e.target.value,
                      },
                    })
                  }
                  className="fx-field-input resize-y leading-[1.6]"
                />
              </Question>
            ) : null}
          </div>

          {/* Steps 1–6 carry the shared nav; the transmission step (7) renders
              its own, with the submit button in place of "next". */}
          {step < 6 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                  saveFailed ? "text-[#A2443A]" : "text-muted"
                }`}
                role={saveFailed ? "alert" : undefined}
              >
                {saving ? d.saving : saveFailed ? d.saveFailed : d.saved}
              </span>

              <div className="flex gap-2.5">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => goTo(step - 1)}
                    className="rounded-[var(--radius-md)] border border-line-default px-5 py-3 text-[15px] font-semibold text-body transition-colors hover:border-teal-300"
                  >
                    ← {d.previous}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => goTo(step + 1)}
                  className="fx-btn-send"
                >
                  {d.next} →
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  function patchChild(index: number, update: Partial<Child>) {
    const next = answers.children.map((c, i) =>
      i === index ? { ...c, ...update } : c,
    );
    patch({ children: next });
  }

  function patchProperty(index: number, update: Partial<Property>) {
    const next = answers.immeubles.map((p, i) =>
      i === index ? { ...p, ...update } : p,
    );
    patch({ immeubles: next });
  }

  function patchTransport(index: number, update: Partial<TransportPeriod>) {
    const next = answers.transportPeriods.map((p, i) =>
      i === index ? { ...p, ...update } : p,
    );
    patch({ transportPeriods: next });
  }
}

/** Repeatable name / relationship / amount rows for an inheritance or gift. */
function SuccessionEntries({
  entries,
  labels,
  onChange,
}: {
  entries: SuccessionEntry[];
  labels: {
    prenom: string;
    nom: string;
    lien: string;
    montant: string;
    add: string;
    remove: string;
  };
  onChange: (next: SuccessionEntry[]) => void;
}) {
  const patchEntry = (i: number, u: Partial<SuccessionEntry>) =>
    onChange(entries.map((e, j) => (j === i ? { ...e, ...u } : e)));

  return (
    <div className="mt-3 flex flex-col gap-3">
      {entries.map((e, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-md)] border border-line bg-sunken p-4"
        >
          <div className="flex flex-wrap gap-3">
            <TextField
              label={labels.prenom}
              value={e.firstName}
              onChange={(v) => patchEntry(i, { firstName: v })}
            />
            <TextField
              label={labels.nom}
              value={e.lastName}
              onChange={(v) => patchEntry(i, { lastName: v })}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <TextField
              label={labels.lien}
              value={e.lien}
              onChange={(v) => patchEntry(i, { lien: v })}
            />
            <TextField
              label={labels.montant}
              type="number"
              placeholder="CHF"
              value={e.montant}
              onChange={(v) => patchEntry(i, { montant: v })}
            />
          </div>
          {entries.length > 1 ? (
            <button
              type="button"
              onClick={() => onChange(entries.filter((_, j) => j !== i))}
              className="mt-3 text-[12.5px] font-medium text-[#A2443A]"
            >
              {labels.remove}
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...entries, emptySuccessionEntry()])}
        className="self-start text-[13px] font-semibold text-brand"
      >
        {labels.add}
      </button>
    </div>
  );
}

function emptyChild(): Child {
  return {
    firstName: "",
    lastName: "",
    birthDate: "",
    avs: "",
    situation: "etudiant",
    contributions: "",
    menageCommun: "",
    menageAutreParent: "",
  };
}

function emptyProperty(): Property {
  return {
    street: "",
    postcode: "",
    country: "Suisse",
    share: "100",
    acquisition: "",
    alienation: "",
    rented: "",
    loyerTouche: "",
    loueMeuble: false,
    hasDebt: "",
    detteMontant: "",
  };
}

function emptyTransportPeriod(): TransportPeriod {
  return { from: "01.01", to: "31.12", rate: "100", homePlace: "", workPlace: "" };
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/**
 * Uploads one file against a document requirement.
 *
 * Same three-step flow as the portal's own uploader: ask for a presigned URL,
 * PUT the bytes straight to storage, then confirm so the server can verify what
 * actually landed rather than trusting what the browser declared.
 */
async function uploadFor(
  dossierId: string,
  category: string,
  file: File,
): Promise<boolean> {
  const startRes = await fetch("/api/documents/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      dossierId,
      filename: file.name,
      category,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });
  if (!startRes.ok) return false;

  const { documentId, uploadUrl } = await startRes.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!putRes.ok) return false;

  const confirmRes = await fetch(`/api/documents/${documentId}/confirm`, {
    method: "POST",
  });
  return confirmRes.ok;
}

// Which glyph each document category shows, transcribed from the mockup's
// `DOC_ICON` map (`Fiduvia.dc.html:5087`). Anything unlisted falls back to the
// file icon.
const DOC_ICON: Record<string, string> = {
  compta: "book",
  renteAVS: "user",
  rente2p: "trend",
  chomage: "user",
  pilier3a: "trend",
  rachatLpp: "trend",
  releveEpargne: "book",
  comptesTitres: "book",
  attestAssuranceVie: "shield",
  releveCompteImmeuble: "book",
  primesMaladie: "shield",
  fraisMedicaux: "shield",
  fraisGarde: "users",
  pensionAlim: "users",
};

function DocGlyph({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "trend":
      return (
        <svg {...common}>
          <path d="M23 6l-9.5 9.5-5-5L1 18" />
          <path d="M17 6h6v6" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
          <path d="M16 3.6a4 4 0 0 1 0 7.8" />
          <path d="M21.5 21a6.5 6.5 0 0 0-5-6.3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      );
  }
}

function DocumentRow({
  t,
  dossierId,
  docKey,
  doc,
  optional,
  readOnly,
  onChanged,
}: {
  t: Messages;
  dossierId: string;
  docKey: string;
  /** The deposited document for this category, if any. */
  doc: UploadedDoc | undefined;
  /** `divers` is not required, so its badge reads "Facultatif". */
  optional: boolean;
  readOnly: boolean;
  onChanged: () => void;
}) {
  const d = t.declaration;
  const meta = DOCUMENT_CATALOGUE[docKey];
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const done = Boolean(doc);

  // Deposits a file for this category. When one is already deposited this is a
  // replacement: upload the new file first, then remove the old one, so a
  // failed upload leaves the existing document intact.
  async function pick(file: File | undefined) {
    if (!file) return;
    setFailed(false);
    if (file.size > MAX_UPLOAD_BYTES) {
      setFailed(true);
      return;
    }
    setBusy(true);
    const ok = await uploadFor(dossierId, docKey, file);
    if (ok && doc) {
      await fetch(`/api/documents/${doc.id}`, { method: "DELETE" }).catch(() => {});
    }
    setBusy(false);
    if (ok) onChanged();
    else setFailed(true);
  }

  async function download() {
    if (!doc) return;
    setFailed(false);
    const res = await fetch(`/api/documents/${doc.id}/download-url`);
    if (!res.ok) {
      setFailed(true);
      return;
    }
    const { downloadUrl } = await res.json();
    window.location.href = downloadUrl;
  }

  async function remove() {
    if (!doc) return;
    setFailed(false);
    setBusy(true);
    const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onChanged();
    else setFailed(true);
  }

  const fileBtn =
    "flex shrink-0 items-center gap-1.5 rounded-[8px] border border-line-default bg-card px-[11px] py-1.5 text-[13px] font-semibold text-brand transition hover:border-line-strong disabled:opacity-60";

  return (
    <div
      className="flex flex-col gap-3 rounded-[14px] border bg-card p-[14px_16px] transition-[border-color]"
      style={{ borderColor: done ? "#CFE6D9" : "#E7EAEF" }}
    >
      <div className="flex flex-wrap items-center gap-[14px]">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "#D9EFEC", color: "var(--brand)" }}
        >
          <DocGlyph name={DOC_ICON[docKey] ?? "file"} />
        </span>

        <span className="min-w-[150px] flex-1">
          <span className="block text-[15.5px] font-semibold text-strong">
            {meta?.title ?? docKey}
          </span>
          {meta?.hint ? (
            <span className="mt-0.5 block text-[13.5px] text-[#8B97A8]">
              {meta.hint}
            </span>
          ) : null}
          {failed ? (
            <span className="mt-0.5 block text-[13px] text-[#A2443A]">
              {t.documents.errUpload}
            </span>
          ) : null}
        </span>

        <span
          className="shrink-0 rounded-full px-[11px] py-[5px] text-[12.5px] font-bold"
          style={
            done
              ? { background: "#E6F6EE", color: "#1F9D5B" }
              : { background: "#F0F2F6", color: "#8B97A8" }
          }
        >
          {done
            ? d.transmission.uploaded
            : optional
              ? d.transmission.optional
              : d.transmission.toUpload}
        </span>

        <input
          ref={input}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {/* Not deposited: the solid "Téléverser" button. Deposited: it turns
            into an outline "Remplacer" so the primary style is freed up. */}
        {readOnly ? null : done ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className={fileBtn}
          >
            {busy ? d.saving : d.transmission.replace}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex shrink-0 cursor-pointer items-center rounded-[10px] border border-brand bg-brand px-[15px] py-[9px] text-[14px] font-semibold text-white disabled:opacity-70"
          >
            {busy ? d.saving : d.transmission.upload}
          </button>
        )}
      </div>

      {/* The deposited file, with download / remove, as in the mockup. */}
      {doc ? (
        <div
          className="flex items-center gap-2.5 rounded-[10px] border px-3 py-2"
          style={{ background: "#F7FAF9", borderColor: "#E2EBE8" }}
        >
          <span
            className="min-w-0 flex-1 truncate text-[13.5px] text-body"
            title={doc.filename}
          >
            {doc.filename}
          </span>
          <button type="button" disabled={busy} onClick={download} className={fileBtn}>
            {d.transmission.download}
          </button>
          {readOnly ? null : (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="flex shrink-0 items-center rounded-[8px] border px-[11px] py-1.5 text-[13px] font-semibold transition disabled:opacity-60"
              style={{ borderColor: "#ECC9C9", color: "#C0584A" }}
            >
              {d.transmission.remove}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Step 7: the tariff, the document checklist, the review choice and submit. */
function TransmissionStep({
  t,
  dossierId,
  docs,
  uploaded,
  price,
  readOnly,
  consent,
  comment,
  onComment,
  onConsent,
  onUploaded,
  onBack,
}: {
  t: Messages;
  dossierId: string;
  docs: string[];
  uploaded: Map<string, UploadedDoc>;
  price: ReturnType<typeof computePrice>;
  readOnly: boolean;
  consent: { transmitWithoutReview: boolean; reviewBeforeTransmit: boolean };
  comment: string;
  onComment: (value: string) => void;
  onConsent: (update: Partial<Answers>) => void;
  onUploaded: () => void;
  onBack: () => void;
}) {
  const d = t.declaration;
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Divers" is optional, so it counts neither toward the required total the
  // client sees nor toward what unlocks the submit — matching the mockup
  // (`Fiduvia.dc.html:6255`, `reqDocKeys = docKeysAll.filter(k=>k!=="divers")`).
  const reqDocs = docs.filter((key) => key !== "divers");
  const reqTotal = reqDocs.length;
  const reqDone = reqDocs.filter((key) => uploaded.has(key)).length;
  const reqPct = reqTotal === 0 ? 0 : Math.round((reqDone / reqTotal) * 100);
  const complete = reqDone >= reqTotal;
  const cardBorder = { borderColor: "#E7EAEF" };
  const sand = { background: "#F3EFE6", borderColor: "#E7EAEF" };

  // Opens a Stripe Checkout session and hands the browser to it. Payment is
  // what submits the declaration: the return from Stripe finalizes and locks it
  // (see the effect in Questionnaire). `submitting` stays true on success
  // because the page is navigating away.
  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/checkout`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.url) {
        window.location.assign(body.url);
        return;
      }
      setError(d.transmission.paymentError);
    } catch {
      setError(d.transmission.paymentError);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Card 1 — every supporting document, with the tariff and progress. */}
      <div
        className="rounded-[18px] border bg-card p-[26px]"
        style={cardBorder}
      >
        <h2 className="text-[17px] font-bold text-strong">
          {d.transmission.title}
        </h2>
        <p className="mt-1 text-[13.5px] text-[#8B97A8]">
          {reqTotal} {d.transmission.note}
        </p>

        <div className="mt-4 flex flex-wrap gap-3.5">
          {/* Récapitulatif du tarif */}
          <div
            className="min-w-[190px] flex-1 rounded-2xl border p-[16px_18px]"
            style={sand}
          >
            <div className="text-[13px] font-semibold text-[#8B97A8]">
              {d.transmission.priceTitle}
            </div>

            <div className="mt-2.5 flex flex-col gap-[7px]">
              {price.lines.map((line) => (
                <div
                  key={line.key + (line.count ?? "")}
                  className="flex justify-between gap-3 text-[13.5px]"
                  style={{ color: "#46515F" }}
                >
                  <span>
                    {d.price[line.key as keyof typeof d.price]}
                    {line.count && line.count > 1 ? ` × ${line.count}` : ""}
                  </span>
                  <span className="fx-figure whitespace-nowrap font-semibold">
                    CHF {line.amount}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-3 h-px" style={{ background: "#E0DACF" }} />

            <div className="flex items-baseline justify-between gap-3">
              <span
                className="text-[13.5px] font-bold"
                style={{ color: "#3B4654" }}
              >
                {d.transmission.total}
              </span>
              <span
                className="fx-figure text-[24px] font-extrabold leading-none"
                style={{ color: "var(--brand)" }}
              >
                CHF {price.total}
              </span>
            </div>
          </div>

          {/* Progression du dépôt */}
          <div
            className="min-w-[240px] flex-[2] rounded-2xl border p-[16px_18px]"
            style={sand}
          >
            <div
              className="flex justify-between text-[14px] font-semibold"
              style={{ color: "#3B4654" }}
            >
              <span>
                {d.transmission.progress
                  .replace("{done}", String(reqDone))
                  .replace("{total}", String(reqTotal))}
              </span>
              <span style={{ color: "var(--brand)" }}>{reqPct}%</span>
            </div>

            <div
              className="mt-2.5 h-2 overflow-hidden rounded-full"
              style={{ background: "#E7EAEF" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-[400ms]"
                style={{ width: `${reqPct}%`, background: "var(--brand)" }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {docs.map((key) => (
            <DocumentRow
              key={key}
              t={t}
              dossierId={dossierId}
              docKey={key}
              doc={uploaded.get(key)}
              optional={key === "divers"}
              readOnly={readOnly}
              onChanged={onUploaded}
            />
          ))}
        </div>
      </div>

      {readOnly ? (
        <p className="rounded-[10px] border border-teal-300 bg-teal-100/60 px-4 py-3 text-[13.5px] text-brand">
          {d.transmission.submitted}
        </p>
      ) : (
        <>
          {/* Card 2 — how the client wants the return handled before we file it. */}
          <div
            className="flex flex-col gap-3 rounded-[18px] border bg-card p-[22px_26px]"
            style={cardBorder}
          >
            <CheckRow
              checked={consent.transmitWithoutReview}
              onChange={(on) =>
                onConsent({
                  transmitWithoutReview: on,
                  ...(on ? { reviewBeforeTransmit: false } : {}),
                })
              }
              label={d.transmission.consentNoReview}
            />
            <CheckRow
              checked={consent.reviewBeforeTransmit}
              onChange={(on) =>
                onConsent({
                  reviewBeforeTransmit: on,
                  ...(on ? { transmitWithoutReview: false } : {}),
                })
              }
              label={d.transmission.consentReview}
            />
          </div>

          {/* Card 3 — the per-page remark, as on every other step. */}
          <div
            className="rounded-[18px] border bg-card p-[22px_26px]"
            style={cardBorder}
          >
            <label
              className="mb-2 block text-[14px] font-semibold"
              style={{ color: "#3B4654" }}
            >
              {d.remark}
            </label>
            <textarea
              rows={2}
              value={comment}
              placeholder={d.remarkPlaceholder}
              onChange={(e) => onComment(e.target.value)}
              className="fx-field-input resize-y leading-[1.6]"
            />
          </div>

          {/* Nav — previous on the left, submit on the right, as in the mockup. */}
          <div className="mt-1 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-2 py-3 text-[14.5px] font-semibold text-body transition-colors hover:text-brand"
            >
              ← {d.previous}
            </button>

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={submitting || !complete}
              className="fx-btn-send"
              style={
                !complete
                  ? { background: "#EDF1F6", color: "#AEB8C4", opacity: 1 }
                  : undefined
              }
            >
              {submitting ? d.transmission.submitting : `${d.transmission.submit} →`}
            </button>
          </div>

          {error ? (
            <p role="alert" className="text-right text-[13px] text-red-600">
              {error}
            </p>
          ) : null}

          {!complete ? (
            <p className="text-right text-[13px] text-[#B26A00]">
              {d.transmission.submitHint}
            </p>
          ) : null}
        </>
      )}

      {/* Submitting locks the answers for good — the API refuses edits once the
          dossier leaves `not_started` — so it is worth one deliberate step. */}
      {confirming ? (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirming(false);
          }}
          className="fixed inset-0 z-[95] flex animate-[fadeBg_.18s_ease] items-start justify-center overflow-y-auto bg-[rgba(13,21,38,.55)] p-6 backdrop-blur-[3px]"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-submit-title"
            className="my-auto w-full max-w-[460px] animate-[popIn_.22s_ease] rounded-[var(--radius-xl)] bg-card px-8 py-[30px] shadow-[0_40px_90px_-30px_rgba(11,32,48,.6)]"
          >
            <h2
              id="confirm-submit-title"
              className="disp m-0 text-[21px] font-extrabold leading-[1.2]"
            >
              {d.transmission.confirmTitle}
            </h2>

            <p className="mt-2.5 text-[14.5px] leading-[1.55] text-muted">
              {d.transmission.confirmBody}
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-[var(--radius-md)] border border-line-default px-5 py-3 text-[15px] font-semibold text-body transition-colors hover:border-teal-300"
              >
                {d.transmission.confirmCancel}
              </button>

              <button
                type="button"
                autoFocus
                disabled={submitting}
                onClick={() => {
                  setConfirming(false);
                  submit();
                }}
                className="fx-btn-send"
              >
                {d.transmission.confirmSubmit}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
