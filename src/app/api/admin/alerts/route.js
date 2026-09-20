import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import OperationalAlert from "@/models/OperationalAlert";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() {
  try {
    requireRole(await requireAuth(), ["ADMIN"]);
    await connectMongo();
    const alerts = await OperationalAlert.find({}).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ data: alerts });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Alerts could not be loaded." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
