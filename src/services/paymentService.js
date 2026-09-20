import "server-only";
import crypto from "node:crypto";
import { paymentConfig } from "@/config/env";

export function paymentProviderConfigured() {
  return Boolean(paymentConfig.provider && paymentConfig.apiKey);
}

export function createPaymentId() {
  return `pay_${crypto.randomUUID()}`;
}

export function assertPaymentCanBeCreated() {
  if (process.env.APP_ENV === "production" && !paymentProviderConfigured()) {
    const error = new Error("Payment provider is not configured.");
    error.code = "PAYMENT_PROVIDER_UNAVAILABLE";
    throw error;
  }
}

export function paymentProviderName() {
  return paymentProviderConfigured() ? paymentConfig.provider : "DEVELOPMENT_MANUAL";
}

export function getProviderPaymentAdapter() {
  const provider = (paymentConfig.provider || "DEVELOPMENT_MANUAL").toLowerCase();
  if (provider === "stripe") return { createPayment: async (input) => ({ provider: "stripe", ...input, status: "PENDING" }), confirmPayment: async (input) => ({ provider: "stripe", ...input, status: "PAID" }) };
  if (provider === "razorpay") return { createPayment: async (input) => ({ provider: "razorpay", ...input, status: "PENDING" }), confirmPayment: async (input) => ({ provider: "razorpay", ...input, status: "PAID" }) };
  return { createPayment: async (input) => ({ provider: "development_manual", ...input, status: "PENDING" }), confirmPayment: async (input) => ({ provider: "development_manual", ...input, status: "PAID" }) };
}

export function verifyPaymentPayload(input = {}) {
  if (!input.providerReference) {
    const error = new Error("A trusted provider reference is required to confirm payment.");
    error.code = "PAYMENT_REFERENCE_REQUIRED";
    throw error;
  }
  return { providerReference: input.providerReference, status: "PAID" };
}

export function createPaymentOrder(input = {}) {
  const adapter = getProviderPaymentAdapter();
  return adapter.createPayment(input);
}

export function confirmPayment(input = {}) {
  const adapter = getProviderPaymentAdapter();
  return adapter.confirmPayment(input);
}
