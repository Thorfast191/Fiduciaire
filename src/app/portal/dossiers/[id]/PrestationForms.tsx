"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n/I18nProvider";
import { TextField, SelectField, CheckRow } from "@/components/declaration/Field";
import { FormAlert } from "@/components/ui/Field";
import { CANTONS } from "@/lib/declaration";
import { usePrestation, type PrestationDoc } from "./usePrestation";

/**
 * The reference's bespoke prestation forms — simulation, acomptes, relecture —
 * sharing the plumbing in `usePrestation`. Each stores its fields in the
 * dossier's answers JSONB and submits directly (the firm prices these).
 */

const str = (v: unknown) => (typeof v === "string" ? v : "");
const bool = (v: unknown) => v === true;

function Card({
  title,
  note,
  children,
}: {
  title?: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6">
      {title ? <p className="disp m-0 text-[17px] font-bold">{title}</p> : null}
      {note ? (
        <p className="mt-1 text-[13.5px] leading-[1.45] text-muted">{note}</p>
      ) : null}
      <div className={title || note ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

function TransmitButton({
  label,
  busyLabel,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={onClick}
      className="flex h-[48px] w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      style={{ color: "#fff" }}
    >
      {busy ? busyLabel : `${label} →`}
    </button>
  );
}

function DocRow({
  title,
  hint,
  doc,
  busy,
  labels,
  onUpload,
  onDownload,
  onRemove,
}: {
  title: string;
  hint: string;
  doc: PrestationDoc | undefined;
  busy: boolean;
  labels: { upload: string; download: string; remove: string };
  onUpload: (file: File) => void;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-sunken px-4 py-3.5">
      <span className="flex min-w-[180px] flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-brand">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-[17px] w-[17px]"
            aria-hidden="true"
          >
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M14 3v4h4" />
          </svg>
        </span>
        <span className="flex flex-col">
          <span className="text-[14px] font-semibold text-strong">{title}</span>
          <span className="text-[12.5px] text-muted">
            {doc ? doc.filename : hint}
          </span>
        </span>
      </span>

      {doc ? (
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDownload(doc.id)}
            className="rounded-lg border border-line-default px-3 py-1.5 text-[12px] font-medium text-brand transition hover:bg-card"
          >
            {labels.download}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRemove(doc.id)}
            className="rounded-lg border border-line-default px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-card disabled:opacity-60"
          >
            {labels.remove}
          </button>
        </span>
      ) : (
        <label className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">
          {labels.upload}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            disabled={busy}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

function Transmitted({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-xs)]">
      <h2 className="disp m-0 text-[18px] font-bold">{title}</h2>
      <p className="mt-1.5 text-[14px] leading-[1.5] text-muted">{body}</p>
    </div>
  );
}

/* ------------------------------- Simulation ------------------------------- */

export function SimulationForm({
  dossierId,
  taxYear,
}: {
  dossierId: string;
  taxYear: number;
}) {
  const t = useT();
  const f = t.simulationForm;
  const p = usePrestation(dossierId);

  const [canton, setCanton] = useState("");
  const [express, setExpress] = useState(false);
  const [marital, setMarital] = useState("celibataire");
  const [children, setChildren] = useState("0");
  const [revenus, setRevenus] = useState("");
  const [fortune, setFortune] = useState("");
  const [proprio, setProprio] = useState(false);
  const [deductions, setDeductions] = useState("");

  useEffect(() => {
    if (!p.loaded) return;
    setCanton(str(p.answers.canton));
    setExpress(bool(p.answers.express));
    setMarital(str(p.answers.etatCivil) || "celibataire");
    setChildren(str(p.answers.simChildren) || "0");
    setRevenus(str(p.answers.simRevenus));
    setFortune(str(p.answers.simFortune));
    setProprio(bool(p.answers.simProprietaire));
    setDeductions(str(p.answers.simDeductions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.loaded]);

  if (!p.loaded) return <p className="text-[13px] text-muted">{t.documents.loading}</p>;
  if (p.status !== "not_started")
    return <Transmitted title={f.transmittedTitle} body={f.transmittedBody} />;

  const marOpts = [
    { value: "celibataire", label: t.declaration.famille.celibataire },
    { value: "marie", label: t.declaration.famille.marie },
    { value: "partenariat", label: t.declaration.famille.partenariat },
    { value: "divorce", label: t.declaration.famille.divorce },
    { value: "veuf", label: t.declaration.famille.veuf },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SelectField
          label={f.periodLabel}
          value={String(taxYear)}
          onChange={() => {}}
          options={[{ value: String(taxYear), label: String(taxYear) }]}
        />
      </Card>

      <Card>
        <SelectField
          label={f.cantonLabel}
          value={canton}
          onChange={setCanton}
          options={[
            { value: "", label: f.cantonPlaceholder },
            ...CANTONS.map((c) => ({ value: c, label: c })),
          ]}
        />
      </Card>

      <Card>
        <CheckRow checked={express} onChange={setExpress} label={f.express} />
      </Card>

      <Card title={f.familyTitle}>
        <div className="flex flex-wrap gap-3">
          <SelectField
            label={f.maritalLabel}
            value={marital}
            onChange={setMarital}
            options={marOpts}
          />
          <TextField
            label={f.childrenLabel}
            type="number"
            value={children}
            onChange={setChildren}
          />
        </div>
      </Card>

      <Card title={f.revenusTitle} note={f.revenusNote}>
        <TextField
          label={f.revenusLabel}
          type="number"
          value={revenus}
          onChange={setRevenus}
        />
      </Card>

      <Card title={f.fortuneTitle} note={f.fortuneNote}>
        <TextField
          label={f.fortuneLabel}
          type="number"
          value={fortune}
          onChange={setFortune}
        />
      </Card>

      <Card title={f.immeublesTitle}>
        <CheckRow checked={proprio} onChange={setProprio} label={f.proprietaire} />
      </Card>

      <Card title={f.deductionsTitle}>
        <textarea
          value={deductions}
          onChange={(e) => setDeductions(e.target.value)}
          placeholder={f.deductionsPlaceholder}
          className="min-h-[96px] w-full resize-y rounded-[var(--radius-md)] border border-line-default bg-card px-3.5 py-3 text-[14px] text-strong outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </Card>

      <div className="rounded-[var(--radius-lg)] border border-[var(--green-600)]/30 bg-[var(--green-100)] p-5">
        <p className="disp m-0 text-[16px] font-bold text-strong">
          {f.transmitTitle}
        </p>
        <p className="mt-1 text-[13.5px] leading-[1.45] text-muted">
          {f.transmitNote}
        </p>
        {p.error ? (
          <div className="mt-3">
            <FormAlert variant="error">{p.error}</FormAlert>
          </div>
        ) : null}
        <div className="mt-4">
          <TransmitButton
            label={f.transmit}
            busyLabel={f.transmitting}
            busy={p.busy}
            onClick={() =>
              p.finalize(
                {
                  canton,
                  express,
                  etatCivil: marital,
                  simChildren: children,
                  simRevenus: revenus,
                  simFortune: fortune,
                  simProprietaire: proprio,
                  simDeductions: deductions,
                },
                f.error,
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Acomptes -------------------------------- */

export function AcomptesForm({
  dossierId,
  taxYear,
}: {
  dossierId: string;
  taxYear: number;
}) {
  const t = useT();
  const f = t.acomptesForm;
  const p = usePrestation(dossierId);

  const [canton, setCanton] = useState("");
  const [express, setExpress] = useState(false);
  const [revenu, setRevenu] = useState("");
  const [fortune, setFortune] = useState("");
  const [autres, setAutres] = useState("");
  const [charges, setCharges] = useState("");

  useEffect(() => {
    if (!p.loaded) return;
    setCanton(str(p.answers.canton));
    setExpress(bool(p.answers.express));
    setRevenu(str(p.answers.acoRevenu));
    setFortune(str(p.answers.acoFortune));
    setAutres(str(p.answers.acoAutres));
    setCharges(str(p.answers.acoCharges));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.loaded]);

  if (!p.loaded) return <p className="text-[13px] text-muted">{t.documents.loading}</p>;
  if (p.status !== "not_started")
    return <Transmitted title={f.transmittedTitle} body={f.transmittedBody} />;

  const doc = p.docs.find((d) => d.category === "formulaireAcomptes");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SelectField
          label={f.periodLabel}
          value={String(taxYear)}
          onChange={() => {}}
          options={[{ value: String(taxYear), label: String(taxYear) }]}
        />
      </Card>

      <Card>
        <SelectField
          label={f.cantonLabel}
          value={canton}
          onChange={setCanton}
          options={[
            { value: "", label: f.cantonPlaceholder },
            ...CANTONS.map((c) => ({ value: c, label: c })),
          ]}
        />
      </Card>

      <Card>
        <CheckRow checked={express} onChange={setExpress} label={f.express} />
      </Card>

      <Card title={f.rfTitle}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label={f.revenu} type="number" value={revenu} onChange={setRevenu} />
          <TextField label={f.fortune} type="number" value={fortune} onChange={setFortune} />
          <TextField label={f.autres} type="number" value={autres} onChange={setAutres} />
          <TextField label={f.charges} type="number" value={charges} onChange={setCharges} />
        </div>
      </Card>

      <div className="rounded-[var(--radius-lg)] border border-[var(--amber-600)]/30 bg-[var(--amber-100)] p-5">
        <p className="disp m-0 text-[16px] font-bold text-strong">
          {f.transmitTitle}
        </p>
        <p className="mt-1 text-[13.5px] leading-[1.45] text-muted">
          {f.transmitNote}
        </p>
        <div className="mt-4">
          <DocRow
            title={f.docTitle}
            hint={f.docHint}
            doc={doc}
            busy={p.busy}
            labels={{ upload: f.upload, download: f.download, remove: f.remove }}
            onUpload={(file) =>
              p.upload(file, "formulaireAcomptes", {
                type: t.documents.errType,
                big: t.documents.errTooLarge,
                generic: f.error,
              })
            }
            onDownload={p.download}
            onRemove={p.removeDoc}
          />
        </div>
        {p.error ? (
          <div className="mt-3">
            <FormAlert variant="error">{p.error}</FormAlert>
          </div>
        ) : null}
        <div className="mt-4">
          <TransmitButton
            label={f.transmit}
            busyLabel={f.transmitting}
            busy={p.busy}
            disabled={!doc}
            onClick={() => {
              if (!doc) {
                p.setError(f.needDoc);
                return;
              }
              p.finalize(
                {
                  canton,
                  express,
                  acoRevenu: revenu,
                  acoFortune: fortune,
                  acoAutres: autres,
                  acoCharges: charges,
                },
                f.error,
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Relecture ------------------------------- */

const RELECTURE_FEE = 50;

export function RelectureForm({
  dossierId,
  taxYear,
}: {
  dossierId: string;
  taxYear: number;
}) {
  const t = useT();
  const f = t.relectureForm;
  const p = usePrestation(dossierId);

  const [situation, setSituation] = useState("seule");

  useEffect(() => {
    if (!p.loaded) return;
    setSituation(str(p.answers.relSituation) || "seule");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.loaded]);

  if (!p.loaded) return <p className="text-[13px] text-muted">{t.documents.loading}</p>;
  if (p.status !== "not_started")
    return <Transmitted title={f.transmittedTitle} body={f.transmittedBody} />;

  const doc = p.docs.find((d) => d.category === "copieDeclaration");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SelectField
          label={f.periodLabel}
          value={String(taxYear)}
          onChange={() => {}}
          options={[{ value: String(taxYear), label: String(taxYear) }]}
        />
      </Card>

      <Card title={f.situationTitle}>
        <div className="flex flex-col gap-2.5">
          {[
            { value: "seule", label: f.seule },
            { value: "couple", label: f.couple },
          ].map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-3 text-[15px] text-body"
            >
              <input
                type="radio"
                name="rel-situation"
                checked={situation === o.value}
                onChange={() => setSituation(o.value)}
                className="h-[18px] w-[18px] accent-[var(--brand)]"
              />
              <span className={situation === o.value ? "font-semibold text-strong" : ""}>
                {o.label}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <span className="text-[15px] font-semibold text-strong">
            {f.priceLabel}
          </span>
          <span
            className="fx-figure text-[22px] font-extrabold leading-none"
            style={{ color: "var(--brand)" }}
          >
            CHF {RELECTURE_FEE}
          </span>
        </div>
      </Card>

      <div className="rounded-[var(--radius-lg)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]">
        <p className="disp m-0 text-[16px] font-bold text-strong">
          {f.transmitTitle}
        </p>
        <p className="mt-1 text-[13.5px] leading-[1.45] text-muted">
          {f.transmitNote}
        </p>
        <div className="mt-4">
          <DocRow
            title={f.docTitle}
            hint={f.docHint}
            doc={doc}
            busy={p.busy}
            labels={{ upload: f.upload, download: f.download, remove: f.remove }}
            onUpload={(file) =>
              p.upload(file, "copieDeclaration", {
                type: t.documents.errType,
                big: t.documents.errTooLarge,
                generic: f.error,
              })
            }
            onDownload={p.download}
            onRemove={p.removeDoc}
          />
        </div>
        {p.error ? (
          <div className="mt-3">
            <FormAlert variant="error">{p.error}</FormAlert>
          </div>
        ) : null}
        <div className="mt-4">
          <TransmitButton
            label={f.transmit}
            busyLabel={f.transmitting}
            busy={p.busy}
            disabled={!doc}
            onClick={() => {
              if (!doc) {
                p.setError(f.needDoc);
                return;
              }
              p.finalize({ relSituation: situation }, f.error);
            }}
          />
        </div>
      </div>
    </div>
  );
}
