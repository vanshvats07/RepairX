const CASE_LIFECYCLE_STATES = [
  "NEW",
  "ASSESSMENT_PENDING",
  "ASSESSMENT_READY",
  "WORKSHOP_MATCHING",
  "WORKSHOP_PENDING",
  "WORKSHOP_ACCEPTED",
  "TECHNICIAN_PENDING",
  "TECHNICIAN_VERIFYING",
  "VERIFIED",
  "QUOTE_PENDING",
  "CUSTOMER_APPROVAL_PENDING",
  "APPROVED",
  "DEVICE_PICKUP",
  "DEVICE_RECEIVED",
  "REPAIR_QUEUED",
  "REPAIR_IN_PROGRESS",
  "QUALITY_CHECK",
  "READY_FOR_DELIVERY",
  "DELIVERY",
  "DELIVERED",
  "FOLLOW_UP",
  "CLOSED",
  "ON_HOLD",
  "PART_UNAVAILABLE",
  "DISPUTED",
  "ESCALATED",
  "CANCELLED",
];

const CASE_ACTION_MAP = {
  REQUESTED: {
    actionType: "REPAIR_REQUEST_CREATED",
    responsibleRole: "CUSTOMER",
    label: "Complete case intake and consent",
    description: "Customer must complete the intake, device details, and consent flow before work begins.",
    priority: "HIGH",
  },
  AWAITING_TECHNICIAN: {
    actionType: "TECHNICIAN_ASSIGNMENT_PENDING",
    responsibleRole: "OPERATIONS",
    label: "Assign technician for verification",
    description: "A repair request is waiting for technician review and verification.",
    priority: "HIGH",
  },
  WORKSHOP_ACCEPTED: {
    actionType: "WORKSHOP_ACCEPTED",
    responsibleRole: "WORKSHOP",
    label: "Review and confirm next repair action",
    description: "The workshop has accepted the case and must take the next operational step.",
    priority: "HIGH",
  },
  DIAGNOSIS_VERIFIED: {
    actionType: "TECHNICIAN_VERIFICATION_COMPLETE",
    responsibleRole: "WORKSHOP",
    label: "Prepare quote and customer approval",
    description: "Technician verification is complete. The workshop should prepare the quote for the customer.",
    priority: "HIGH",
  },
  QUOTE_READY: {
    actionType: "QUOTE_READY",
    responsibleRole: "CUSTOMER",
    label: "Review and approve quote",
    description: "The customer must review the quoted repair and approve or reject it.",
    priority: "HIGH",
  },
  APPROVED: {
    actionType: "REPAIR_APPROVED",
    responsibleRole: "WORKSHOP",
    label: "Schedule repair and pickup",
    description: "The customer approved the repair. The workshop should schedule pickup and repair execution.",
    priority: "HIGH",
  },
  REPAIR_IN_PROGRESS: {
    actionType: "REPAIR_IN_PROGRESS",
    responsibleRole: "TECHNICIAN",
    label: "Continue repair and record evidence",
    description: "Repair is in progress and the technician is responsible for progress and quality evidence.",
    priority: "HIGH",
  },
  QUALITY_CHECK: {
    actionType: "QUALITY_CHECK_REQUIRED",
    responsibleRole: "TECHNICIAN",
    label: "Complete quality verification",
    description: "The repair is complete, but quality validation is still required before delivery.",
    priority: "HIGH",
  },
  READY_FOR_DELIVERY: {
    actionType: "READY_FOR_DELIVERY",
    responsibleRole: "WORKSHOP",
    label: "Prepare delivery and close the case",
    description: "The repaired device is ready for delivery and the final customer handoff is pending.",
    priority: "MEDIUM",
  },
  DELIVERED: {
    actionType: "DELIVERY_COMPLETED",
    responsibleRole: "CUSTOMER",
    label: "Confirm repair outcome and complete follow-up",
    description: "The device has been delivered. The customer should complete the follow-up and outcome confirmation.",
    priority: "MEDIUM",
  },
  FOLLOW_UP: {
    actionType: "FOLLOW_UP_REQUIRED",
    responsibleRole: "OPERATIONS",
    label: "Review follow-up outcome and close the case",
    description: "Follow-up is required before the case can be formally closed.",
    priority: "MEDIUM",
  },
  DISPUTED: {
    actionType: "DISPUTE_REVIEW",
    responsibleRole: "OPERATIONS",
    label: "Review dispute and preserve evidence",
    description: "Customer or workshop dispute requires operational review and evidence preservation.",
    priority: "CRITICAL",
  },
  ESCALATED: {
    actionType: "CASE_ESCALATED",
    responsibleRole: "OPERATIONS",
    label: "Escalate to human review",
    description: "The case requires human intervention due to operational risk or unresolved exceptions.",
    priority: "CRITICAL",
  },
};

function createCaseNextAction({ actionType, responsibleRole, label, description, priority, createdAt = new Date(), dueAt = null }) {
  return {
    actionType,
    responsibleRole,
    label,
    description,
    priority,
    createdAt: createdAt.toISOString ? createdAt.toISOString() : new Date(createdAt).toISOString(),
    dueAt: dueAt ? (dueAt.toISOString ? dueAt.toISOString() : new Date(dueAt).toISOString()) : null,
  };
}

export function caseNextActionService({ status, createdAt, customerId, workshopId, technicianId, dueAt }) {
  const base = CASE_ACTION_MAP[status] || {
    actionType: "CASE_ACTION_REQUIRED",
    responsibleRole: "OPERATIONS",
    label: "Review case and assign next action",
    description: "The case requires a human decision because no explicit next action is available from the current state.",
    priority: "MEDIUM",
  };

  return createCaseNextAction({
    ...base,
    createdAt: createdAt || new Date(),
    dueAt: dueAt || null,
  });
}

export function createProductLearningRecord({
  sourceCaseIds = [],
  category,
  observation,
  evidence = [],
  impact,
  status = "OBSERVED",
  createdBy,
  createdAt = new Date(),
  resolution = "",
  resolvedAt = null,
}) {
  return {
    sourceCaseIds: Array.isArray(sourceCaseIds) ? sourceCaseIds : [sourceCaseIds],
    category,
    observation,
    evidence: Array.isArray(evidence) ? evidence : [evidence],
    impact,
    status,
    createdBy,
    createdAt: createdAt.toISOString ? createdAt.toISOString() : new Date(createdAt).toISOString(),
    resolution,
    resolvedAt: resolvedAt ? (resolvedAt.toISOString ? resolvedAt.toISOString() : new Date(resolvedAt).toISOString()) : null,
  };
}

export { CASE_LIFECYCLE_STATES };
