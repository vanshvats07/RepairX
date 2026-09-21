import { redirect } from "next/navigation";
import RepairCaseDetail from "@/components/RepairCaseDetail";
import { getSessionUser, publicUser } from "@/services/authService";

export const dynamic = "force-dynamic";

export default async function RepairRequestPage({ params }) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return <RepairCaseDetail caseId={(await params).id} user={publicUser(user)} />;
}
