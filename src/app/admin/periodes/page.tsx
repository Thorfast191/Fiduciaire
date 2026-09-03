import Link from "next/link";
import { listTaxPeriods } from "@/lib/taxPeriods";
import { getT } from "@/lib/i18n";
import PeriodsManager from "./PeriodsManager";

/**
 * Fiscal-period management, matching the mockup's admin "Périodes fiscales"
 * artboard: a card listing every period with an Active badge and an
 * activate/deactivate control, plus a button that opens the next year.
 */
export default async function AdminPeriodsPage() {
  const [periods, { t }] = await Promise.all([listTaxPeriods(), getT()]);

  const nextYear = (periods[0]?.year ?? new Date().getFullYear() - 1) + 1;

  return (
    <div className="max-w-[1040px]">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-strong"
      >
        ← {t.admin.backHome}
      </Link>

      <h1 className="disp mt-2.5 text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
        {t.admin.periods.title}
      </h1>

      <PeriodsManager
        periods={periods.map((p) => ({ year: p.year, isActive: p.isActive }))}
        nextYear={nextYear}
      />
    </div>
  );
}
