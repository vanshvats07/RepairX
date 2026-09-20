import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { getDeviceIntelligenceSummary } from "@/services/deviceIntelligenceSummaryService";

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: null, message: "RepairX is still learning this device." });
    const data = await getDeviceIntelligenceSummary(id, user);
    if (!data) return NextResponse.json({ data: null }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) { return NextResponse.json({ data: null, message: error.message || "Device intelligence is temporarily unavailable." }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
