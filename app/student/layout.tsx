import { SecureAppShell } from "@/components/secure-app-shell";
import { DataAccessGate } from "@/components/data-access-gate";
import { isProductionMode } from "@/lib/config";
import { getSessionUser } from "@/lib/server-auth";
import { getEnrollment } from "@/lib/server-repositories";
import { redirect } from "next/navigation";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  if (!isProductionMode) return <SecureAppShell role="student">{children}</SecureAppShell>;
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/student");
  if (session.profile.role !== "student") redirect("/unauthorized");
  const enrollment = await getEnrollment(session.uid);
  if (!session.profile.studentId || enrollment?.status !== "approved") redirect("/pending");
  return <SecureAppShell role="student"><DataAccessGate area="student" /></SecureAppShell>;
}
