"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { DossierStatus } from "@/db/schema";
import {
  CANTONS,
  STEPS,
  computePrice,
  requiredDocuments,
  DOCUMENT_CATALOGUE,
  ASSISTANCE_OPTIONS,
  type Answers,
  type AssistanceKey,
  type Child,
  type Property,
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
}: QuestionnaireProps) {
  const router = useRouter();
  const d = t.declaration;

  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [step, setStep] = useState(initialStep);
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
  const doneCount = docs.filter((k) => uploaded.has(k)).length;

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
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-teal-300 bg-teal-100/60 p-6">
                    <div className="max-w-[520px]">
                      <p className="disp m-0 text-[16px] font-bold">
                        {d.reuse.title.replace("{year}", String(previousYear))}
                      </p>
                      <p className="mt-1 text-[13.5px] leading-[1.45] text-body">
                        {d.reuse.body}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReused(true)}
                      className="fx-btn-send"
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
                    options={CANTONS.map((c) => ({ value: c, label: c }))}
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

                <Question label={d.accueil.express}>
                  <CheckRow
                    checked={answers.express}
                    onChange={(express) => patch({ express })}
                    label={d.accueil.express}
                  />
                </Question>

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
                        label={`${t.assistance.options[o.key]} — CHF ${o.price}`}
                      />
                    ))}
                  </div>
                </Question>

                <Question
                  label={d.accueil.taxationOffice}
                  hint={d.accueil.taxationOfficeHint}
                >
                  <RadioRow
                    name="taxationOffice"
                    value={answers.taxationOffice}
                    onChange={(v) =>
                      patch({ taxationOffice: v as Answers["taxationOffice"] })
                    }
                    options={yesNo}
                  />
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
                            { value: "scolarise", label: d.famille.situationScolarise },
                            { value: "etudiant", label: d.famille.situationEtudiant },
                            { value: "apprenti", label: d.famille.situationApprenti },
                            { value: "actif", label: d.famille.situationActif },
                          ]}
                        />
                      </div>

                      <p className="mt-4 text-[13.5px] text-body">
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
                  ))}
                </Question>
              </>
            ) : null}

            {step === 2 ? (
              <Question label={d.revenus.title} required>
                <div className="flex flex-col gap-2.5">
                  {(["salarie", "etudiant", "independant", "rentier", "chomage"] as const).map(
                    (k) => (
                      <CheckRow
                        key={k}
                        checked={!!answers.revenus[k]}
                        onChange={(on) =>
                          patch({ revenus: { ...answers.revenus, [k]: on } })
                        }
                        label={d.revenus[k]}
                      />
                    ),
                  )}
                </div>
              </Question>
            ) : null}

            {step === 3 ? (
              <>
                <Question label={d.fortune.title}>
                  <div className="flex flex-col gap-2.5">
                    {(
                      ["epargne", "titres", "crypto", "assuranceVie", "immeuble"] as const
                    ).map((k) => (
                      <CheckRow
                        key={k}
                        checked={!!answers.fortuneTypes[k]}
                        onChange={(on) =>
                          patch({
                            fortuneTypes: { ...answers.fortuneTypes, [k]: on },
                          })
                        }
                        label={d.fortune[k]}
                      />
                    ))}
                  </div>
                </Question>

                <Question label={d.fortune.dettes}>
                  <RadioRow
                    name="dettes"
                    value={answers.dettes}
                    onChange={(v) => patch({ dettes: v as Answers["dettes"] })}
                    options={yesNo}
                  />
                </Question>

                <Question label={d.fortune.heritage}>
                  <RadioRow
                    name="heritage"
                    value={answers.heritageEnCours}
                    onChange={(v) =>
                      patch({ heritageEnCours: v as Answers["heritageEnCours"] })
                    }
                    options={yesNo}
                  />
                </Question>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <Question label={d.immeubles.owner}>
                  <RadioRow
                    name="proprietaire"
                    value={answers.proprietaireImmeuble}
                    onChange={(v) =>
                      patch({
                        proprietaireImmeuble:
                          v as Answers["proprietaireImmeuble"],
                        immeubles:
                          v === "oui" && answers.immeubles.length === 0
                            ? [emptyProperty()]
                            : answers.immeubles,
                      })
                    }
                    options={yesNo}
                  />
                </Question>

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

                <Question label={d.immeubles.rentPaid}>
                  <RadioRow
                    name="loyers"
                    value={answers.loyersPayes}
                    onChange={(v) =>
                      patch({ loyersPayes: v as Answers["loyersPayes"] })
                    }
                    options={yesNo}
                  />
                </Question>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <Question label={d.deductions.pilier3}>
                  <CheckRow
                    checked={answers.pilier3}
                    onChange={(pilier3) => patch({ pilier3 })}
                    label={d.yes}
                  />
                </Question>

                <Question label={d.deductions.rachat2}>
                  <CheckRow
                    checked={answers.rachat2}
                    onChange={(rachat2) => patch({ rachat2 })}
                    label={d.yes}
                  />
                </Question>
              </>
            ) : null}

            {step === 6 ? (
              <TransmissionStep
                t={t}
                dossierId={dossierId}
                docs={docs}
                uploaded={uploaded}
                doneCount={doneCount}
                price={price}
                readOnly={readOnly}
                onUploaded={() => router.refresh()}
              />
            ) : null}

            {/* Per-page remark, as in the mockup */}
            {step < 6 ? (
              <Question label={d.remark}>
                <textarea
                  rows={3}
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

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goTo(step + 1)}
                  className="fx-btn-send"
                >
                  {d.next} →
                </button>
              ) : null}
            </div>
          </div>
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
}

