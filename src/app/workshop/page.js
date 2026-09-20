import { redirect } from "next/navigation";
import { WorkshopDashboard } from "@/components/RoleDashboards";
import WorkshopMembership from "@/models/WorkshopMembership";
import { getSessionUser } from "@/services/authService";

export const dynamic = "force-dynamic";

export default async function WorkshopPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "ADMIN") return <WorkshopDashboard user={{ name: user.name, role: user.role }} />;
  if (user.role !== "WORKSHOP_OWNER") redirect(user.role === "TECHNICIAN" ? "/technician" : "/dashboard");

  const hasActiveMembership = await WorkshopMembership.exists({ userId: user._id, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } });
  if (!hasActiveMembership) redirect("/dashboard");

  return <WorkshopDashboard user={{ name: user.name, role: user.role }} />;
}
