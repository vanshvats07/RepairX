import { normalizeErrorCategory, logStructured, generateRequestId } from "@/lib/observability";

export function apiSuccess(data, extra = {}, init, requestId = generateRequestId()) {
  return Response.json({ success: true, requestId, data, ...extra }, init);
}

export function apiError(code, message, status = 500, details, requestId = generateRequestId()) {
  logStructured({ level: "ERROR", event: "API_ERROR", route: "unknown", method: "UNKNOWN", requestId, statusCode: status, errorCode: normalizeErrorCategory(code), errorMessage: message || "Unknown error" });
  return Response.json({ success: false, requestId, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export { generateRequestId };
