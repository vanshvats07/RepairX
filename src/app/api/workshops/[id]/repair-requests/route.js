import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairRequest from "@/models/RepairRequest";
import WorkshopMembership from "@/models/WorkshopMembership";
import { requireWorkshopOwner } from "@/services/workshopAccessService";

export async function GET(_request, { params }) {
  try {
    const user = await requireWorkshopOwner();
    const { id } = await params;
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] });
    await WorkshopMembership.findOne({ userId: user._id, workshopId: id, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }).orFail();
    return NextResponse.json({ data: await RepairRequest.find({ workshopId: id }).sort({ createdAt: -1 }).lean() });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to load workshop requests." }, { status: 403 });
  }
}
