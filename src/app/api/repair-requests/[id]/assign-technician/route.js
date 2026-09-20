import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairRequest from "@/models/RepairRequest";
import Technician from "@/models/Technician";
import TechnicianAssignment from "@/models/TechnicianAssignment";
import WorkshopMembership from "@/models/WorkshopMembership";
import Notification from "@/models/Notification";
import AuditEvent from "@/models/AuditEvent";
import { requireWorkshopOwner } from "@/services/workshopAccessService";

export async function POST(request, { params }) {
  try {
    const user = await requireWorkshopOwner(); const { id } = await params; const { technicianId } = await request.json(); if (!technicianId) return NextResponse.json({ error: "Technician is required." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const requestRecord = await RepairRequest.findById(id); if (!requestRecord?.workshopId) return NextResponse.json({ error: "Authorized workshop case not found." }, { status: 404 });
    const membership = await WorkshopMembership.findOne({ userId: user._id, workshopId: requestRecord.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }); if (!membership) return NextResponse.json({ error: "You do not manage this workshop." }, { status: 403 });
    const technician = await Technician.findOne({ _id: technicianId, workshopId: requestRecord.workshopId, status: "ACTIVE" }); if (!technician) return NextResponse.json({ error: "Active technician does not belong to this workshop." }, { status: 404 });
    const existingAssignment = await TechnicianAssignment.findOne({ repairRequestId: requestRecord._id, status: { $in: ["ASSIGNED", "ACCEPTED"] } }); if (existingAssignment) return NextResponse.json({ data: existingAssignment });
    if (!["WORKSHOP_ACCEPTED", "AWAITING_TECHNICIAN"].includes(requestRecord.status)) return NextResponse.json({ error: "This repair request is not assignable in its current state." }, { status: 409 });
    const assignment = await TechnicianAssignment.create({ repairRequestId: requestRecord._id, workshopId: requestRecord.workshopId, technicianId: technician._id, assignedBy: user._id, status: "ASSIGNED" });
    requestRecord.technicianId = technician.userId; requestRecord.assignedAt = new Date(); await requestRecord.save();
    await AuditEvent.create({ entityType: "RepairRequest", entityId: requestRecord._id, eventType: "TECHNICIAN_ASSIGNED", actorId: user._id, actorRole: user.role, metadata: { assignmentId: assignment._id, technicianId: technician._id } });
    const recipients = [technician.userId, requestRecord.customerId].filter(Boolean); if (recipients.length) await Notification.insertMany(recipients.map((userId) => ({ userId, type: "CASE_ASSIGNED", entityType: "RepairRequest", entityId: requestRecord._id, title: "Technician assigned", message: `A technician has been assigned to case ${requestRecord.caseId}.` })));
    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to assign technician." }, { status: error.code === "FORBIDDEN" ? 403 : 500 }); }
}
