import { getCurrentUser } from "@/lib/auth/guards";
import { getT } from "@/lib/i18n";
import { BUSINESS, addressLine } from "@/lib/business";
import ContactForm from "./ContactForm";

/**
 * Contacts, matching the mockup's client "Contacts" artboard: a message form
 * beside the firm's coordinates and opening hours.
 */
export default async function PortalContactsPage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getT()]);

  // Phone is intentionally omitted until a real number exists (BUSINESS.phone);
  // showing a placeholder number on a live contact card is worse than none.
  const coordinates = [
    { glyph: "@", label: t.portal.contactsEmail, value: BUSINESS.email },
    ...(BUSINESS.phone
      ? [{ glyph: "☎", label: t.portal.contactsPhone, value: BUSINESS.phone }]
      : []),
    {
      glyph: "⌂",
      label: t.portal.contactsAddress,
      value: addressLine(),
    },
  ];

  return (
    <div className="max-w-[1000px]">
      <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
        {t.portal.contactsTitle}
      </h1>

      <p className="mt-1.5 text-[15px] text-muted">{t.portal.contactsSub}</p>

      <div className="mt-6 flex flex-wrap items-start gap-5">
        <ContactForm
          name={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
          email={user?.email ?? ""}
        />

        <div className="flex min-w-[240px] flex-1 flex-col gap-4">
          <div className="rounded-[var(--radius-md)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              {t.portal.contactsReach}
            </span>

            <div className="mt-3.5 flex flex-col gap-3.5">
              {coordinates.map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-[15px] text-brand"
                  >
                    {c.glyph}
                  </span>

                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
                      {c.label}
                    </span>
                    <span className="disp text-[15px] font-bold">
                      {c.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              {t.portal.contactsHours}
            </span>

            <p className="mt-3 text-[14px] text-body">
              {t.portal.contactsHoursDays}
            </p>
            <p className="mt-1 text-[14px] text-body">
              {t.portal.contactsHoursTime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
