import { getT, getLocale } from "@/lib/i18n";
import { listAllPayments, listAllSubscriptions } from "@/lib/assistance";
import { listClientAccounts } from "@/lib/adminUsers";
import { listTaxYears } from "@/lib/dossiers";
import { listPeriodOptions } from "@/lib/taxPeriods";
import { PaymentsAdmin } from "./PaymentsAdmin";

/**
 * The firm's payment ledger, and who has subscribed to assistance.
 *
 * Payments are recorded here rather than collected online — there is no
 * gateway yet — so this screen replaces the raw SQL that was previously the
 * only way to get a payment into the system.
 */
export default async function AdminPaymentsPage() {
  const [{ t }, locale, rows, subscriptions, clients, years] = await Promise.all([
    getT(),
    getLocale(),
    listAllPayments(),
    listAllSubscriptions(),
    listClientAccounts(200),
    listTaxYears(),
  ]);

  const periods = await listPeriodOptions(years);

  return (
    <div className="max-w-[1040px]">
      <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
        {t.admin.payments.title}
      </h1>

      <p className="mt-1.5 max-w-[640px] text-[15px] text-muted">
        {t.admin.payments.sub}
      </p>

      <PaymentsAdmin
        t={t}
        locale={locale}
        rows={rows.map((r) => ({
          id: r.id,
          taxYear: r.taxYear,
          label: r.label,
          method: r.method,
          amountChf: r.amountChf,
          status: r.status,
          paidAt: r.paidAt.toISOString(),
          clientName: `${r.firstName} ${r.lastName}`,
          email: r.email,
        }))}
        subscriptions={subscriptions.map((s) => ({
          id: s.id,
          taxYear: s.taxYear,
          services: (s.services as string[]) ?? [],
          totalChf: s.totalChf,
          clientName: `${s.firstName} ${s.lastName}`,
          email: s.email,
        }))}
        clients={clients.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
        }))}
        periods={periods}
      />
    </div>
  );
}
