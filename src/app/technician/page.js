import { redirect } from "next/navigation";
import { TechnicianDashboard } from "@/components/RoleDashboards";
import WorkshopMembership from "@/models/WorkshopMembership";
import { getSessionUser } from "@/services/authService";

export const dynamic = "force-dynamic";

export default async function TechnicianPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role !== "TECHNICIAN") redirect(user.role === "WORKSHOP_OWNER" ? "/workshop" : "/dashboard");

  const hasActiveMembership = await WorkshopMembership.exists({ userId: user._id, status: "ACTIVE", role: "TECHNICIAN" });
  if (!hasActiveMembership) redirect("/dashboard");

  return <TechnicianDashboard user={{ name: user.name, role: user.role }} />;
}
