import { getCurrentUser } from "@/lib/auth/guards";
import DossierList from "./DossierList";

/**
 * Client home, rebuilt to the mockup's "NOUVEL ESPACE CLIENT" accueil
 * (`Fiduvia.dc.html:1535`): greeting + période pill, then a two-column body of
 * dossiers beside the Délais column. The mockup's single "active declaration"
 * card is replaced by the real dossier list, since this platform tracks one
 * dossier per tax year rather than one live form.
 */
export default async function PortalHomePage() {
  const user = await getCurrentUser();

  const firstName = user?.firstName || "Client";
  const email = user?.email || "";

  // The mockup derives both deadlines from the tax period's following year.
  const taxYear = new Date().getFullYear() - 1;

  return (
    <div className="max-w-[1000px]">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            Bonjour {firstName}
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">
            Voici où en sont vos démarches fiscales.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-line-default bg-card px-4 py-2.5 text-[14px] font-semibold text-strong">
          Période {taxYear}
        </span>
      </div>

      {/* Body */}
      <div className="mt-6 flex flex-wrap items-start gap-5">
        {/* Dossiers */}
        <div className="min-w-[280px] flex-[1.6]">
          <h2 className="disp mb-3.5 text-[20px] font-bold">
            Mes dossiers fiscaux
          </h2>

          <DossierList />

          <h2 className="disp mb-3.5 mt-10 text-[20px] font-bold">
            Documents d&apos;aide
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <HelpDoc label="Liste des documents à fournir" />
            <HelpDoc label="Marche à suivre du site" />
          </div>
        </div>

        {/* Délais */}
        <div className="flex min-w-[240px] flex-1 flex-col gap-4">
          <h2 className="disp -mb-0.5 text-[20px] font-bold">Délais</h2>

          <DeadlineCard
            label="Première échéance"
            date={`15 mars ${taxYear + 1}`}
            note="Délai légal pour déposer sa déclaration d'impôt."
          />

          <DeadlineCard
            label="Deuxième échéance"
            date={`30 juin ${taxYear + 1}`}
            note="Délai de tolérance pour déposer sa déclaration d'impôt sans démarches."
          />

          <div className="rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              Votre compte
            </span>

            <p className="mt-1.5 truncate text-[14px] font-medium text-strong">
              {email}
            </p>

            <p className="mt-1 text-[12.5px] leading-[1.4] text-muted">
              Votre espace est personnel. Vos documents ne sont accessibles
              qu&apos;aux personnes autorisées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpDoc({ label }: { label: string }) {
  return (
    <div className="flex min-h-[112px] flex-col gap-2 rounded-[var(--radius-md)] border border-line bg-card p-4 shadow-[var(--shadow-xs)]">
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

      <span className="mt-auto font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
        Bientôt disponible
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
