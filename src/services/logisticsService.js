import "server-only";

export const DELIVERY_MODES = ["PICKUP_DELIVERY", "CUSTOMER_DROP_OFF", "CUSTOMER_PICKUP", "WORKSHOP_DELIVERY", "UNKNOWN"];
export const PICKUP_STATUSES = ["REQUESTED", "SCHEDULED", "OUT_FOR_PICKUP", "PICKED_UP", "FAILED", "CANCELLED"];
export const DELIVERY_STATUSES = ["PENDING", "SCHEDULED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"];

export const logisticsProviders = {
  MANUAL_WORKSHOP_FULFILLMENT: "WORKSHOP_MANAGED",
  WORKSHOP_MANAGED: "WORKSHOP_MANAGED",
  MANUAL: "WORKSHOP_MANAGED"
};

function resolveProviderAdapter(providerName = process.env.LOGISTICS_PROVIDER || "WORKSHOP_MANAGED") {
  const provider = String(providerName).toLowerCase();
  if (provider === "external") return { createPickup: async (input) => ({ ...input, provider: "external", status: "REQUESTED" }), schedulePickup: async (input) => ({ ...input, provider: "external", status: "SCHEDULED" }), createDelivery: async (input) => ({ ...input, provider: "external", status: "PENDING" }), scheduleDelivery: async (input) => ({ ...input, provider: "external", status: "SCHEDULED" }), cancelPickup: async (input) => ({ ...input, provider: "external", status: "CANCELLED" }), cancelDelivery: async (input) => ({ ...input, provider: "external", status: "CANCELLED" }), getPickupStatus: async (pickup) => pickup?.status || "REQUESTED", getDeliveryStatus: async (delivery) => delivery?.status || "PENDING" };
  return { createPickup: async (input) => ({ ...input, provider: "WORKSHOP_MANAGED", status: "REQUESTED" }), schedulePickup: async (input) => ({ ...input, provider: "WORKSHOP_MANAGED", status: "SCHEDULED" }), createDelivery: async (input) => ({ ...input, provider: "WORKSHOP_MANAGED", status: "PENDING" }), scheduleDelivery: async (input) => ({ ...input, provider: "WORKSHOP_MANAGED", status: "SCHEDULED" }), cancelPickup: async (input) => ({ ...input, provider: "WORKSHOP_MANAGED", status: "CANCELLED" }), cancelDelivery: async (input) => ({ ...input, provider: "WORKSHOP_MANAGED", status: "CANCELLED" }), getPickupStatus: async (pickup) => pickup?.status || "REQUESTED", getDeliveryStatus: async (delivery) => delivery?.status || "PENDING" };
}

export function normalizeLogisticsMode(mode) {
  return DELIVERY_MODES.includes(mode) ? mode : "UNKNOWN";
}

export function getCustomerFacingStatus(status) {
  const mapping = {
    REQUESTED: "Pickup requested",
    SCHEDULED: "Pickup scheduled",
    OUT_FOR_PICKUP: "Pickup is on the way",
    PICKED_UP: "Your device has been picked up",
    FAILED: "Pickup could not be completed",
    CANCELLED: "Pickup cancelled",
    PENDING: "Delivery is being prepared",
    OUT_FOR_DELIVERY: "Your device is on the way",
    DELIVERED: "Your device has been delivered",
    DEVICE_RECEIVED: "Your device has reached the workshop",
    REPAIR_IN_PROGRESS: "Our technician is working on your device",
    QUALITY_CHECK: "Your repair is complete. We are running final checks",
    READY_FOR_DELIVERY: "Your device is ready to come home",
    APPROVED: "Repair approved",
    PICKUP_SCHEDULED: "Pickup scheduled",
    CUSTOMER_DROP_OFF: "Drop-off selected"
  };
  return mapping[status] || status;
}

export function isValidPickupTransition(from, to) {
  const transitions = {
    REQUESTED: ["SCHEDULED", "OUT_FOR_PICKUP", "FAILED", "CANCELLED"],
    SCHEDULED: ["OUT_FOR_PICKUP", "FAILED", "CANCELLED"],
    OUT_FOR_PICKUP: ["PICKED_UP", "FAILED", "CANCELLED"],
    PICKED_UP: [],
    FAILED: ["SCHEDULED", "CANCELLED"],
    CANCELLED: []
  };
  return transitions[from]?.includes(to);
}

export function isValidDeliveryTransition(from, to) {
  const transitions = {
    PENDING: ["SCHEDULED", "FAILED", "CANCELLED"],
    SCHEDULED: ["OUT_FOR_DELIVERY", "FAILED", "CANCELLED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "FAILED", "CANCELLED"],
    DELIVERED: [],
    FAILED: ["SCHEDULED", "CANCELLED"],
    CANCELLED: []
  };
  return transitions[from]?.includes(to);
}

export const logisticsService = {
  createPickup: async ({ provider = process.env.LOGISTICS_PROVIDER || "WORKSHOP_MANAGED", ...input }) => resolveProviderAdapter(provider).createPickup({ ...input, provider }),
  schedulePickup: async ({ provider = process.env.LOGISTICS_PROVIDER || "WORKSHOP_MANAGED", ...input }) => resolveProviderAdapter(provider).schedulePickup({ ...input, provider }),
  getPickupStatus: async (pickup) => pickup?.status || "REQUESTED",
  createDelivery: async ({ provider = process.env.LOGISTICS_PROVIDER || "WORKSHOP_MANAGED", ...input }) => resolveProviderAdapter(provider).createDelivery({ ...input, provider }),
  scheduleDelivery: async ({ provider = process.env.LOGISTICS_PROVIDER || "WORKSHOP_MANAGED", ...input }) => resolveProviderAdapter(provider).scheduleDelivery({ ...input, provider }),
  getDeliveryStatus: async (delivery) => delivery?.status || "PENDING",
  cancelPickup: async (pickup) => ({ ...pickup, status: "CANCELLED" }),
  cancelDelivery: async (delivery) => ({ ...delivery, status: "CANCELLED" })
};

export default logisticsService;
