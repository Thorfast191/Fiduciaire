import { requireRole } from "@/lib/auth/guards";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["client"]);
  return <div>{children}</div>;
}
