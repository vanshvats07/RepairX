import { NextResponse } from "next/server";
import Payment from "@/models/Payment";
import Quote from "@/models/Quote";
import RepairRequest from "@/models/RepairRequest";
import AuditEvent from "@/models/AuditEvent";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth } from "@/services/authService";
import { assertPaymentCanBeCreated, createPaymentId, paymentProviderName } from "@/services/paymentService";

export async function POST(request) {
  try {
    const user = await requireAuth(); const input = await request.json();
    if (!input.quoteId || !input.idempotencyKey) return NextResponse.json({ error: "Quote and idempotency key are required." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const existing = await Payment.findOne({ idempotencyKey: input.idempotencyKey }).lean(); if (existing) return NextResponse.json({ data: existing });
    const quote = await Quote.findById(input.quoteId); if (!quote || quote.status !== "APPROVED") return NextResponse.json({ error: "Only an approved quote can create a payment." }, { status: 409 });
    const repairRequest = await RepairRequest.findById(quote.repairRequestId); if (!repairRequest || String(repairRequest.customerId) !== String(user._id)) return NextResponse.json({ error: "You do not own this repair case." }, { status: 403 });
    assertPaymentCanBeCreated();
    const payment = await Payment.create({ repairRequestId: repairRequest._id, quoteId: quote._id, customerId: user._id, paymentId: createPaymentId(), idempotencyKey: input.idempotencyKey, amount: quote.total, currency: quote.currency, status: "PENDING", provider: paymentProviderName() });
    await AuditEvent.create({ entityType: "RepairRequest", entityId: repairRequest._id, eventType: "PAYMENT_CREATED", actorId: user._id, actorRole: user.role, metadata: { paymentId: payment._id, quoteId: quote._id, amount: payment.amount } });
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to create payment order." }, { status: error.code === "PAYMENT_PROVIDER_UNAVAILABLE" ? 503 : error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
