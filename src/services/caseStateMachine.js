const transitions = {
  REQUESTED: { AWAITING_TECHNICIAN: ["CUSTOMER", "WORKSHOP_OWNER", "ADMIN"] },
  AWAITING_TECHNICIAN: { WORKSHOP_ACCEPTED: ["WORKSHOP_OWNER", "ADMIN"], UNDER_DIAGNOSIS: ["TECHNICIAN"] },
  WORKSHOP_ACCEPTED: { UNDER_DIAGNOSIS: ["TECHNICIAN"], CANCELLED: ["WORKSHOP_OWNER", "ADMIN"] },
  UNDER_DIAGNOSIS: { DIAGNOSIS_VERIFIED: ["TECHNICIAN"] },
  DIAGNOSIS_VERIFIED: { QUOTE_READY: ["WORKSHOP_OWNER", "ADMIN"] },
  QUOTE_READY: { AWAITING_CUSTOMER_APPROVAL: ["WORKSHOP_OWNER", "ADMIN"] },
  AWAITING_CUSTOMER_APPROVAL: { APPROVED: ["CUSTOMER"], CANCELLED: ["CUSTOMER", "WORKSHOP_OWNER", "ADMIN"] },
  APPROVED: { DEVICE_RECEIVED: ["WORKSHOP_OWNER", "ADMIN"], REPAIR_IN_PROGRESS: ["WORKSHOP_OWNER", "TECHNICIAN", "ADMIN"] },
  DEVICE_RECEIVED: { REPAIR_QUEUED: ["WORKSHOP_OWNER", "ADMIN"] },
  REPAIR_QUEUED: { REPAIR_IN_PROGRESS: ["WORKSHOP_OWNER", "TECHNICIAN", "ADMIN"] },
  REPAIR_IN_PROGRESS: { QUALITY_CHECK: ["TECHNICIAN", "WORKSHOP_OWNER", "ADMIN"] },
  QUALITY_CHECK: { COMPLETED: ["TECHNICIAN", "WORKSHOP_OWNER", "ADMIN"] },
  COMPLETED: { DELIVERED: ["WORKSHOP_OWNER", "ADMIN"] },
};

export function assertCaseTransition(record, nextStatus, role) {
  if (!record) throw new Error("Repair case not found.");
  if (record.status === nextStatus) return;
  const allowedRoles = transitions[record.status]?.[nextStatus] || [];
  if (!allowedRoles.includes(role)) {
    const error = new Error(`Role ${role} cannot transition ${record.status} to ${nextStatus}.`);
    error.code = "FORBIDDEN_TRANSITION";
    throw error;
  }
}

export async function recordCaseTransition(record, nextStatus, { note, actorId, actorRole, metadata = {} } = {}) {
  assertCaseTransition(record, nextStatus, actorRole);
  if (record.status === nextStatus) return record;
  const { default: RepairStatus } = await import("@/models/RepairStatus");
  const previousStatus = record.status;
  record.status = nextStatus;
  await record.save();
  await RepairStatus.create({ repairRequestId: record._id, status: nextStatus, note: note || `${previousStatus} -> ${nextStatus}`, actorId, actorRole, metadata });
  return record;
}
