import { SecureAppShell } from "@/components/secure-app-shell";
import { DataAccessGate } from "@/components/data-access-gate";
import { isProductionMode } from "@/lib/config";
import { getSessionUser } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isProductionMode) return <SecureAppShell role="admin">{children}</SecureAppShell>;
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/admin");
  if (session.profile.role !== "admin") redirect("/unauthorized");
  return <SecureAppShell role="admin"><DataAccessGate area="admin" /></SecureAppShell>;
}
