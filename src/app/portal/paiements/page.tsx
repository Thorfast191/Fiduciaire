import { getCurrentUser } from "@/lib/auth/guards";
import { getT, getLocale } from "@/lib/i18n";
import { listPayments, paymentTotals } from "@/lib/assistance";

/**
 * "Mes paiements" — the three figures above the ledger, then every payment the
 * firm has recorded. Payments are entered by Fiduvia rather than collected
 * online: there is no gateway yet, so this screen reads the ledger.
 */
export default async function PaymentsPage() {
  const [user, { t }, locale] = await Promise.all([
    getCurrentUser(),
    getT(),
    getLocale(),
  ]);

  const rows = user ? await listPayments(user.id) : [];
  const totals = paymentTotals(rows);
  const p = t.payments;

  const dateFormat = new Intl.DateTimeFormat(
    locale === "fr" ? "fr-CH" : "en-GB",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );

  return (
    <div className="max-w-[1040px]">
      <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
        {p.title}
      </h1>

      <p className="mt-1.5 text-[15px] text-muted">{p.sub}</p>

      <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Figure
          label={p.totalPaid}
          value={`CHF ${totals.totalPaid.toLocaleString("fr-CH")}`}
          note={p.totalPaidSub.replace("{n}", String(totals.periods))}
          accent
        />
        <Figure
          label={p.count}
          value={String(totals.count)}
          note={p.countSub}
        />
        <Figure
          label={p.balance}
          value={`CHF ${totals.balanceDue}`}
          note={totals.balanceDue === 0 ? p.balanceSub : p.balanceOwed}
        />
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-line bg-card px-5 py-6 text-[14px] text-muted">
          {p.empty}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-card shadow-[var(--shadow-xs)]">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-line">
                {[p.date, p.service, p.method, p.amount].map((h, i) => (
                  <th
                    key={h}
                    className={`px-6 py-4 font-mono text-[10px] uppercase tracking-[0.1em] text-muted ${
                      i === 3 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="fx-figure px-6 py-5 text-[13.5px] text-body">
                    {dateFormat.format(row.paidAt)}
                  </td>

                  <td className="px-6 py-5">
                    <div className="disp text-[15px] font-bold">
                      {row.label}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-muted">
                      {p.period.replace("{year}", String(row.taxYear))}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-[13.5px] text-body">
                    {p.methods[row.method]}
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="disp text-[17px] font-bold">
                      CHF {row.amountChf}
                    </div>
                    <div
                      className={`mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${
                        row.status === "paid" ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {row.status === "paid" ? `✓ ${p.paid}` : p.pending}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Figure({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-xs)]">
      <span className="fx-eyebrow text-[var(--text-muted)]">{label}</span>

      <div
        className="fx-figure mt-2 text-[30px] font-extrabold leading-none"
        style={accent ? { color: "var(--brand)" } : undefined}
      >
        {value}
      </div>

      <p className="mt-2 text-[12.5px] text-muted">{note}</p>
    </div>
  );
}
