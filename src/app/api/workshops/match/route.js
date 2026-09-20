import { NextResponse } from "next/server";
import RepairRequest from "@/models/RepairRequest";
import Device from "@/models/Device";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { matchWorkshopCandidates, persistWorkshopMatches } from "@/services/workshopMatchingService";

export async function POST(request) {
  try {
    const user = await requireAuth(); const { repairRequestId, caseId } = await request.json(); if (!repairRequestId && !caseId) return NextResponse.json({ error: "Repair request or case ID is required." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] });
    const repairRequest = await RepairRequest.findOne(repairRequestId ? { _id: repairRequestId } : { caseId }).lean(); if (!repairRequest) return NextResponse.json({ error: "Repair request not found." }, { status: 404 });
    if (user.role === "CUSTOMER" && String(repairRequest.customerId) !== String(user._id)) return NextResponse.json({ error: "You do not own this case." }, { status: 403 });
    const device = await Device.findById(repairRequest.deviceId).lean(); if (!device) return NextResponse.json({ error: "Device not found." }, { status: 404 });
    const candidates = await matchWorkshopCandidates({ device, complaint: repairRequest.complaint, requiredCapabilities: repairRequest.requiredCapabilities || [], location: { locality: device.location, city: device.city, pincode: device.pincode } });
    await persistWorkshopMatches(repairRequest._id, candidates);
    return NextResponse.json({ data: candidates.map(({ workshop, ...candidate }) => ({ ...candidate, workshop: { _id: workshop._id, name: workshop.name, city: workshop.city, locality: workshop.locality, verificationStatus: workshop.verificationStatus, pilotStatus: workshop.pilotStatus, capabilities: workshop.capabilities || [], pickupCapability: workshop.pickupCapability, deliveryCapability: workshop.deliveryCapability } })) });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to match workshops." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
