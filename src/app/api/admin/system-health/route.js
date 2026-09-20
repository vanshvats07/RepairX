import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/services/authService";
import { getSystemHealth } from "@/services/systemHealthService";

export async function GET() {
  try {
    requireRole(await requireAuth(), ["ADMIN"]);
    const health = await getSystemHealth();
    return NextResponse.json({ data: health });
  } catch (error) {
    return NextResponse.json({ error: error.message || "System health could not be loaded." }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
