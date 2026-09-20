import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairRequest from "@/models/RepairRequest";
import Diagnosis from "@/models/Diagnosis";
import AuditEvent from "@/models/AuditEvent";
import Notification from "@/models/Notification";
import DeviceComponent from "@/models/DeviceComponent";
import { requireAuth } from "@/services/authService";
import { recordCaseTransition } from "@/services/caseStateMachine";

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const input = await request.json();
    if (!input.component || !input.diagnosis || !["CONFIRMED", "RULED_OUT", "UNCERTAIN", "NEEDS_FURTHER_DIAGNOSTICS"].includes(input.result)) return NextResponse.json({ error: "Component, diagnosis and result are required." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const repairRequest = await RepairRequest.findById(id); if (!repairRequest) return NextResponse.json({ error: "Repair request not found." }, { status: 404 });
    if (user.role !== "ADMIN" && String(repairRequest.technicianId) !== String(user._id)) return NextResponse.json({ error: "Only the assigned technician can submit this diagnosis." }, { status: 403 });
    if (["WORKSHOP_ACCEPTED"].includes(repairRequest.status)) await recordCaseTransition(repairRequest, "UNDER_DIAGNOSIS", { actorId: user._id, actorRole: user.role, note: "Technician started diagnosis" });
    const diagnosis = await Diagnosis.create({ ...input, repairRequestId: id, verifiedAt: input.result === "CONFIRMED" ? new Date() : undefined, predictionOutcome: input.predictionOutcome || "INSUFFICIENT_DATA" });
    if (input.result === "CONFIRMED") {
      await DeviceComponent.findOneAndUpdate({ deviceId: repairRequest.deviceId, name: input.component }, { state: "VERIFIED", confidence: "VERIFIED", lastVerifiedAt: new Date(), recentIssue: input.diagnosis }, { upsert: false });
      if (repairRequest.status !== "DIAGNOSIS_VERIFIED") await recordCaseTransition(repairRequest, "DIAGNOSIS_VERIFIED", { actorId: user._id, actorRole: user.role, note: "Technician submitted verified diagnosis", metadata: { diagnosisId: diagnosis._id } });
      await AuditEvent.create({ entityType: "RepairRequest", entityId: repairRequest._id, eventType: "TECHNICIAN_VERIFIED", actorId: user._id, actorRole: user.role, metadata: { diagnosisId: diagnosis._id, result: input.result } });
      if (repairRequest.workshopId) await Notification.create({ userId: repairRequest.customerId, type: "DIAGNOSIS_VERIFIED", entityType: "RepairRequest", entityId: repairRequest._id, title: "Diagnosis verified", message: `Technician verification is complete for case ${repairRequest.caseId}.` });
    }
    return NextResponse.json({ data: diagnosis }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to save technician verification." }, { status: error.code === "FORBIDDEN" ? 403 : 500 }); }
}
