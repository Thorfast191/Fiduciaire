import { getCurrentUser } from "@/lib/auth/guards";
import { getT } from "@/lib/i18n";
import { taxYearOptionsDesc } from "@/lib/taxYears";
import { listSubscriptions } from "@/lib/assistance";
import { AssistancePlanner } from "./AssistancePlanner";

/**
 * Fiduvia Assistance — the mockup's à la carte panel: pick a period, tick the
 * services, subscribe. Prices come from `ASSISTANCE_OPTIONS`, and choosing
 * enough individual options collapses to the bundle price.
 */
export default async function AssistancePage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getT()]);

  const subscriptions = user ? await listSubscriptions(user.id) : [];
  const years = taxYearOptionsDesc();

  return (
    <div className="max-w-[1040px]">
      <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
        {t.assistance.title}
      </h1>

      <p className="mt-1.5 max-w-[640px] text-[15px] leading-[1.55] text-muted">
        {t.assistance.sub}
      </p>

      <AssistancePlanner
        t={t}
        years={years}
        subscriptions={subscriptions.map((s) => ({
          taxYear: s.taxYear,
          services: (s.services as string[]) ?? [],
          totalChf: s.totalChf,
        }))}
      />
    </div>
  );
}
