import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairRequest from "@/models/RepairRequest";
import DiagnosticCheck from "@/models/DiagnosticCheck";
import AuditEvent from "@/models/AuditEvent";
import { requireAuth } from "@/services/authService";
import { recordCaseTransition } from "@/services/caseStateMachine";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const input = await request.json();
    if (!input.name || !["NOT_CHECKED", "PASS", "FAIL", "NOT_APPLICABLE", "NEEDS_FURTHER_TESTING"].includes(input.result)) return NextResponse.json({ error: "A valid check name and result are required." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const repairRequest = await RepairRequest.findById(id); if (!repairRequest) return NextResponse.json({ error: "Repair request not found." }, { status: 404 });
    if (user.role !== "ADMIN" && String(repairRequest.technicianId) !== String(user._id)) return NextResponse.json({ error: "Only the assigned technician can record diagnostic checks." }, { status: 403 });
    if (repairRequest.status === "WORKSHOP_ACCEPTED") await recordCaseTransition(repairRequest, "UNDER_DIAGNOSIS", { actorId: user._id, actorRole: user.role, note: "Technician started diagnostic checks" });
    const check = await DiagnosticCheck.findOneAndUpdate({ repairRequestId: id, name: input.name }, { ...input, repairRequestId: id, checkedAt: new Date() }, { upsert: true, new: true });
    await AuditEvent.create({ entityType: "RepairRequest", entityId: repairRequest._id, eventType: "DIAGNOSTIC_CHECK_RECORDED", actorId: user._id, actorRole: user.role, metadata: { checkId: check._id, name: input.name, result: input.result } });
    return NextResponse.json({ data: check });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to record this diagnostic check." }, { status: error.code === "FORBIDDEN" ? 403 : 500 }); }
}
