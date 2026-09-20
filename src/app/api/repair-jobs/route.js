import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import AuditEvent from "@/models/AuditEvent";
import { requireAuth } from "@/services/authService";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const input = await request.json();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const requestRecord = await RepairRequest.findById(input.repairRequestId);
    if (!requestRecord || requestRecord.status !== "APPROVED") return NextResponse.json({ error: "The repair request must be approved before execution." }, { status: 409 });
    if (String(requestRecord.customerId) !== String(user._id) && user.role !== "WORKSHOP_OWNER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "You do not have access to create this repair job." }, { status: 403 });
    }

    const existing = await RepairJob.findOne({ repairRequestId: requestRecord._id });
    if (existing) return NextResponse.json({ data: existing });

    const job = await RepairJob.create({
      ...input,
      repairRequestId: requestRecord._id,
      deviceId: requestRecord.deviceId,
      workshopId: requestRecord.workshopId,
      status: "APPROVED"
    });

    await AuditEvent.create({ entityType: "RepairJob", entityId: job._id, eventType: "REPAIR_JOB_CREATED", metadata: { repairRequestId: requestRecord._id } });
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create the repair job." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
