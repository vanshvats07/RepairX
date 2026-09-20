import { NextResponse } from "next/server";
import QualityCheck from "@/models/QualityCheck";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import AuditEvent from "@/models/AuditEvent";
import WorkshopMembership from "@/models/WorkshopMembership";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { qualityPassed } from "@/services/repairJobService";
import { recordCaseTransition } from "@/services/caseStateMachine";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const input = await request.json();
    if (!Array.isArray(input.checks) || !input.checks.length) return NextResponse.json({ error: "Quality checks are required." }, { status: 400 });
    if (input.checks.some((check) => check.result === "FAIL" && !check.note)) return NextResponse.json({ error: "Failed checks require a note." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const job = await RepairJob.findById(id); if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 });
    const repairRequest = await RepairRequest.findById(job.repairRequestId); if (!repairRequest) return NextResponse.json({ error: "Repair case not found." }, { status: 404 });
    const membership = user.role === "WORKSHOP_OWNER" ? await WorkshopMembership.exists({ userId: user._id, workshopId: job.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }) : false;
    if (user.role !== "ADMIN" && String(job.technicianId) !== String(user._id) && !membership) return NextResponse.json({ error: "You are not authorized to record this quality check." }, { status: 403 });
    if (!["REPAIR_IN_PROGRESS", "QUALITY_CHECK"].includes(job.status)) return NextResponse.json({ error: "Quality checks can only be recorded during repair execution." }, { status: 409 });
    const check = await QualityCheck.create({ ...input, repairJobId: id, passed: qualityPassed(input.checks), completedAt: new Date(), failedChecks: input.checks.filter((item) => item.result === "FAIL").map((item) => item.name) });
    job.qualityCheck = check._id; job.status = "QUALITY_CHECK"; await job.save();
    if (repairRequest.status !== "QUALITY_CHECK") await recordCaseTransition(repairRequest, "QUALITY_CHECK", { actorId: user._id, actorRole: user.role, note: "Quality check recorded", metadata: { qualityCheckId: check._id, passed: check.passed } });
    await AuditEvent.create({ entityType: "RepairJob", entityId: job._id, eventType: "QUALITY_CHECK_COMPLETED", actorId: user._id, actorRole: user.role, metadata: { qualityCheckId: check._id, passed: check.passed } });
    return NextResponse.json({ data: check }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to save quality check." }, { status: 500 }); }
}
