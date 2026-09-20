import { redirect } from "next/navigation";
import CustomerDashboard from "@/components/CustomerDashboard";
import WorkshopMembership from "@/models/WorkshopMembership";
import { getSessionUser } from "@/services/authService";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "TECHNICIAN") {
    const membership = await WorkshopMembership.exists({ userId: user._id, status: "ACTIVE", role: "TECHNICIAN" });
    if (membership) redirect("/technician");
  }
  if (user.role === "WORKSHOP_OWNER") {
    const membership = await WorkshopMembership.exists({ userId: user._id, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } });
    if (membership) redirect("/workshop");
  }
  return <CustomerDashboard user={{ name: user.name, role: user.role }} />;
}
