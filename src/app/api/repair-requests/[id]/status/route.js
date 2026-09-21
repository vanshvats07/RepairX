import { NextResponse } from "next/server";
import RepairRequest from "@/models/RepairRequest";
import WorkshopMembership from "@/models/WorkshopMembership";
import AuditEvent from "@/models/AuditEvent";
import RepairStatus from "@/models/RepairStatus";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { recordCaseTransition } from "@/services/caseStateMachine";

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] });
    const record = await RepairRequest.findById(id).lean();
    if (!record) return NextResponse.json({ error: "Repair request not found." }, { status: 404 });
    const membership = user.role === "WORKSHOP_OWNER" ? await WorkshopMembership.exists({ userId: user._id, workshopId: record.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }) : false;
    const authorized = user.role === "ADMIN" || String(record.customerId) === String(user._id) || String(record.technicianId) === String(user._id) || membership;
    if (!authorized) return NextResponse.json({ error: "You are not authorized to view this case." }, { status: 403 });
    const statuses = await RepairStatus.find({ repairRequestId: id }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ data: statuses });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to load repair status history." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const { status, note } = await request.json();
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const record = await RepairRequest.findById(id); if (!record) return NextResponse.json({ error: "Repair request not found." }, { status: 404 });
    const membership = user.role === "WORKSHOP_OWNER" ? await WorkshopMembership.exists({ userId: user._id, workshopId: record.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }) : false;
    const authorized = user.role === "ADMIN" || String(record.customerId) === String(user._id) || String(record.technicianId) === String(user._id) || membership;
    if (!authorized) return NextResponse.json({ error: "You are not authorized to update this case." }, { status: 403 });
    const previousStatus = record.status;
    await recordCaseTransition(record, status, { actorId: user._id, actorRole: user.role, note: note || "Case status updated" });
    await AuditEvent.create({ entityType: "RepairRequest", entityId: record._id, eventType: "CASE_STATUS_UPDATED", actorId: user._id, actorRole: user.role, metadata: { previousStatus, newStatus: status } });
    return NextResponse.json({ data: record });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to update repair status." }, { status: error.code === "FORBIDDEN_TRANSITION" ? 409 : error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
