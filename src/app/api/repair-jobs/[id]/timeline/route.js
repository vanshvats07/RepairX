import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import AuditEvent from "@/models/AuditEvent";
import RepairLog from "@/models/RepairLog";
import RepairJob from "@/models/RepairJob";
import PickupRequest from "@/models/PickupRequest";
import DeliveryRequest from "@/models/DeliveryRequest";
import DeviceReceipt from "@/models/DeviceReceipt";
import QualityCheck from "@/models/QualityCheck";
import PostRepairReport from "@/models/PostRepairReport";

function normalizeEvent(entry, type) {
  const createdAt = entry.createdAt || entry.requestedAt || entry.receivedAt || entry.completedAt || new Date();
  const title = entry.title || entry.eventType || entry.status || entry.type || type;
  const detail = entry.detail || entry.description || entry.message || entry.notes || entry.proofOfDelivery || "System update";
  return { id: String(entry._id || entry.id || `${type}-${createdAt}`), type, createdAt, title, detail };
}

export async function GET(_request, { params }) {
  try {
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] });

    const [job, auditEvents, repairLogs, pickups, deliveries, receipts, qualityChecks, postReports] = await Promise.all([
      RepairJob.findById(params.id).lean(),
      AuditEvent.find({ $or: [{ entityType: "RepairJob", entityId: params.id }, { entityType: "PickupRequest", repairJobId: params.id }, { entityType: "DeliveryRequest", repairJobId: params.id }] }).sort({ createdAt: 1 }).lean(),
      RepairLog.find({ repairJobId: params.id }).sort({ createdAt: 1 }).lean(),
      PickupRequest.find({ repairJobId: params.id }).sort({ createdAt: 1 }).lean(),
      DeliveryRequest.find({ repairJobId: params.id }).sort({ createdAt: 1 }).lean(),
      DeviceReceipt.find({ repairJobId: params.id }).sort({ createdAt: 1 }).lean(),
      QualityCheck.find({ repairJobId: params.id }).sort({ createdAt: 1 }).lean(),
      PostRepairReport.find({ repairJobId: params.id }).sort({ createdAt: 1 }).lean()
    ]);

    const timeline = [
      ...(job ? [normalizeEvent({ _id: `job-${job._id}`, createdAt: job.createdAt || new Date(), title: "Repair job created", detail: job.status || "Approved" }, "job")] : []),
      ...auditEvents.map((entry) => normalizeEvent({ ...entry, title: entry.eventType || "Status update", detail: entry.metadata ? JSON.stringify(entry.metadata) : "System update" }, "audit")),
      ...repairLogs.map((entry) => normalizeEvent({ ...entry, title: entry.eventType || "Repair update", detail: entry.description || "Repair event recorded" }, "log")),
      ...pickups.map((entry) => normalizeEvent({ ...entry, title: `Pickup ${entry.status || "requested"}`, detail: entry.notes || entry.preferredSlot || "Pickup request recorded" }, "pickup")),
      ...deliveries.map((entry) => normalizeEvent({ ...entry, title: `Delivery ${entry.status || "pending"}`, detail: entry.proofOfDelivery || entry.preferredSlot || "Delivery request recorded" }, "delivery")),
      ...receipts.map((entry) => normalizeEvent({ ...entry, title: "Device received", detail: entry.visibleCondition || entry.customerNotes || "Workshop recorded receipt" }, "receipt")),
      ...qualityChecks.map((entry) => normalizeEvent({ ...entry, title: entry.passed ? "Quality check passed" : "Quality check review", detail: entry.notes || "Quality check recorded" }, "quality")),
      ...postReports.map((entry) => normalizeEvent({ ...entry, title: "Post-repair report", detail: entry.description || entry.reportedOutcome || "Post-repair note saved" }, "report"))
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return NextResponse.json({ data: timeline });
  } catch (error) {
    return NextResponse.json({ data: [], message: error.message || "Repair timeline is temporarily unavailable." }, { status: 500 });
  }
}

