import { appConfig, loggingConfig } from "@/config/env";

const SLOW_API_THRESHOLD_MS = Number(process.env.SLOW_API_THRESHOLD_MS || 1500);

export function normalizeErrorCategory(code = "INTERNAL_ERROR") {
  const map = {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    UNAUTHORIZED: "AUTHENTICATION_ERROR",
    FORBIDDEN: "AUTHORIZATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    RATE_LIMITED: "RATE_LIMITED",
    DATABASE_ERROR: "DATABASE_ERROR",
    PAYMENT_PROVIDER_UNAVAILABLE: "PAYMENT_ERROR",
    PAYMENT_REFERENCE_REQUIRED: "PAYMENT_ERROR",
    AI_ERROR: "AI_ERROR",
    SERPAPI_ERROR: "SEARCH_PROVIDER_ERROR",
    FORBIDDEN_TRANSITION: "VALIDATION_ERROR",
    INVALID_ID: "VALIDATION_ERROR",
  };
  return map[code] || code;
}

export function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function redactValue(value) {
  if (typeof value !== "string") return value;
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}

export function logStructured({ level = "INFO", event = "APP_EVENT", route, method, statusCode, requestId, durationMs, ...payload }) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    service: loggingConfig.serviceName,
    environment: appConfig.env,
    event,
    route: route || "unknown",
    method: method || "UNKNOWN",
    requestId: requestId || generateRequestId(),
    statusCode: statusCode || null,
    durationMs: durationMs ?? null,
    ...payload,
  };

  if (process.env.NODE_ENV === "test") return record;
  if (loggingConfig.enableJsonLogs) {
    console.log(JSON.stringify(record));
    return record;
  }
  console.log(`${record.timestamp} ${record.level} ${record.service} ${record.event} ${record.requestId} ${record.route} ${record.method} ${record.durationMs ?? "-"}ms`);
  return record;
}

export function withRequestTiming({ route, method, requestId, action }, callback) {
  const startedAt = Date.now();
  return Promise.resolve(callback()).then((result) => {
    const durationMs = Date.now() - startedAt;
    logStructured({ level: durationMs > SLOW_API_THRESHOLD_MS ? "WARN" : "INFO", event: action || "REQUEST_COMPLETED", route, method, requestId, durationMs, statusCode: result?.status || 200 });
    return result;
  }).catch((error) => {
    const durationMs = Date.now() - startedAt;
    logStructured({ level: "ERROR", event: action || "REQUEST_FAILED", route, method, requestId, durationMs, statusCode: error?.status || 500, errorCode: normalizeErrorCategory(error?.code || "INTERNAL_ERROR"), errorMessage: error?.message || "Unknown error" });
    throw error;
  });
}

export function classifyHealthStatus({ configured, available }) {
  if (!configured) return "NOT_CONFIGURED";
  if (!available) return "UNAVAILABLE";
  return "HEALTHY";
}

export function getStaleCaseSummary(rows = []) {
  return rows.map((row) => ({
    caseId: row.caseId,
    status: row.status,
    waitingMs: Number(row.waitingMs || 0),
    stale: Number(row.waitingMs || 0) > (Number(process.env.STALE_CASE_THRESHOLD_MS || 3 * 60 * 60 * 1000)),
  }));
}