function emptyChild(): Child {
  return {
    firstName: "",
    lastName: "",
    birthDate: "",
    avs: "",
    situation: "scolarise",
    contributions: "",
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
    hasDebt: "",
  };
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

function DocumentRow({
  t,
  dossierId,
  docKey,
  doc,
  readOnly,
  onChanged,
}: {
  t: Messages;
  dossierId: string;
  docKey: string;
  /** The deposited document for this category, if any. */
  doc: UploadedDoc | undefined;
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

  const ghostBtn =
    "rounded-lg border border-line-default px-3 py-2 text-[12.5px] font-medium text-brand transition hover:border-line-strong hover:bg-sunken disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-line bg-card px-4 py-3.5">
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-teal-100 text-brand">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-[18px] w-[18px]"
          aria-hidden="true"
        >
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M14 3v4h4" />
        </svg>
      </span>

      <span className="min-w-[180px] flex-1">
        <span className="disp block text-[15px] font-bold">
          {meta?.title ?? docKey}
        </span>
        {doc ? (
          <span className="mt-0.5 block truncate text-[12.5px] text-body" title={doc.filename}>
            {doc.filename}
          </span>
        ) : meta?.hint ? (
          <span className="mt-0.5 block text-[12.5px] text-muted">
            {meta.hint}
          </span>
        ) : null}
        {failed ? (
          <span className="mt-0.5 block text-[12.5px] text-[#A2443A]">
            {t.documents.errUpload}
          </span>
        ) : null}
      </span>

      <span
        className={`rounded-full px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] ${
          done ? "bg-green-100 text-green-600" : "bg-sunken text-muted"
        }`}
      >
        {done ? d.transmission.uploaded : d.transmission.toUpload}
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

      {/* Deposited: the client can always download; before submission they can
          also replace or remove it. Not deposited: a single upload button. */}
      {doc ? (
        <span className="flex shrink-0 flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={download} className={ghostBtn}>
            {d.transmission.download}
          </button>
          {readOnly ? null : (
            <>
              <button type="button" disabled={busy} onClick={() => input.current?.click()} className={ghostBtn}>
                {busy ? d.saving : d.transmission.replace}
              </button>
              <button type="button" disabled={busy} onClick={remove} className={ghostBtn}>
                {d.transmission.remove}
              </button>
            </>
          )}
        </span>
      ) : readOnly ? null : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="fx-btn-outline w-full shrink-0 px-4 py-2.5 sm:w-auto"
        >
          {busy ? d.saving : d.transmission.upload}
        </button>
      )}
    </div>
  );
}

/** Step 7: the price summary, the document checklist, and the submit button. */
function TransmissionStep({
  t,
  dossierId,
  docs,
  uploaded,
  doneCount,
  price,
  readOnly,
  onUploaded,
}: {
  t: Messages;
  dossierId: string;
  docs: string[];
  uploaded: Map<string, UploadedDoc>;
  doneCount: number;
  price: ReturnType<typeof computePrice>;
  readOnly: boolean;
  onUploaded: () => void;
}) {
  const d = t.declaration;
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = doneCount >= docs.length;

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
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-7">
      <h2 className="disp m-0 text-[20px] font-extrabold">
        {d.transmission.title}
      </h2>
      <p className="mt-1 text-[13.5px] text-muted">
        {docs.length} {d.transmission.note}
      </p>

      <div className="mt-5 rounded-[var(--radius-md)] bg-sunken p-5">
        <span className="fx-eyebrow text-[var(--text-muted)]">
          {d.transmission.priceTitle}
        </span>

        <div className="mt-3 flex flex-col gap-2">
          {price.lines.map((line) => (
            <div
              key={line.key + (line.count ?? "")}
              className="flex items-baseline justify-between gap-4 text-[14px] text-body"
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

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <span className="text-[15px] font-semibold text-strong">
            {d.transmission.total}
          </span>
          <span
            className="fx-figure text-[26px] font-extrabold leading-none"
            style={{ color: "var(--brand)" }}
          >
            CHF {price.total}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] bg-sunken px-5 py-4">
        <div className="flex items-center justify-between gap-4 text-[13.5px]">
          <span className="text-body">
            {d.transmission.progress
              .replace("{done}", String(doneCount))
              .replace("{total}", String(docs.length))}
          </span>
          <span className="fx-figure font-semibold text-strong">
            {docs.length === 0
              ? "0%"
              : `${Math.round((doneCount / docs.length) * 100)}%`}
          </span>
        </div>

        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width]"
            style={{
              width: `${docs.length === 0 ? 0 : (doneCount / docs.length) * 100}%`,
            }}
          />
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
            readOnly={readOnly}
            onChanged={onUploaded}
          />
        ))}
      </div>

      {readOnly ? (
        <p className="mt-5 rounded-[10px] border border-teal-300 bg-teal-100/60 px-4 py-3 text-[13.5px] text-brand">
          {d.transmission.submitted}
        </p>
      ) : (
        <div className="mt-6 flex flex-col items-end gap-2">
          {!complete ? (
            <p className="text-right text-[13px] text-[#B26A00]">
              {d.transmission.submitHint}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="text-right text-[13px] text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={submitting || !complete}
            className="fx-btn-send"
          >
            {submitting ? d.transmission.submitting : d.transmission.submit}
          </button>
        </div>
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
