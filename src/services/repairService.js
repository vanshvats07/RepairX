export const REPAIR_STATUSES = ["REQUESTED", "INVESTIGATING", "AWAITING_VERIFICATION", "QUOTED", "AWAITING_APPROVAL", "APPROVED", "PICKUP_SCHEDULED", "REPAIR_IN_PROGRESS", "QUALITY_CHECK", "COMPLETED", "DELIVERED"];

export function analyzeRepairComplaint({ device, complaint, repairHistory }) {
  const text = complaint.toLowerCase();
  const batterySignal = /battery|drain|overheat|heat|charging/.test(text);
  return { possibleCauses: [{ label: "Battery degradation", confidence: batterySignal ? 0.76 : 0.34, state: "INFERRED", note: "Symptoms can be consistent with battery wear; capacity test required." }, { label: "Charging circuit", confidence: text.includes("charging") || text.includes("heat") ? 0.62 : 0.28, state: "INFERRED", note: "Prior charging repair makes this relevant to investigate." }, { label: "Background system process", confidence: 0.34, state: "INFERRED", note: "No direct Repair DNA evidence found." }], recommendedChecks: ["Inspect USB-C port for contamination", "Measure charging current under load", "Confirm battery health and thermal behavior"], relevantSearchQueries: [`${device.brand} ${device.model} battery overheating India`, `${device.brand} ${device.model} battery replacement India`, `${device.brand} ${device.model} repair ${device.location}`], partsToInvestigate: ["Battery", "USB-C charging port assembly"], confidence: "PRELIMINARY", status: "AWAITING_VERIFICATION", repairHistoryCount: repairHistory.length, technicianRequired: true };
}

export function createInvestigation({ device, complaint, repairHistory, imageCount = 0 }) { const analysis = analyzeRepairComplaint({ device, complaint, repairHistory }); return { ...analysis, deviceId: device.id, complaint, imageCount, status: "INVESTIGATING", createdAt: new Date().toISOString() }; }
export function createRepairEvent(event) { return { ...event, status: "COMPLETED", diagnosisSource: "TECHNICIAN_VERIFIED", confidence: "VERIFIED", source: "Technician verification", outcome: "Completed" }; }
export function detectRepeatedIssues(currentIssue, repairHistory) { const current = currentIssue.toLowerCase(); const related = repairHistory.filter((event) => /battery|charg|heat|drain/.test(`${event.reportedProblem} ${event.component}`.toLowerCase()) && /battery|charg|heat|drain/.test(current)); return { repeatPatternDetected: related.length > 0, message: related.length > 0 ? "Similar issue detected in the device memory. This does not confirm that a previous part failed." : "No similar issue found in the available device memory.", relatedEvents: related };
}
export function buildQuote(input = {}) {
  const {
    partCost = 0,
    labourCost = 0,
    inspectionCost = 0,
    pickupCost = 0,
    deliveryCost = 0,
    otherCharges = 0,
    taxes = 0,
    tax = 0,
  } = input;

  const total = [partCost, labourCost, inspectionCost, pickupCost, deliveryCost, otherCharges, taxes, tax].reduce((sum, value) => sum + Number(value || 0), 0);

  return {
    partCost,
    labourCost,
    inspectionCost,
    pickupCost,
    deliveryCost,
    otherCharges,
    taxes,
    tax,
    total,
  };
}
