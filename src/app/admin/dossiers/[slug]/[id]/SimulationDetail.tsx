import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { DossierStatus } from "@/db/schema";
import ModuleStatusButtons from "./ModuleStatusButtons";

/**
 * A tax simulation as the reference shows it to an administrator.
 *
 * A simulation collects figures, not documents, so the reference replaces the
 * dossier workspace with one read-only card: who sent it, three status
 * buttons, an eight-cell grid of the answers and the free-text note about the
 * deductions the client is considering.
 */
export default function SimulationDetail({
  t,
  slug,
  dossierId,
  clientName,
  clientEmail,
  status,
  express,
  cells,
  deductions,
}: {
  t: Messages;
  slug: string;
  dossierId: string;
  clientName: string;
  clientEmail: string;
  status: DossierStatus;
  express: boolean;
  /** The eight grid cells, in the reference's order. */
  cells: { label: string; value: string }[];
  deductions: string;
}) {
  return (
    <div className="max-w-[1040px]">
      <Link
        href={`/admin/dossiers/${slug}`}
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-strong"
      >
        ← {t.declaration.summary.backToList}
      </Link>

      <div className="mt-3 max-w-[760px] rounded-[18px] border border-line bg-card p-[26px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="disp text-[22px] font-bold">{clientName}</h1>
            <p className="mt-[3px] text-[14px] text-muted">{clientEmail}</p>
          </div>

          {express ? (
            <span className="inline-flex items-center rounded-full bg-[#FBE7E4] px-2.5 py-1 text-[11.5px] font-bold text-[#C0453B]">
              {t.admin.dossiers.expressBadge}
            </span>
          ) : null}
        </div>

        <ModuleStatusButtons dossierId={dossierId} status={status} />

        <div className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2">
          {cells.map((cell) => (
            <div key={cell.label} className="bg-card px-[18px] py-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-subtle">
                {cell.label}
              </div>
              <div className="mt-1 text-[15.5px] font-semibold text-strong">
                {cell.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[14px] border border-line bg-[#FBFCFD] px-[18px] py-4">
          <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-subtle">
            {t.simulationForm.deductionsLabel}
          </div>
          <div className="mt-1.5 whitespace-pre-line text-[14.5px] leading-[1.55] text-strong">
            {deductions || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
