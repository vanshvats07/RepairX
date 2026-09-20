import { apiError, apiSuccess, generateRequestId } from "@/lib/apiResponse";
import { rateLimit } from "@/lib/security";
import { authenticate, publicUser, setSession } from "@/services/authService";

export async function POST(request) {
  const requestId = generateRequestId();

  try {
    const payload = await request.json();
    rateLimit({ key: `login:${payload.email || "anonymous"}`.toLowerCase(), max: 10, windowMs: 60_000 });
    const user = await authenticate(payload);
    await setSession(user);
    return apiSuccess(publicUser(user), {}, undefined, requestId);
  } catch (error) {
    if (error.code === "RATE_LIMITED") return apiError(error.code, error.message, 429, undefined, requestId);
    return apiError(error.code || "UNAUTHORIZED", error.message || "Login failed.", error.message === "Database is not configured yet." ? 503 : 401, undefined, requestId);
  }
}
