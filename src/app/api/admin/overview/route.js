import { NextResponse } from "next/server";
import { getAdminOverview } from "@/services/adminService";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() {
  try {
    const user = requireRole(await requireAuth(), ["ADMIN"]);
    const data = await getAdminOverview();
    return NextResponse.json({ data: { ...data, viewer: { id: user._id, role: user.role } } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Access denied." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
