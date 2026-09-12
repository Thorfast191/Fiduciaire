import Link from "next/link";
import { getCurrentUser, requireSuperAdmin } from "@/lib/auth/guards";
import { listAdminAccounts, listClientAccounts } from "@/lib/adminUsers";
import { getT } from "@/lib/i18n";
import AdminAccounts from "./AdminAccounts";
import ClientAccounts from "./ClientAccounts";

/**
 * User management, matching the mockup's admin "Gestion des utilisateurs"
 * artboard: administrator accounts with an add form, then the client accounts.
 * Only a super admin may change administrators, so an ordinary admin sees the
 * lists read-only.
 */
export default async function AdminUsersPage() {
  await requireSuperAdmin();

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

      <h2 className="disp mt-8 text-[19px] font-bold">
        {t.admin.users.clientsTitle}
      </h2>

      <ClientAccounts
        canManage={isSuperAdmin}
        clients={clients.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
        }))}
      />
    </div>
  );
}
