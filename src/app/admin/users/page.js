import AdminResourcePage from "@/components/AdminResourcePage";
import { publicUser, requireAuth, requireRole } from "@/services/authService";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function AdminUsersPage() { let user; try { user = requireRole(await requireAuth(), ["ADMIN"]); } catch { redirect("/"); } return <AdminResourcePage kind="users" user={publicUser(user)} />; }
