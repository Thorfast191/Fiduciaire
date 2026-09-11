"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n/I18nProvider";
import {
  TextField,
  SelectField,
  CheckRow,
  RadioRow,
} from "@/components/declaration/Field";
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
  accent = { bg: "#D9EFEC", color: "var(--brand)" },
  onUpload,
  onDownload,
  onRemove,
}: {
  title: string;
  hint: string;
  doc: PrestationDoc | undefined;
  busy: boolean;
  labels: { upload: string; download: string; remove: string };
  /** Icon-tile colour; the prestation's accent (teal by default, amber for acomptes). */
  accent?: { bg: string; color: string };
  onUpload: (file: File) => void;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const outlineBtn =
    "flex-shrink-0 inline-flex items-center gap-[7px] rounded-[10px] border px-[15px] py-[10px] text-[14px] font-semibold";
  const outlineStyle = { borderColor: "#CCC8BD", background: "#fff", color: "#145863" };
  return (
    <div
      className="flex flex-wrap items-center gap-[14px] rounded-[12px] border p-4"
      style={{ background: "#FBFCFD", borderColor: "#EEF0F4" }}
    >
      <span
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: accent.bg, color: accent.color }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[14.5px] font-semibold text-strong">{title}</span>
        <span className="truncate text-[12.5px] text-[#8B97A8]">
          {doc ? doc.filename : hint}
        </span>
      </span>

      {doc ? (
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDownload(doc.id)}
            className={outlineBtn}
            style={outlineStyle}
          >
            {labels.download}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRemove(doc.id)}
            className="inline-flex flex-shrink-0 items-center rounded-[10px] border px-[15px] py-[10px] text-[14px] font-semibold disabled:opacity-60"
            style={{ borderColor: "#ECC9C9", background: "#fff", color: "#C0584A" }}
          >
            {labels.remove}
          </button>
        </span>
      ) : (
        <label className={`cursor-pointer ${outlineBtn}`} style={outlineStyle}>
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

interface SimImmeuble {
  lieu: string;
  acqDate: string;
  alienDate: string;
  loue: "oui" | "non" | "";
  dette: "oui" | "non" | "";
}
const emptySimImmeuble = (): SimImmeuble => ({
  lieu: "",
  acqDate: "",
  alienDate: "",
  loue: "",
  dette: "",
});

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

  const [periode, setPeriode] = useState(String(taxYear));
  const [canton, setCanton] = useState("");
  const [express, setExpress] = useState(false);
  const [marital, setMarital] = useState("celibataire");
  const [children, setChildren] = useState("0");
  const [revenus, setRevenus] = useState("");
  const [fortune, setFortune] = useState("");
  const [proprio, setProprio] = useState(false);
  const [immeubles, setImmeubles] = useState<SimImmeuble[]>([]);
  const [deductions, setDeductions] = useState("");

  useEffect(() => {
    if (!p.loaded) return;
    setPeriode(str(p.answers.simPeriode) || String(taxYear));
    setCanton(str(p.answers.canton));
    setExpress(bool(p.answers.express));
    setMarital(str(p.answers.etatCivil) || "celibataire");
    setChildren(str(p.answers.simChildren) || "0");
    setRevenus(str(p.answers.simRevenus));
    setFortune(str(p.answers.simFortune));
    setProprio(bool(p.answers.simProprietaire));
    setImmeubles(
      Array.isArray(p.answers.simImmeubles)
        ? (p.answers.simImmeubles as SimImmeuble[])
        : [],
    );
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
  const cy = new Date().getFullYear();
  const periodOpts = [cy - 3, cy - 2, cy - 1, cy].map((y) => ({
    value: String(y),
    label: String(y),
  }));
  const childrenOpts = Array.from({ length: 9 }, (_, n) => ({
    value: String(n),
    label: String(n),
  }));
  const yesNo = [
    { value: "oui", label: t.declaration.yes },
    { value: "non", label: t.declaration.no },
  ];

  function setOwner(on: boolean) {
    setProprio(on);
    if (on && immeubles.length === 0) setImmeubles([emptySimImmeuble()]);
  }
  function patchImm(i: number, patch: Partial<SimImmeuble>) {
    setImmeubles((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title={f.periodLabel}>
        <div className="max-w-[200px]">
          <SelectField
            label=""
            value={periode}
            onChange={setPeriode}
            options={periodOpts}
          />
        </div>
      </Card>

      <Card title={f.cantonLabel}>
        <div className="max-w-[340px]">
          <SelectField
            label=""
            value={canton}
            onChange={setCanton}
            options={[
              { value: "", label: f.cantonPlaceholder },
              ...CANTONS.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <CheckRow checked={express} onChange={setExpress} label={f.express} />
          <span
            className="shrink-0 whitespace-nowrap rounded-full px-[10px] py-[4px] text-[12.5px] font-bold"
            style={{ background: "#D9EFEC", color: "#145863" }}
          >
            {f.expressPill}
          </span>
        </div>
      </Card>

      <Card title={f.familyTitle}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label={f.maritalLabel}
            value={marital}
            onChange={setMarital}
            options={marOpts}
          />
          <SelectField
            label={f.childrenLabel}
            value={children}
            onChange={setChildren}
            options={childrenOpts}
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
        <CheckRow checked={proprio} onChange={setOwner} label={f.proprietaire} />

        {proprio ? (
          <div className="mt-[18px] flex flex-col gap-[14px]">
            {immeubles.map((im, i) => (
              <div
                key={i}
                className="rounded-[14px] border border-line p-5"
              >
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="text-[14.5px] font-bold text-strong">
                    {f.immeubleEntry} {i + 1}
                  </span>
                  <button
                    type="button"
                    aria-label={t.declaration.transmission.remove}
                    onClick={() =>
                      setImmeubles((rows) => rows.filter((_, idx) => idx !== i))
                    }
                    className="flex p-1 text-[#9AA6B6] transition hover:text-[#C0584A]"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-x-[18px] gap-y-[14px] sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <TextField
                      label={f.lieuLabel}
                      value={im.lieu}
                      onChange={(v) => patchImm(i, { lieu: v })}
                    />
                  </div>
                  <TextField
                    label={f.acqLabel}
                    type="date"
                    value={im.acqDate}
                    onChange={(v) => patchImm(i, { acqDate: v })}
                  />
                  <TextField
                    label={f.alienLabel}
                    type="date"
                    value={im.alienDate}
                    onChange={(v) => patchImm(i, { alienDate: v })}
                  />
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-[14px] font-semibold text-body">
                      {f.loueLabel}
                    </p>
                    <RadioRow
                      name={`sim-loue-${i}`}
                      value={im.loue}
                      onChange={(v) =>
                        patchImm(i, { loue: v as SimImmeuble["loue"] })
                      }
                      options={yesNo}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-[14px] font-semibold text-body">
                      {f.detteLabel}
                    </p>
                    <RadioRow
                      name={`sim-dette-${i}`}
                      value={im.dette}
                      onChange={(v) =>
                        patchImm(i, { dette: v as SimImmeuble["dette"] })
                      }
                      options={yesNo}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setImmeubles((rows) => [...rows, emptySimImmeuble()])
              }
              className="self-start rounded-[10px] px-4 py-2.5 text-[14px] font-semibold"
              style={{ background: "#E6F6EE", color: "#186B47" }}
            >
              {f.addImmeuble}
            </button>
          </div>
        ) : null}
      </Card>

      <Card title={f.deductionsTitle}>
        <textarea
          value={deductions}
          onChange={(e) => setDeductions(e.target.value)}
          placeholder={f.deductionsPlaceholder}
          className="min-h-[96px] w-full resize-y rounded-[var(--radius-md)] border border-line-default bg-card px-3.5 py-3 text-[14px] text-strong outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </Card>

      <div
        className="rounded-[16px] border p-6"
        style={{ background: "#F1FAF5", borderColor: "#BFE6D3" }}
      >
        <p className="m-0 text-[16px] font-bold" style={{ color: "#186B47" }}>
          {f.transmitTitle}
        </p>
        <p
          className="mt-2 text-[14px] leading-[1.55]"
          style={{ color: "#2E6B4E" }}
        >
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
                  simPeriode: periode,
                  canton,
                  express,
                  etatCivil: marital,
                  simChildren: children,
                  simRevenus: revenus,
                  simFortune: fortune,
                  simProprietaire: proprio,
                  simImmeubles: proprio ? immeubles : [],
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

  const [periode, setPeriode] = useState(String(taxYear));
  const [canton, setCanton] = useState("");
  const [express, setExpress] = useState(false);
  const [revenu, setRevenu] = useState("");
  const [fortune, setFortune] = useState("");
  const [autres, setAutres] = useState("");
  const [charges, setCharges] = useState("");

  useEffect(() => {
    if (!p.loaded) return;
    setPeriode(str(p.answers.acoPeriode) || String(taxYear));
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
  const cy = new Date().getFullYear();
  const periodOpts = [cy - 3, cy - 2, cy - 1, cy].map((y) => ({
    value: String(y),
    label: String(y),
  }));

  return (
    <div className="flex flex-col gap-4">
      <Card title={f.periodLabel}>
        <div className="max-w-[200px]">
          <SelectField
            label=""
            value={periode}
            onChange={setPeriode}
            options={periodOpts}
          />
        </div>
      </Card>

      <Card title={f.cantonLabel}>
        <div className="max-w-[340px]">
          <SelectField
            label=""
            value={canton}
            onChange={setCanton}
            options={[
              { value: "", label: f.cantonPlaceholder },
              ...CANTONS.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <CheckRow checked={express} onChange={setExpress} label={f.express} />
          <span
            className="shrink-0 whitespace-nowrap rounded-full px-[10px] py-[4px] text-[12.5px] font-bold"
            style={{ background: "#D9EFEC", color: "#145863" }}
          >
            {f.expressPill}
          </span>
        </div>
      </Card>

      <Card title={f.rfTitle}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label={f.revenu} type="number" value={revenu} onChange={setRevenu} />
          <TextField label={f.fortune} type="number" value={fortune} onChange={setFortune} />
          <TextField label={f.autres} type="number" value={autres} onChange={setAutres} />
          <TextField label={f.charges} type="number" value={charges} onChange={setCharges} />
        </div>
      </Card>

      <div
        className="rounded-[16px] border p-6"
        style={{ background: "#FFF8EF", borderColor: "#F2D9A9" }}
      >
        <p className="m-0 text-[16px] font-bold" style={{ color: "#8E5500" }}>
          {f.transmitTitle}
        </p>
        <p
          className="mt-2 text-[14px] leading-[1.55]"
          style={{ color: "#8E6220" }}
        >
          {f.transmitNote}
        </p>
        <div className="mt-4">
          <DocRow
            title={f.docTitle}
            hint={f.docHint}
            doc={doc}
            busy={p.busy}
            accent={{ bg: "#FBEFE3", color: "#B26A00" }}
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
                  acoPeriode: periode,
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
