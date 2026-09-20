import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Dispute from "@/models/Dispute";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() {
  try {
    requireRole(await requireAuth(), ["ADMIN"]);
    await connectMongo();
    const disputes = await Dispute.find({}).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ data: disputes });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Disputes could not be loaded." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
