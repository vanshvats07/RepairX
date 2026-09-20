import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairRequest from "@/models/RepairRequest";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() {
  try {
    requireRole(await requireAuth(), ["ADMIN"]);
    await connectMongo();
    const requests = await RepairRequest.find({}).sort({ updatedAt: -1 }).limit(50).lean();
    return NextResponse.json({ data: requests });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Repair requests could not be loaded." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
