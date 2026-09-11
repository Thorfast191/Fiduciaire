import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { listDossiersForClient } from "@/lib/dossiers";
import { listPeriodOptions, isActivePeriod } from "@/lib/taxPeriods";
import { resolvePeriod } from "@/lib/adminPeriod";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { StartDeclaration } from "./StartDeclaration";
import { declarationProgress, normaliseAnswers } from "@/lib/declaration";
import { getT } from "@/lib/i18n";

/**
 * Client home, matching the mockup's "NOUVEL ESPACE CLIENT" accueil
 * (`Fiduvia.dc.html:1535`): greeting and période picker, one prominent card for
 * the declaration of the selected period, then Documents d'aide beside Délais.
 *
 * The period drives the card, so a client with several tax years sees one
 * declaration at a time rather than a list — the mockup's own model.
 */
export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const [{ periode }, user, { locale, t }] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getT(),
  ]);

  const firstName = user?.firstName || "Client";

  // The portal home is the declaration home, so only declaration dossiers count
  // here — otherwise a simulation/acomptes request for the same year could be
  // picked up and "Ouvrir ma déclaration" would open that instead.
  const dossiers = user
    ? await listDossiersForClient(user.id, "declaration")
    : [];
  const dossierYears = dossiers.map((d) => d.taxYear);

  // Offer every period the firm has opened, plus any year this client already
  // has a dossier for, so an older dossier never becomes unreachable.
  const options = Array.from(
    new Set([...(await listPeriodOptions(dossierYears)), ...dossierYears]),
  ).sort((a, b) => b - a);

  const selected = resolvePeriod(options, periode);
  const dossier = dossiers.find((d) => d.taxYear === selected);
  const done = dossier?.status === "completed";

  // How far the client has filled the questionnaire. Above zero, the card
  // switches from "Ouvrir" to "Continuer" and shows a progress bar, matching
  // the mockup; a started declaration also skips the situation pop-up.
  const progress = dossier ? declarationProgress(normaliseAnswers(dossier.answers)) : 0;
  const started = !done && progress > 0;

  // With no dossier yet, the client can start one themselves — but only for a
  // period the firm has opened, the same gate the create route enforces.
  const canStart = !dossier && (await isActivePeriod(selected));

  const dayMonth = new Intl.DateTimeFormat(
    locale === "fr" ? "fr-CH" : "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="max-w-[1000px]">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {t.portal.greeting} {firstName}
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">
            {t.portal.greetingSub}
          </p>
        </div>

        <PeriodPicker years={options} current={selected} />
      </div>

      {/* Active declaration */}
      <div className="mt-6 flex flex-wrap items-center gap-6 rounded-[var(--radius-lg)] border border-line bg-card px-6 py-6 shadow-[var(--shadow-md)]">
        <div className="min-w-[220px] flex-1">
          {dossier ? (
            <>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                  done ? "text-green-600" : "text-brand"
                }`}
              >
                {done ? t.portal.declEyebrowDone : t.portal.declEyebrowTodo} ·{" "}
                {selected}
              </span>

              <div className="disp mt-1.5 text-[24px] font-bold">
                {t.portal.declTitle} {selected}
              </div>

              <p className="mt-1 text-[13.5px] text-muted">
                {t.portal.declSub}
              </p>

              {started ? (
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-sunken">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="fx-figure text-[13px] font-semibold text-muted">
                    {progress}%
                  </span>
                </div>
              ) : done ? (
                <div className="mt-4">
                  <StatusBadge status={dossier.status} />
                </div>
              ) : null}
            </>
          ) : canStart ? (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand">
                {t.portal.declEyebrowTodo} · {selected}
              </span>

              <div className="disp mt-1.5 text-[24px] font-bold">
                {t.portal.declTitle} {selected}
              </div>

              <p className="mt-1 text-[13.5px] text-muted">
                {t.portal.declSub}
              </p>
            </>
          ) : (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                {selected}
              </span>

              <div className="disp mt-1.5 text-[24px] font-bold">
                {t.portal.declNoneTitle}
              </div>

              <p className="mt-1 text-[13.5px] text-muted">
                {t.portal.declNoneSub}
              </p>
            </>
          )}
        </div>

        {dossier ? (
          <Link
            href={
              started || done
                ? `/portal/dossiers/${dossier.id}`
                : `/portal/dossiers/${dossier.id}?situation=1`
            }
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-brand px-[22px] py-3 text-[15px] font-semibold transition-colors hover:bg-brand-hover"
            style={{ color: "#fff" }}
          >
            {started ? t.portal.declContinue : t.portal.declOpen} →
          </Link>
        ) : canStart ? (
          <StartDeclaration t={t} year={selected} />
        ) : null}
      </div>

      {/* Help documents beside deadlines */}
      <div className="mt-6 flex flex-wrap items-start gap-5">
        <div className="min-w-[280px] flex-[1.6]">
          <h2 className="disp mb-3.5 text-[20px] font-bold">
            {t.portal.helpDocsTitle}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <HelpDoc label={t.portal.helpDoc1} format={t.portal.helpDocFormat} />
            <HelpDoc label={t.portal.helpDoc2} format={t.portal.helpDocFormat} />
          </div>
        </div>

        <div className="flex min-w-[240px] flex-1 flex-col gap-4">
          <h2 className="disp -mb-0.5 text-[20px] font-bold">
            {t.portal.deadlinesTitle}
          </h2>

          <DeadlineCard
            label={t.portal.deadline1Label}
            date={dayMonth.format(new Date(selected + 1, 2, 15))}
            note={t.portal.deadline1Note}
          />

          <DeadlineCard
            label={t.portal.deadline2Label}
            date={dayMonth.format(new Date(selected + 1, 5, 30))}
            note={t.portal.deadline2Note}
          />

          <DeadlineCard
            label={t.portal.deadline3Label}
            date={dayMonth.format(new Date(selected + 1, 8, 30))}
            note={t.portal.deadline3Note}
          />
        </div>
      </div>
    </div>
  );
}

function HelpDoc({ label, format }: { label: string; format: string }) {
  return (
    <div className="flex min-h-[112px] flex-col gap-2 rounded-[var(--radius-md)] border border-line bg-card p-4 shadow-[var(--shadow-xs)] transition-colors hover:border-line-strong">
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-teal-100 text-brand">
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
          <path d="M9 12h6M9 16h6" />
        </svg>
      </span>

      <span className="disp text-[16px] font-bold">{label}</span>

      <span className="mt-auto flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
        {format}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[13px] w-[13px] text-brand"
          aria-hidden="true"
        >
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
        </svg>
      </span>
    </div>
  );
}

function DeadlineCard({
  label,
  date,
  note,
}: {
  label: string;
  date: string;
  note: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
        {label}
      </span>

      <div className="disp mt-1.5 text-[20px] font-bold">{date}</div>

      <p className="mt-1 text-[12.5px] leading-[1.4] text-muted">{note}</p>
    </div>
  );
}
