import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Device from "@/models/Device";
import Investigation from "@/models/Investigation";
import RepairRequest from "@/models/RepairRequest";
import RepairStatus from "@/models/RepairStatus";
import AuditEvent from "@/models/AuditEvent";
import Notification from "@/models/Notification";
import WorkshopMembership from "@/models/WorkshopMembership";
import UserDevice from "@/models/UserDevice";
import { requireAuth } from "@/services/authService";
import { generateCaseId } from "@/services/pilotCaseService";
import { findEligibleWorkshop, matchWorkshopCandidates, persistWorkshopMatches } from "@/services/workshopMatchingService";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const input = await request.json();
    if (!input.deviceId || !input.complaint) return NextResponse.json({ error: "Device and complaint are required." }, { status: 400 });
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const device = await Device.findOne({ _id: input.deviceId, userId: user._id }).lean();
    if (!device) return NextResponse.json({ error: "This device is not available to your account." }, { status: 404 });
    const userDevice = await UserDevice.findOne({ deviceId: device._id, userId: user._id }).lean();

    const { createRepairRequest, ...investigationInput } = input;
    const investigation = await Investigation.create({
      ...investigationInput,
      userId: user._id,
      deviceId: input.deviceId,
      status: "INVESTIGATING"
    });

    let repairRequest = null;
    if (createRepairRequest) {
      const matchedWorkshop = await findEligibleWorkshop({ device, complaint: input.complaint, requiredCapabilities: input.requiredCapabilities || [], location: { locality: device.location, city: device.city, pincode: device.pincode } });
      repairRequest = await RepairRequest.create({ caseId: await generateCaseId(), deviceId: input.deviceId, userDeviceId: userDevice?._id, investigationId: investigation._id, customerId: user._id, workshopId: matchedWorkshop?._id, complaint: input.complaint, requiredCapabilities: input.requiredCapabilities || [], status: matchedWorkshop ? "AWAITING_TECHNICIAN" : "REQUESTED" });
      const candidates = await matchWorkshopCandidates({ device, complaint: input.complaint, requiredCapabilities: input.requiredCapabilities || [], location: { locality: device.location, city: device.city, pincode: device.pincode } });
      await persistWorkshopMatches(repairRequest._id, candidates);
      await RepairStatus.create({ repairRequestId: repairRequest._id, status: "REQUESTED", note: "Repair case created with investigation" });
      if (matchedWorkshop) {
        await RepairStatus.create({ repairRequestId: repairRequest._id, status: "AWAITING_TECHNICIAN", note: "Eligible network workshop matched" });
        const members = await WorkshopMembership.find({ workshopId: matchedWorkshop._id, status: "ACTIVE" }).select("userId").lean();
        if (members.length) await Notification.insertMany(members.map((member) => ({ userId: member.userId, type: "NEW_REPAIR_REQUEST", entityType: "RepairRequest", entityId: repairRequest._id, title: "New repair request received", message: `A new ${device.brand} ${device.model} case is ready for workshop review.` })));
      }
      investigation.repairRequestId = repairRequest._id;
      await investigation.save();
      await AuditEvent.create({ entityType: "Investigation", entityId: investigation._id, action: "INVESTIGATION_CREATED", eventType: "INVESTIGATION_CREATED", actorId: user._id, actorRole: user.role, metadata: { repairRequestId: repairRequest._id, deviceId: input.deviceId } });
    }

    return NextResponse.json({ data: investigation, repairRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create this investigation right now." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
