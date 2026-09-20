import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/services/authService";
import { getSecurityReadinessReport } from "@/services/securityReadinessService";

export async function GET() {
  try {
    const user = requireRole(await requireAuth(), ["ADMIN"]);
    return NextResponse.json({ data: { actor: user.role, ...getSecurityReadinessReport() } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Security readiness is unavailable." }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
