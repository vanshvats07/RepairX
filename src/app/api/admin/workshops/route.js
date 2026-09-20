import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Workshop from "@/models/Workshop";
import WorkshopClaim from "@/models/WorkshopClaim";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() {
  try {
    requireRole(await requireAuth(), ["ADMIN"]);
    await connectMongo();
    const workshops = await Workshop.find({}).sort({ updatedAt: -1 }).limit(50).lean();
    const claims = await WorkshopClaim.find({}).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ data: { workshops, claims } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Workshops could not be loaded." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
