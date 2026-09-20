import "server-only";

export const TECHNICIAN_STATUSES = ["REQUESTED", "AWAITING_TECHNICIAN", "UNDER_DIAGNOSIS", "DIAGNOSIS_VERIFIED", "QUOTE_READY", "AWAITING_CUSTOMER_APPROVAL", "APPROVED", "REPAIR_IN_PROGRESS", "QUALITY_CHECK", "COMPLETED", "DELIVERED", "CANCELLED"];
const transitions = { REQUESTED: ["AWAITING_TECHNICIAN", "CANCELLED"], AWAITING_TECHNICIAN: ["UNDER_DIAGNOSIS", "CANCELLED"], UNDER_DIAGNOSIS: ["DIAGNOSIS_VERIFIED", "CANCELLED"], DIAGNOSIS_VERIFIED: ["QUOTE_READY"], QUOTE_READY: ["AWAITING_CUSTOMER_APPROVAL"], AWAITING_CUSTOMER_APPROVAL: ["APPROVED", "CANCELLED"], APPROVED: ["REPAIR_IN_PROGRESS"], REPAIR_IN_PROGRESS: ["QUALITY_CHECK"], QUALITY_CHECK: ["COMPLETED"], COMPLETED: ["DELIVERED"], DELIVERED: [], CANCELLED: [] };
export function canTransition(from, to) { return from === to || transitions[from]?.includes(to); }
export function validateCost(value) { const number = Number(value); if (!Number.isFinite(number) || number < 0) throw new Error("Costs must be non-negative numbers."); return number; }
export function calculateQuoteTotal(input) { return ["partCost", "labourCost", "inspectionCost", "pickupCost", "deliveryCost", "otherCharges", "taxes", "tax"].reduce((total, key) => total + validateCost(input[key] || 0), 0); }
