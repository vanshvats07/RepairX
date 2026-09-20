export function getLogisticsProviderAdapter() {
  const provider = (process.env.LOGISTICS_PROVIDER || "WORKSHOP_MANAGED").toLowerCase();
  if (provider === "external") {
    return {
      createPickup: async (input = {}) => ({ provider: "external", status: "REQUESTED", ...input }),
      schedulePickup: async (input = {}) => ({ provider: "external", status: "SCHEDULED", ...input }),
      createDelivery: async (input = {}) => ({ provider: "external", status: "PENDING", ...input }),
      scheduleDelivery: async (input = {}) => ({ provider: "external", status: "SCHEDULED", ...input }),
      cancelPickup: async (input = {}) => ({ provider: "external", status: "CANCELLED", ...input }),
      cancelDelivery: async (input = {}) => ({ provider: "external", status: "CANCELLED", ...input })
    };
  }
  return {
    createPickup: async (input = {}) => ({ provider: "WORKSHOP_MANAGED", status: "REQUESTED", ...input }),
    schedulePickup: async (input = {}) => ({ provider: "WORKSHOP_MANAGED", status: "SCHEDULED", ...input }),
    createDelivery: async (input = {}) => ({ provider: "WORKSHOP_MANAGED", status: "PENDING", ...input }),
    scheduleDelivery: async (input = {}) => ({ provider: "WORKSHOP_MANAGED", status: "SCHEDULED", ...input }),
    cancelPickup: async (input = {}) => ({ provider: "WORKSHOP_MANAGED", status: "CANCELLED", ...input }),
    cancelDelivery: async (input = {}) => ({ provider: "WORKSHOP_MANAGED", status: "CANCELLED", ...input })
  };
}

export async function createPickup(input = {}) {
  return getLogisticsProviderAdapter().createPickup(input);
}

export async function schedulePickup(input = {}) {
  return getLogisticsProviderAdapter().schedulePickup(input);
}
