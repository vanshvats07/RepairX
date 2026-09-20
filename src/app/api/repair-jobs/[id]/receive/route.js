import { NextResponse } from "next/server";
import DeviceReceipt from "@/models/DeviceReceipt";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import AuditEvent from "@/models/AuditEvent";
import Notification from "@/models/Notification";
import WorkshopMembership from "@/models/WorkshopMembership";
import { connectMongo } from "@/lib/mongodb";
import { requireWorkshopOwner } from "@/services/workshopAccessService";
import { recordCaseTransition } from "@/services/caseStateMachine";

export async function POST(request, { params }) {
  try {
    const user = await requireWorkshopOwner(); const { id } = await params; const input = await request.json();
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const job = await RepairJob.findById(id); if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 });
    const membership = await WorkshopMembership.exists({ userId: user._id, workshopId: job.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }); if (!membership && user.role !== "ADMIN") return NextResponse.json({ error: "You do not manage this repair job." }, { status: 403 });
    const existing = await DeviceReceipt.findOne({ repairJobId: id }); if (existing) return NextResponse.json({ data: existing });
    const repairRequest = await RepairRequest.findById(job.repairRequestId); if (!repairRequest) return NextResponse.json({ error: "Repair case not found." }, { status: 404 });
    const receipt = await DeviceReceipt.create({ repairJobId: id, deviceId: job.deviceId, receivedBy: user._id, receivedAt: new Date(), visibleCondition: input.visibleCondition || null, accessories: Array.isArray(input.accessories) ? input.accessories : [], customerNotes: input.customerNotes || null, technicianNotes: input.technicianNotes || null, photos: Array.isArray(input.photos) ? input.photos : [], conditionSource: input.conditionSource || "WORKSHOP_RECEIVED_CONDITION" });
    job.status = "DEVICE_RECEIVED"; await job.save();
    if (repairRequest.status !== "DEVICE_RECEIVED") await recordCaseTransition(repairRequest, "DEVICE_RECEIVED", { actorId: user._id, actorRole: user.role, note: "Workshop confirmed physical device receipt", metadata: { receiptId: receipt._id } });
    await AuditEvent.create({ entityType: "RepairJob", entityId: job._id, eventType: "DEVICE_RECEIVED", actorId: user._id, actorRole: user.role, metadata: { receiptId: receipt._id, caseId: repairRequest.caseId } });
    if (repairRequest.customerId) await Notification.create({ userId: repairRequest.customerId, type: "DEVICE_RECEIVED", entityType: "RepairRequest", entityId: repairRequest._id, title: "Device received by workshop", message: `Your device for case ${repairRequest.caseId} has been received.` });
    return NextResponse.json({ success: true, data: receipt }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to record device receipt." }, { status: error.code === "FORBIDDEN" ? 403 : 500 }); }
}
