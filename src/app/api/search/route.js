import { apiError, apiSuccess, generateRequestId } from "@/lib/apiResponse";
import { runRepairIntelligence } from "@/services/serpApiService";

export async function POST(request) {
  const requestId = generateRequestId();

  try {
    const { device, complaint, location, repairHistory = [] } = await request.json();
    if (!device?.brand || !device?.model || !complaint) {
      return apiError("VALIDATION_ERROR", "Device and complaint are required.", 400, undefined, requestId);
    }

    const result = await runRepairIntelligence({
      device,
      complaint,
      location: location || device.location || "Delhi NCR, India",
      repairHistory,
    });

    return apiSuccess(result, { requestId }, undefined, requestId);
  } catch (error) {
    return apiError(error.code || "INTELLIGENCE_ERROR", error.message || "Live intelligence could not be retrieved right now.", 200, undefined, requestId);
  }
}
