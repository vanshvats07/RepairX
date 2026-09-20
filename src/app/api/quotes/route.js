import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Quote from "@/models/Quote";
import RepairRequest from "@/models/RepairRequest";
import WorkshopMembership from "@/models/WorkshopMembership";
import Notification from "@/models/Notification";
import AuditEvent from "@/models/AuditEvent";
import { requireAuth, requireRole } from "@/services/authService";
import { calculateQuoteTotal } from "@/services/repairRequestService";
import { recordCaseTransition } from "@/services/caseStateMachine";

export async function POST(request) {
  try {
    const user = requireRole(await requireAuth(), ["WORKSHOP_OWNER", "ADMIN"]);
    const input = await request.json();
    if (!input.repairRequestId) return NextResponse.json({ error: "Repair request is required." }, { status: 400 });
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const repairRequest = await RepairRequest.findById(input.repairRequestId);
    if (!repairRequest || repairRequest.workshopId == null) return NextResponse.json({ error: "Authorized workshop case not found." }, { status: 404 });
    if (user.role !== "ADMIN") {
      const membership = await WorkshopMembership.exists({ userId: user._id, workshopId: repairRequest.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } });
      if (!membership) return NextResponse.json({ error: "You do not manage this workshop case." }, { status: 403 });
    }
    if (!["DIAGNOSIS_VERIFIED", "AWAITING_CUSTOMER_APPROVAL", "APPROVED"].includes(repairRequest.status)) return NextResponse.json({ error: "A verified technician diagnosis is required before generating a quote." }, { status: 409 });
    const previousQuote = await Quote.findOne({ repairRequestId: repairRequest._id }).sort({ version: -1 });
    const version = (previousQuote?.version || 0) + 1;
    if (previousQuote && ["PENDING_CUSTOMER", "SENT_TO_CUSTOMER", "VIEWED"].includes(previousQuote.status)) {
      previousQuote.status = "SUPERSEDED";
      await previousQuote.save();
    }
    const total = calculateQuoteTotal(input);
    const quote = await Quote.create({ ...input, version, supersedesQuoteId: previousQuote?._id, deviceId: input.deviceId || repairRequest.deviceId, workshopId: repairRequest.workshopId, investigationId: input.investigationId || repairRequest.investigationId, technicianId: repairRequest.technicianId, total, currency: "INR", status: "PENDING_CUSTOMER", source: "TECHNICIAN_VERIFIED" });
    if (repairRequest.status === "DIAGNOSIS_VERIFIED") await recordCaseTransition(repairRequest, "QUOTE_READY", { actorId: user._id, actorRole: user.role, note: "Verified diagnosis ready for quote", metadata: { quoteId: quote._id, version } });
    if (repairRequest.status !== "AWAITING_CUSTOMER_APPROVAL") await recordCaseTransition(repairRequest, "AWAITING_CUSTOMER_APPROVAL", { actorId: user._id, actorRole: user.role, note: "Quote sent to customer", metadata: { quoteId: quote._id, version } });
    if (repairRequest.customerId) await Notification.create({ userId: repairRequest.customerId, type: "QUOTE_READY", entityType: "Quote", entityId: quote._id, title: "Quote ready for review", message: `A quote is ready for case ${repairRequest.caseId}.` });
    await AuditEvent.create({ entityType: "RepairRequest", entityId: repairRequest._id, eventType: "QUOTE_CREATED", actorId: user._id, actorRole: user.role, metadata: { quoteId: quote._id, version, supersedesQuoteId: previousQuote?._id || null, total } });
    return NextResponse.json({ data: quote }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to generate a quote." }, { status: error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400 });
  }
}
