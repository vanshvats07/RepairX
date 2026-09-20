import { NextResponse } from "next/server";
import Quote from "@/models/Quote";
import RepairRequest from "@/models/RepairRequest";
import RepairJob from "@/models/RepairJob";
import Notification from "@/models/Notification";
import AuditEvent from "@/models/AuditEvent";
import WorkshopMembership from "@/models/WorkshopMembership";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { recordCaseTransition } from "@/services/caseStateMachine";

async function authorizedQuote(id, user) {
  const quote = await Quote.findById(id);
  if (!quote) return null;
  const repairRequest = await RepairRequest.findById(quote.repairRequestId);
  if (!repairRequest) return null;
  if (user.role === "ADMIN" || String(repairRequest.customerId) === String(user._id) || String(repairRequest.technicianId) === String(user._id)) return { quote, repairRequest };
  if (user.role === "WORKSHOP_OWNER" && await WorkshopMembership.exists({ userId: user._id, workshopId: repairRequest.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } })) return { quote, repairRequest };
  const error = new Error("You do not have access to this quote."); error.code = "FORBIDDEN"; throw error;
}

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: null });
    const result = await authorizedQuote(id, user); if (!result) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    return NextResponse.json({ data: result.quote });
  } catch (error) { return NextResponse.json({ error: error.message || "Quote is temporarily unavailable." }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const input = await request.json(); const status = input.status; if (!["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Only approval or rejection is supported here." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const result = await authorizedQuote(id, user); if (!result) return NextResponse.json({ error: "Quote not found." }, { status: 404 }); const { quote, repairRequest } = result;
    if (String(repairRequest.customerId) !== String(user._id)) return NextResponse.json({ error: "Only the customer can decide on this quote." }, { status: 403 });
    if (quote.status === status) return NextResponse.json({ data: quote });
    const currentQuote = await Quote.findOne({ repairRequestId: repairRequest._id }).sort({ version: -1 }).lean();
    if (!currentQuote || String(currentQuote._id) !== String(quote._id) || quote.status === "SUPERSEDED") return NextResponse.json({ error: "Only the current quote version can be decided." }, { status: 409 });
    if (!["PENDING_CUSTOMER", "SENT_TO_CUSTOMER", "VIEWED"].includes(quote.status)) return NextResponse.json({ error: "This quote is no longer awaiting a decision." }, { status: 409 });
    quote.status = status; quote.decisionReason = input.reason || undefined; quote.decidedAt = new Date(); quote.decidedBy = user._id; await quote.save();
    if (status === "APPROVED") {
      await recordCaseTransition(repairRequest, "APPROVED", { actorId: user._id, actorRole: user.role, note: "Customer approved quote", metadata: { quoteId: quote._id } });
      await RepairJob.findOneAndUpdate({ repairRequestId: repairRequest._id }, { repairRequestId: repairRequest._id, deviceId: repairRequest.deviceId, workshopId: repairRequest.workshopId, technicianId: repairRequest.technicianId, quoteId: quote._id, status: "APPROVED" }, { upsert: true, new: true, setDefaultsOnInsert: true });
    } else {
      await AuditEvent.create({ entityType: "RepairRequest", entityId: repairRequest._id, eventType: "QUOTE_REJECTED", actorId: user._id, actorRole: user.role, metadata: { quoteId: quote._id, reason: input.reason } });
    }
    const recipients = [repairRequest.technicianId].filter(Boolean); if (repairRequest.workshopId) { const members = await WorkshopMembership.find({ workshopId: repairRequest.workshopId, status: "ACTIVE" }).select("userId").lean(); recipients.push(...members.map((member) => member.userId)); }
    if (recipients.length) await Notification.insertMany([...new Set(recipients.map(String))].map((userId) => ({ userId, type: status === "APPROVED" ? "QUOTE_APPROVED" : "OTHER", entityType: "RepairRequest", entityId: repairRequest._id, title: status === "APPROVED" ? "Quote approved" : "Customer declined quote", message: `Customer decision recorded for case ${repairRequest.caseId}.` })));
    return NextResponse.json({ data: quote });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to update quote status." }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
