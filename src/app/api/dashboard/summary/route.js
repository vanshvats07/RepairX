import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { getDashboardSummary } from "@/services/dashboardService";

export async function GET() {
  try {
    const user = await requireAuth();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: null, error: "Database is not configured yet." }, { status: 503 });
    return NextResponse.json({ data: await getDashboardSummary(user) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Dashboard summary is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
