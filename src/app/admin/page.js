import AdminCommandCenter from "@/components/AdminCommandCenter";
import { publicUser, requireAuth, requireRole } from "@/services/authService";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  let user;
  try {
    user = requireRole(await requireAuth(), ["ADMIN"]);
  } catch {
    redirect("/");
  }
  return <AdminCommandCenter user={publicUser(user)} />;
}
