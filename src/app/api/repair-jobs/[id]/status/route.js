import { NextResponse } from "next/server";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import AuditEvent from "@/models/AuditEvent";
import Notification from "@/models/Notification";
import RepairEvent from "@/models/RepairEvent";
import DeviceComponent from "@/models/DeviceComponent";
import QualityCheck from "@/models/QualityCheck";
import WorkshopMembership from "@/models/WorkshopMembership";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { canTransitionJob } from "@/services/repairJobService";
import { recordCaseTransition } from "@/services/caseStateMachine";
import { apiSuccess, apiError } from "@/lib/apiResponse";

const caseStatusForJob = { DEVICE_RECEIVED: "DEVICE_RECEIVED", REPAIR_QUEUED: "REPAIR_QUEUED", REPAIR_IN_PROGRESS: "REPAIR_IN_PROGRESS", QUALITY_CHECK: "QUALITY_CHECK", COMPLETED: "COMPLETED", DELIVERED: "DELIVERED" };

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const { status, repairOutcome, technicianNotes, affectedComponent } = await request.json();
    await connectMongo(); if (!process.env.MONGODB_URI) return apiError("DATABASE_ERROR", "Database is not configured yet.", 503);
    const job = await RepairJob.findById(id); if (!job) return apiError("NOT_FOUND", "Repair job not found.", 404);
    const repairRequest = await RepairRequest.findById(job.repairRequestId); if (!repairRequest) return apiError("NOT_FOUND", "Repair case not found.", 404);
    const member = job.workshopId && user.role === "WORKSHOP_OWNER" ? await WorkshopMembership.exists({ userId: user._id, workshopId: job.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }) : false;
    const allowedActor = user.role === "ADMIN" || String(job.technicianId) === String(user._id) || member;
    if (!allowedActor) return apiError("FORBIDDEN", "You are not authorized to update this repair job.", 403);
    if (!canTransitionJob(job.status, status)) return apiError("INVALID_STATUS_TRANSITION", `Invalid repair transition from ${job.status} to ${status}.`, 409);
    if (status === "COMPLETED") { const qualityCheck = await QualityCheck.findOne({ repairJobId: job._id }).sort({ createdAt: -1 }); if (!repairOutcome || job.status !== "QUALITY_CHECK" || !qualityCheck?.passed) return apiError("CONFLICT", "A passed quality check and explicit repair outcome are required before completion.", 409); }
    job.status = status; job.repairOutcome = repairOutcome || job.repairOutcome; job.technicianNotes = technicianNotes || job.technicianNotes; if (status === "REPAIR_IN_PROGRESS") job.startedAt = new Date(); if (status === "COMPLETED") job.completedAt = new Date(); await job.save();
    await AuditEvent.create({ entityType: "RepairJob", entityId: job._id, eventType: status, actorId: user._id, actorRole: user.role, metadata: { caseId: repairRequest.caseId, repairOutcome } });
    if (caseStatusForJob[status] && repairRequest.status !== caseStatusForJob[status]) await recordCaseTransition(repairRequest, caseStatusForJob[status], { actorId: user._id, actorRole: user.role, note: `Repair job moved to ${status}`, metadata: { repairJobId: job._id } });
    if (status === "COMPLETED") { if (affectedComponent) await DeviceComponent.findOneAndUpdate({ deviceId: job.deviceId, name: affectedComponent }, { state: "WORKING", confidence: "VERIFIED", lastVerifiedAt: new Date(), $inc: { repairCount: 1 }, recentIssue: repairOutcome }, { new: true }); await RepairEvent.create({ deviceId: job.deviceId, repairRequestId: job.repairRequestId, repairJobId: job._id, workshopId: job.workshopId, technicianId: job.technicianId, diagnosisSource: "TECHNICIAN_VERIFIED", status: "COMPLETED", outcome: repairOutcome, confidence: "VERIFIED", technicianNotes }); }
    if (repairRequest.customerId) await Notification.create({ userId: repairRequest.customerId, type: status === "COMPLETED" ? "REPAIR_COMPLETED" : "OTHER", entityType: "RepairRequest", entityId: repairRequest._id, title: status === "COMPLETED" ? "Repair completed" : "Repair progress updated", message: `Case ${repairRequest.caseId} is now ${status.replaceAll("_", " ").toLowerCase()}.` });
    return apiSuccess(job);
  } catch (error) { return apiError(error.code || "DATABASE_ERROR", error.message || "Unable to update repair job status.", error.code === "FORBIDDEN" ? 403 : 500); }
}
