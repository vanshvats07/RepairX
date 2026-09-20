import { NextResponse } from "next/server";
import PostRepairFollowUp from "@/models/PostRepairFollowUp";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import AuditEvent from "@/models/AuditEvent";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const input = await request.json();
    if (!["WORKING_WELL", "ISSUE_REMAINS", "SAME_ISSUE_RETURNED", "NEW_ISSUE", "OTHER"].includes(input.response)) return NextResponse.json({ error: "A valid follow-up outcome is required." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const job = await RepairJob.findById(id); if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 }); const repairRequest = await RepairRequest.findById(job.repairRequestId); if (!repairRequest || String(repairRequest.customerId) !== String(user._id)) return NextResponse.json({ error: "Only the customer can submit this follow-up." }, { status: 403 });
    const existing = await PostRepairFollowUp.findOne({ repairJobId: id, status: "COMPLETED" }).lean(); if (existing) return NextResponse.json({ data: existing });
    const report = await PostRepairFollowUp.create({ repairJobId: id, deviceId: job.deviceId, status: "COMPLETED", response: input.response, completedAt: new Date() });
    await AuditEvent.create({ entityType: "RepairJob", entityId: job._id, eventType: "FOLLOW_UP_SUBMITTED", actorId: user._id, actorRole: user.role, metadata: { followUpId: report._id, response: report.response, caseId: repairRequest.caseId } });
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to save follow-up." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
