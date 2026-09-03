import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { listAdminAccounts, listClientAccounts } from "@/lib/adminUsers";
import { getT } from "@/lib/i18n";
import AdminAccounts from "./AdminAccounts";

/**
 * User management, matching the mockup's admin "Gestion des utilisateurs"
 * artboard: administrator accounts with an add form, then the client accounts.
 * Only a super admin may change administrators, so an ordinary admin sees the
 * lists read-only.
 */
export default async function AdminUsersPage() {
  const [user, admins, clients, { t }] = await Promise.all([
    getCurrentUser(),
    listAdminAccounts(),
    listClientAccounts(),
    getT(),
  ]);

  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="max-w-[1040px]">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-strong"
      >
        ← {t.admin.backHome}
      </Link>

      <div className="mt-2.5">
        <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
          {t.admin.users.title}
        </h1>

        <p className="mt-1.5 text-[15px] text-muted">{t.admin.users.sub}</p>
      </div>

      <AdminAccounts
        admins={admins.map((a) => ({
          id: a.id,
          name: `${a.firstName} ${a.lastName}`.trim(),
          email: a.email,
          isSuper: a.role === "super_admin",
        }))}
        canManage={isSuperAdmin}
      />

      <section className="mt-4 rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6">
        <h2 className="disp text-[17px] font-bold">
          {t.admin.users.clientsTitle}
        </h2>

        <p className="mt-1 text-[13px] text-muted">
          {t.admin.users.clientsSub}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {clients.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              {t.admin.users.noClients}
            </p>
          ) : (
            clients.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-line px-4 py-2.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[12px] font-bold text-brand">
                  {(c.firstName[0] ?? "") + (c.lastName[0] ?? "")}
                </span>

                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[14.5px] font-semibold text-strong">
                    {c.firstName} {c.lastName}
                  </span>
                  <span className="truncate text-[12.5px] text-muted">
                    {c.email}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
