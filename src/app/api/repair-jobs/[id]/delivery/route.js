import { NextResponse } from "next/server";
import DeliveryRequest from "@/models/DeliveryRequest";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import CustomerAddress from "@/models/CustomerAddress";
import AuditEvent from "@/models/AuditEvent";
import Notification from "@/models/Notification";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { logisticsService } from "@/services/logisticsService";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const input = await request.json();
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const job = await RepairJob.findById(id); if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 });
    const repairRequest = await RepairRequest.findById(job.repairRequestId); if (!repairRequest) return NextResponse.json({ error: "Repair case not found." }, { status: 404 });
    if (!job.workshopId || (user.role !== "ADMIN" && user.role !== "WORKSHOP_OWNER" && String(repairRequest.customerId) !== String(user._id))) return NextResponse.json({ error: "You do not have access to this delivery." }, { status: 403 });
    const existing = await DeliveryRequest.findOne({ repairJobId: id, status: { $nin: ["FAILED", "CANCELLED"] } }).sort({ createdAt: -1 }).lean(); if (existing) return NextResponse.json({ data: existing });
    const address = input.addressId ? await CustomerAddress.findOne({ _id: input.addressId, userId: repairRequest.customerId }).lean() : null;
    const delivery = await DeliveryRequest.create({ repairJobId: id, customerId: repairRequest.customerId, workshopId: job.workshopId, addressId: address?._id || null, mode: input.mode || "WORKSHOP_DELIVERY", status: "PENDING", requestedAt: new Date(), preferredSlot: input.preferredSlot || null, provider: input.provider || "WORKSHOP_MANAGED" });
    const result = await logisticsService.createDelivery({ ...delivery.toObject(), provider: delivery.provider });
    await AuditEvent.create({ entityType: "RepairJob", entityId: id, eventType: "DELIVERY_REQUESTED", actorId: user._id, actorRole: user.role, metadata: { deliveryId: delivery._id, caseId: repairRequest.caseId } });
    if (repairRequest.customerId) await Notification.create({ userId: repairRequest.customerId, type: "DELIVERY_STARTED", entityType: "RepairJob", entityId: job._id, title: "Delivery request created", message: `Delivery planning has started for case ${repairRequest.caseId}.` });
    return NextResponse.json({ success: true, data: { ...delivery.toObject(), logistics: result } }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to create delivery request." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] });
    const job = await RepairJob.findById(id).lean(); if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 }); const repairRequest = await RepairRequest.findById(job.repairRequestId).lean();
    if (!repairRequest || (user.role === "CUSTOMER" && String(repairRequest.customerId) !== String(user._id))) return NextResponse.json({ error: "You do not have access to this delivery." }, { status: 403 });
    if (!["CUSTOMER", "WORKSHOP_OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "You do not have access to this delivery." }, { status: 403 });
    return NextResponse.json({ data: await DeliveryRequest.find({ repairJobId: id }).sort({ createdAt: -1 }).lean() });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to load deliveries." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
