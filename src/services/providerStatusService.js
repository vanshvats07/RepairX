import { appConfig, aiConfig, paymentConfig, serpApiConfig } from "@/config/env";

function status(configured) { return configured ? "CONFIGURED" : "NOT_CONFIGURED"; }

export function getProviderStatus() {
  const paymentConfigured = Boolean(paymentConfig.provider && paymentConfig.apiKey && paymentConfig.webhookSecret);
  const aiConfigured = Boolean((aiConfig.localDemo && appConfig.isDevelopment) || (aiConfig.apiKey && aiConfig.provider && aiConfig.provider !== "none"));
  const serpConfigured = Boolean(serpApiConfig.apiKey);
  const logisticsConfigured = Boolean(process.env.LOGISTICS_PROVIDER && process.env.LOGISTICS_API_KEY);
  const emailConfigured = Boolean(process.env.EMAIL_PROVIDER && process.env.EMAIL_API_KEY);
  const storageConfigured = Boolean(process.env.STORAGE_PROVIDER && process.env.STORAGE_BUCKET);
  const smsConfigured = Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);
  return {
    payment: { status: status(paymentConfigured), provider: paymentConfig.provider || "none" },
    email: { status: status(emailConfigured), provider: process.env.EMAIL_PROVIDER || "none" },
    sms: { status: status(smsConfigured), provider: process.env.SMS_PROVIDER || "none" },
    storage: { status: status(storageConfigured), provider: process.env.STORAGE_PROVIDER || "none" },
    logistics: { status: status(logisticsConfigured), provider: process.env.LOGISTICS_PROVIDER || "WORKSHOP_MANAGED" },
    ai: { status: status(aiConfigured), provider: aiConfig.localDemo && appConfig.isDevelopment ? "LOCAL_DEMO_AI" : aiConfig.provider || "none" },
    serpApi: { status: status(serpConfigured), provider: "serpapi" },
    environment: appConfig.env,
  };
}
