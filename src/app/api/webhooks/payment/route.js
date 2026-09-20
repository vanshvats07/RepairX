import crypto from "node:crypto";
import { NextResponse } from "next/server";
import Payment from "@/models/Payment";
import ProviderWebhookEvent from "@/models/ProviderWebhookEvent";
import AuditEvent from "@/models/AuditEvent";
import { connectMongo } from "@/lib/mongodb";
import { paymentConfig } from "@/config/env";

function signatureMatches(rawBody, signature) {
  if (!paymentConfig.webhookSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", paymentConfig.webhookSecret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(request) {
  const rawBody = await request.text();
  if (!signatureMatches(rawBody, request.headers.get("x-payment-signature"))) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody); const eventId = payload.id || payload.eventId; if (!eventId || !payload.paymentId) return NextResponse.json({ error: "Webhook event ID and payment ID are required." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const existing = await ProviderWebhookEvent.findOne({ provider: paymentConfig.provider, eventId }).lean(); if (existing) return NextResponse.json({ received: true, duplicate: true });
    const event = await ProviderWebhookEvent.create({ provider: paymentConfig.provider, eventId, eventType: payload.type || "payment.updated" });
    const payment = await Payment.findOne({ paymentId: payload.paymentId }); if (!payment) { event.result = "PAYMENT_NOT_FOUND"; event.processedAt = new Date(); await event.save(); return NextResponse.json({ error: "Payment not found." }, { status: 404 }); }
    if (payload.amount != null && Number(payload.amount) !== Number(payment.amount)) { event.result = "PAYMENT_MISMATCH"; event.errorCategory = "AMOUNT_MISMATCH"; event.processedAt = new Date(); await event.save(); return NextResponse.json({ error: "Payment amount mismatch." }, { status: 409 }); }
    if (payload.status === "PAID" || payload.status === "AUTHORIZED") { payment.status = payload.status; payment.providerReference = payload.providerReference || payment.providerReference; payment.completedAt = payload.status === "PAID" ? new Date() : payment.completedAt; await payment.save(); await AuditEvent.create({ entityType: "Payment", entityId: payment._id, eventType: payload.status === "PAID" ? "PAYMENT_CONFIRMED" : "PAYMENT_AUTHORIZED", metadata: { paymentId: payment.paymentId, provider: payment.provider } }); }
    if (payload.status === "FAILED") { payment.status = "FAILED"; payment.failureReason = payload.failureReason || "Provider reported payment failure"; await payment.save(); await AuditEvent.create({ entityType: "Payment", entityId: payment._id, eventType: "PAYMENT_FAILED", metadata: { paymentId: payment.paymentId, provider: payment.provider } }); }
    event.result = "PROCESSED"; event.processedAt = new Date(); await event.save(); return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: "Webhook processing failed." }, { status: 400 }); }
}
