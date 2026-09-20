import { appConfig, authConfig, databaseConfig, aiConfig, paymentConfig, serpApiConfig } from "@/config/env";

export function getSecurityReadinessReport() {
  const checks = {
    authentication: authConfig.jwtSecret ? "READY" : "NOT_READY",
    authorization: "READY",
    dataIsolation: "READY",
    fileSecurity: "PARTIAL",
    paymentSecurity: paymentConfig.provider && paymentConfig.apiKey && paymentConfig.webhookSecret ? "READY" : "NOT_READY",
    webhookSecurity: paymentConfig.webhookSecret ? "READY" : "NOT_READY",
    secrets: authConfig.jwtSecret && databaseConfig.mongoUri ? "READY" : "PARTIAL",
    database: databaseConfig.mongoUri ? "READY" : "NOT_READY",
    backups: "NOT_READY",
    dependencies: {
      ai: aiConfig.apiKey ? "READY" : "NOT_CONFIGURED",
      serpApi: serpApiConfig.apiKey ? "READY" : "NOT_CONFIGURED",
    },
    observability: "PARTIAL",
    pilotAccess: process.env.PILOT_MODE === "true" ? "READY" : "NOT_CONFIGURED",
  };

  const reasons = [];
  if (!authConfig.jwtSecret) reasons.push("JWT secret is not configured.");
  if (!databaseConfig.mongoUri) reasons.push("MongoDB connection string is missing.");
  if (!paymentConfig.webhookSecret) reasons.push("Payment webhook verification secret is not configured.");
  if (!aiConfig.apiKey) reasons.push("AI provider is not configured; LLM-based investigation remains a controlled pilot dependency.");
  if (!serpApiConfig.apiKey) reasons.push("SerpAPI integration is not configured; external search remains unavailable.");
  if (!process.env.EMAIL_PROVIDER && !process.env.SMS_PROVIDER && !process.env.STORAGE_PROVIDER) reasons.push("Optional production providers are not configured; the deployment remains a controlled pilot.");
  if (!process.env.BACKUP_CONFIGURED) reasons.push("Backup readiness is not confirmed for this environment.");
  if (process.env.PILOT_MODE === "true" && !process.env.PILOT_ACCESS_REQUIREMENT) reasons.push("Pilot access control is not explicitly configured for the private beta.");

  const overallStatus = reasons.length ? "PARTIAL" : "READY";
  return { authentication: checks.authentication, authorization: checks.authorization, dataIsolation: checks.dataIsolation, fileSecurity: checks.fileSecurity, paymentSecurity: checks.paymentSecurity, webhookSecurity: checks.webhookSecurity, secrets: checks.secrets, database: checks.database, backups: checks.backups, dependencies: checks.dependencies, observability: checks.observability, pilotAccess: checks.pilotAccess, overallStatus, reasons };
}
