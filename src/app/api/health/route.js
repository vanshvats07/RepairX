import { appConfig, authConfig, databaseConfig } from "@/config/env";
import { apiSuccess, generateRequestId } from "@/lib/apiResponse";
import { logStructured } from "@/lib/observability";
import { connectMongo } from "@/lib/mongodb";
import { getProviderStatus } from "@/services/providerStatusService";

export async function GET() {
  const requestId = generateRequestId();

  let mongoStatus = "unavailable";
  try {
    if (databaseConfig.mongoUri) {
      await connectMongo();
      mongoStatus = "ok";
    }
  } catch {
    mongoStatus = "unavailable";
  }

  const payload = {
    status: "ok",
    service: "repairx-api",
    environment: appConfig.env,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    dependencies: {
      mongodb: mongoStatus,
      jwt: authConfig.jwtSecret ? "configured" : "missing",
    },
    providers: getProviderStatus(),
  };

  logStructured({ level: "INFO", event: "HEALTH_CHECK", route: "/api/health", method: "GET", requestId, statusCode: 200, durationMs: 0, ...payload });
  return apiSuccess(payload, {}, undefined, requestId);
}
