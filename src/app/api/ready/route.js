import { appConfig, databaseConfig } from "@/config/env";
import { apiSuccess, generateRequestId } from "@/lib/apiResponse";
import { logStructured } from "@/lib/observability";
import { connectMongo } from "@/lib/mongodb";
import { getProviderStatus } from "@/services/providerStatusService";

export async function GET() {
  const requestId = generateRequestId();
  const checks = {
    appConfig: Boolean(appConfig.name),
    mongoConfigured: Boolean(databaseConfig.mongoUri),
  };

  let mongoDb = "unavailable";
  try {
    if (databaseConfig.mongoUri) {
      await connectMongo();
      mongoDb = "ok";
    }
  } catch {
    mongoDb = "unavailable";
  }

  const ready = checks.appConfig && checks.mongoConfigured && mongoDb === "ok";
  const payload = {
    status: ready ? "ok" : "degraded",
    service: "repairx-api",
    environment: appConfig.env,
    timestamp: new Date().toISOString(),
    checks: {
      appConfig: checks.appConfig ? "ok" : "missing",
      mongoConfigured: checks.mongoConfigured ? "ok" : "missing",
      mongodb: mongoDb,
      providers: getProviderStatus(),
    },
    ready,
  };

  logStructured({ level: ready ? "INFO" : "WARN", event: "READY_CHECK", route: "/api/ready", method: "GET", requestId, statusCode: ready ? 200 : 503, durationMs: 0, ...payload });
  return apiSuccess(payload, {}, { status: ready ? 200 : 503 }, requestId);
}
