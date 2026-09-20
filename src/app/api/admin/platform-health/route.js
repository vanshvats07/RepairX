import { NextResponse } from "next/server";
import { getPlatformHealth } from "@/services/adminService";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() {
  try {
    requireRole(await requireAuth(), ["ADMIN"]);
    const health = await getPlatformHealth();
    return NextResponse.json({ data: health });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Platform health could not be loaded." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
