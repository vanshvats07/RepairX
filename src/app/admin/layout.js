import { redirect } from "next/navigation";
import AccountMenu from "@/components/AccountMenu";
import { publicUser, requireAuth, requireRole } from "@/services/authService";

export default async function AdminLayout({ children }) {
  let safeUser;
  try {
    const user = requireRole(await requireAuth(), ["ADMIN"]);
    if (!user || user.role !== "ADMIN") redirect("/");
    safeUser = publicUser(user);
  } catch {
    redirect("/");
  }
  return <><div className="admin-account-bar"><AccountMenu user={{ name: safeUser.name, email: safeUser.email, role: safeUser.role }} /></div>{children}</>;
}
