import { NextResponse } from "next/server";
import Payment from "@/models/Payment";
import RepairRequest from "@/models/RepairRequest";
import Notification from "@/models/Notification";
import AuditEvent from "@/models/AuditEvent";
import WorkshopMembership from "@/models/WorkshopMembership";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth, requireRole } from "@/services/authService";
import { verifyPaymentPayload } from "@/services/paymentService";

export async function POST(request, { params }) {
  try {
    const user = requireRole(await requireAuth(), ["ADMIN"]); const { id } = await params; const input = await request.json();
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const payment = await Payment.findById(id); if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (payment.status === "PAID") return NextResponse.json({ data: payment });
    if (!["PENDING", "AUTHORIZED"].includes(payment.status)) return NextResponse.json({ error: "This payment cannot be confirmed." }, { status: 409 });
    const verified = verifyPaymentPayload(input); payment.status = verified.status; payment.providerReference = verified.providerReference; payment.completedAt = new Date(); await payment.save();
    const repairRequest = await RepairRequest.findById(payment.repairRequestId); if (repairRequest) {
      await AuditEvent.create({ entityType: "RepairRequest", entityId: repairRequest._id, eventType: "PAYMENT_CONFIRMED", actorId: user._id, actorRole: user.role, metadata: { paymentId: payment._id, providerReference: payment.providerReference, amount: payment.amount } });
      const recipients = [repairRequest.customerId, repairRequest.technicianId].filter(Boolean); if (repairRequest.workshopId) { const members = await WorkshopMembership.find({ workshopId: repairRequest.workshopId, status: "ACTIVE" }).select("userId").lean(); recipients.push(...members.map((member) => member.userId)); }
      if (recipients.length) await Notification.insertMany([...new Set(recipients.map(String))].map((userId) => ({ userId, type: "OTHER", entityType: "Payment", entityId: payment._id, title: "Payment confirmed", message: `Payment confirmed for case ${repairRequest.caseId}.` })));
    }
    return NextResponse.json({ data: payment });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to confirm payment." }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "UNAUTHORIZED" ? 401 : 400 }); }
}
