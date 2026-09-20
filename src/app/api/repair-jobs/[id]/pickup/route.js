import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import PickupRequest from "@/models/PickupRequest";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import CustomerAddress from "@/models/CustomerAddress";
import AuditEvent from "@/models/AuditEvent";
import Notification from "@/models/Notification";
import WorkshopMembership from "@/models/WorkshopMembership";
import { requireAuth } from "@/services/authService";
import { logisticsService } from "@/services/logisticsService";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const input = await request.json();
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const job = await RepairJob.findById(id); if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 });
    const repairRequest = await RepairRequest.findById(job.repairRequestId); if (!repairRequest) return NextResponse.json({ error: "Repair case not found." }, { status: 404 });
    if (String(repairRequest.customerId) !== String(user._id) && user.role !== "WORKSHOP_OWNER" && user.role !== "ADMIN") return NextResponse.json({ error: "You do not have access to this repair job." }, { status: 403 });
    const existing = await PickupRequest.findOne({ repairJobId: id, status: { $nin: ["FAILED", "CANCELLED"] } }).sort({ createdAt: -1 }).lean(); if (existing) return NextResponse.json({ data: existing });
    const address = input.addressId ? await CustomerAddress.findOne({ _id: input.addressId, userId: repairRequest.customerId }).lean() : null;
    if (!address && input.mode === "PICKUP_DELIVERY") return NextResponse.json({ error: "A valid customer pickup address is required." }, { status: 400 });
    const pickup = await PickupRequest.create({ repairJobId: id, customerId: repairRequest.customerId, workshopId: job.workshopId, addressId: address?._id || null, mode: input.mode || "PICKUP_DELIVERY", status: "REQUESTED", requestedAt: new Date(), preferredSlot: input.preferredSlot || null, notes: input.notes || null, provider: input.provider || "WORKSHOP_MANAGED" });
    const result = await logisticsService.createPickup({ ...pickup.toObject(), provider: pickup.provider });
    await AuditEvent.create({ entityType: "RepairJob", entityId: id, eventType: "PICKUP_REQUESTED", actorId: user._id, actorRole: user.role, metadata: { pickupId: pickup._id, caseId: repairRequest.caseId } });
    const members = job.workshopId ? await WorkshopMembership.find({ workshopId: job.workshopId, status: "ACTIVE" }).select("userId").lean() : [];
    if (members.length) await Notification.insertMany(members.map((member) => ({ userId: member.userId, type: "PICKUP_REQUESTED", entityType: "RepairJob", entityId: job._id, title: "Pickup requested", message: `Pickup requested for case ${repairRequest.caseId}.` })));
    return NextResponse.json({ success: true, data: { ...pickup.toObject(), logistics: result } }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to create pickup request." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] });
    const job = await RepairJob.findById(id).lean(); if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 }); const repairRequest = await RepairRequest.findById(job.repairRequestId).lean();
    if (!repairRequest || (user.role === "CUSTOMER" && String(repairRequest.customerId) !== String(user._id))) return NextResponse.json({ error: "You do not have access to this pickup." }, { status: 403 });
    if (!["CUSTOMER", "WORKSHOP_OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "You do not have access to this pickup." }, { status: 403 });
    return NextResponse.json({ data: await PickupRequest.find({ repairJobId: id }).sort({ createdAt: -1 }).lean() });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to load pickup requests." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
