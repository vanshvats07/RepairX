import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Technician from "@/models/Technician";
import WorkshopMembership from "@/models/WorkshopMembership";
import { requireWorkshopOwner } from "@/services/workshopAccessService";

export async function PATCH(request, { params }) {
  try {
    const user = await requireWorkshopOwner();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const membership = await WorkshopMembership.findOne({ userId: user._id, workshopId: params.id, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } });
    if (!membership) return NextResponse.json({ error: "You do not manage this workshop." }, { status: 403 });

    const technician = await Technician.findOne({ _id: params.technicianId, workshopId: params.id });
    if (!technician) return NextResponse.json({ error: "Technician not found for this workshop." }, { status: 404 });

    const input = await request.json();
    const update = {};
    const allowed = ["name", "phone", "email", "specializations", "supportedBrands", "supportedDevices", "status"];
    for (const field of allowed) {
      if (input[field] !== undefined) update[field] = input[field];
    }

    if (!Object.keys(update).length) return NextResponse.json({ error: "No valid technician fields were provided." }, { status: 400 });

    const updated = await Technician.findByIdAndUpdate(params.technicianId, update, { new: true, runValidators: true }).lean();
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update technician." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
