import { logEvent } from "@/lib/logger";

export function buildSafeError(error, fallbackMessage = "Something went wrong. Please try again.") {
  const code = error?.code || "INTERNAL_ERROR";
  const message = error?.message || fallbackMessage;
  return {
    success: false,
    error: {
      code,
      message: code === "RATE_LIMITED" || code === "VALIDATION_ERROR" ? message : fallbackMessage,
    },
  };
}

export function reportServerError(event, error, context = {}) {
  logEvent(event, {
    ...context,
    errorCode: error?.code || "INTERNAL_ERROR",
    errorMessage: error?.message || "Unknown error",
    stack: error?.stack || undefined,
  });
}
