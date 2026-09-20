import { NextResponse } from "next/server";
import { getDataQualityIssues } from "@/services/adminService";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() {
  try {
    requireRole(await requireAuth(), ["ADMIN"]);
    const issues = await getDataQualityIssues();
    return NextResponse.json({ data: issues });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Data quality issues could not be loaded." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
