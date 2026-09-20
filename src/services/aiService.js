import "server-only";

export function analyzeRepairComplaint({ device, complaint, repairHistory = [], evidence = [] }) {
  const symptomText = complaint.toLowerCase();
  const possibleCauses = [
    { label: "Battery degradation", confidence: /battery|drain|overheat|heat/.test(symptomText) ? "MEDIUM" : "LOW", state: "INFERRED", why: "Reported symptoms and available device history support battery investigation." },
    { label: "Charging / power circuitry", confidence: /charg|power|heat/.test(symptomText) ? "MEDIUM" : "LOW", state: "INFERRED", why: "Charging-related language or prior charging events make this relevant to inspect." },
    { label: "Thermal issue", confidence: /heat|overheat|thermal/.test(symptomText) ? "MEDIUM" : "LOW", state: "INFERRED", why: "The customer-reported temperature change needs a physical thermal inspection." },
    { label: "Software / background activity", confidence: "LOW", state: "INFERRED", why: "A system-level cause cannot be ruled out from the current information." },
  ];
  return { possibleCauses, recommendedChecks: ["Battery health test", "Charging current test", "Thermal inspection", "Background power consumption check", "Relevant charging circuitry inspection"], affectedComponents: [], relevantSearchQueries: [], evidenceCount: evidence.length, repairHistoryCount: repairHistory.length, confidence: "PRELIMINARY", disclaimer: "Preliminary assessment. Physical technician verification is required before repair." };
}
