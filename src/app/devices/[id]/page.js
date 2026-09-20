import { redirect } from "next/navigation";
import DeviceDetail from "@/components/DeviceDetail";
import { getSessionUser } from "@/services/authService";

export const dynamic = "force-dynamic";

export default async function DevicePage({ params }) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const { id } = await params;
  return <DeviceDetail deviceId={id} />;
}
