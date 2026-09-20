import "server-only";

export const internalToCustomerStatus = {
  REQUESTED: "Your request is in review",
  WORKSHOP_ACCEPTED: "Workshop accepted your request",
  WORKSHOP_DECLINED: "Workshop declined this request",
  AWAITING_TECHNICIAN: "A technician is being assigned",
  UNDER_DIAGNOSIS: "Your device is being diagnosed",
  DIAGNOSIS_VERIFIED: "Diagnosis confirmed",
  QUOTE_READY: "Quote ready",
  AWAITING_CUSTOMER_APPROVAL: "Waiting for your approval",
  APPROVED: "Repair approved",
  PICKUP_SCHEDULED: "Pickup scheduled",
  DEVICE_RECEIVED: "Your device has reached the workshop",
  REPAIR_IN_PROGRESS: "Our technician is working on your device",
  QUALITY_CHECK: "Your repair is complete. We are running final checks",
  READY_FOR_DELIVERY: "Your device is ready to come home",
  DELIVERED: "Your device has been delivered",
  CANCELLED: "This repair was cancelled"
};

export function getCustomerFacingStatus(status) {
  return internalToCustomerStatus[status] || "Your repair is in progress";
}

const statusMappingService = { getCustomerFacingStatus };

export default statusMappingService;
