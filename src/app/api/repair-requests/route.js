import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Device from "@/models/Device";
import UserDevice from "@/models/UserDevice";
import RepairRequest from "@/models/RepairRequest";
import RepairStatus from "@/models/RepairStatus";
import WorkshopMembership from "@/models/WorkshopMembership";
import Notification from "@/models/Notification";
import { requireAuth } from "@/services/authService";
import { generateCaseId } from "@/services/pilotCaseService";
import { findEligibleWorkshop } from "@/services/workshopMatchingService";

export async function GET() {
  try {
    const user = await requireAuth();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] });

    let filter = {};
    if (user.role === "CUSTOMER") filter = { customerId: user._id };
    if (user.role === "TECHNICIAN") filter = { technicianId: user._id };
    if (user.role === "WORKSHOP_OWNER") {
      const memberships = await WorkshopMembership.find({ userId: user._id, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }).select("workshopId").lean();
      filter = { workshopId: { $in: memberships.map((membership) => membership.workshopId) } };
    }

    const data = await RepairRequest.find(filter).populate("deviceId", "brand model variant storage location").populate("workshopId", "name city locality").sort({ updatedAt: -1 }).limit(100).lean();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Repair requests are temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    const input = await request.json();
    if (!input.deviceId) return NextResponse.json({ error: "Device is required." }, { status: 400 });
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const device = await Device.findOne({ _id: input.deviceId, userId: user._id }).lean();
    if (!device) return NextResponse.json({ error: "This device is not available to your account." }, { status: 404 });
    const userDevice = await UserDevice.findOne({ userId: user._id, ...(input.userDeviceId ? { _id: input.userDeviceId } : { deviceId: device._id }) }).lean();

    const matchedWorkshop = input.workshopId ? await WorkshopMembership.exists({ workshopId: input.workshopId, status: "ACTIVE" }) : await findEligibleWorkshop({ device, complaint: input.complaint, requiredCapabilities: input.requiredCapabilities || [] });
    const workshopId = input.workshopId || matchedWorkshop?._id;
    const caseId = await generateCaseId();
    const requestRecord = await RepairRequest.create({
      ...input,
      userDeviceId: userDevice?._id,
      workshopId,
      caseId,
      customerId: user._id,
      pilotCase: input.pilotCase ?? true,
      pilotSource: input.pilotSource || "PRIVATE_PILOT",
      status: workshopId ? "AWAITING_TECHNICIAN" : "REQUESTED"
    });

    await RepairStatus.create({ repairRequestId: requestRecord._id, status: "REQUESTED", note: "Diagnostic request created" });
    if (workshopId) {
      await RepairStatus.create({ repairRequestId: requestRecord._id, status: "AWAITING_TECHNICIAN", note: "Eligible workshop matched" });
      const members = await WorkshopMembership.find({ workshopId, status: "ACTIVE" }).select("userId").lean();
      if (members.length) await Notification.insertMany(members.map((member) => ({ userId: member.userId, type: "NEW_REPAIR_REQUEST", entityType: "RepairRequest", entityId: requestRecord._id, title: "New repair request received", message: "A customer repair request is ready for review." })));
    }
    return NextResponse.json({ data: requestRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create the repair request right now." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
