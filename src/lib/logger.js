import { loggingConfig } from "@/config/env";

export function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function logEvent(event, payload = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    service: loggingConfig.serviceName,
    event,
    ...payload,
  };

  if (loggingConfig.enableJsonLogs) {
    console.info(JSON.stringify(record));
    return;
  }

  console.info(`${record.timestamp} ${record.service} ${event}`, payload);
}

export function sanitizeSensitiveValue(value) {
  if (typeof value !== "string") return value;
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}
