function normalized(value) { return String(value || "").trim().toLowerCase(); }

export function evaluateWorkshopCandidate({ workshop, device = {}, requiredCapabilities = [], location = {} }) {
  const capabilityText = [...(workshop.capabilities || []), ...(workshop.supportedBrands || [])].map(normalized);
  const brandMatch = workshop.supportedBrands?.some((brand) => normalized(brand) === normalized(device.brand));
  const deviceMatch = workshop.supportedDevices?.some((model) => normalized(device.model).includes(normalized(model)) || normalized(model).includes(normalized(device.model)));
  const capabilityMatch = requiredCapabilities.length === 0 || requiredCapabilities.some((required) => capabilityText.some((capability) => capability.includes(normalized(required)) || normalized(required).includes(capability)));
  const areas = workshop.serviceAreas || {};
  const configuredAreas = [...(areas.localities || []), ...(areas.cities || []), ...(areas.pincodes || [])].map(normalized);
  const requestedAreas = [location.locality, location.city, location.pincode].filter(Boolean).map(normalized);
  const locationMatch = configuredAreas.length ? requestedAreas.some((value) => configuredAreas.includes(value)) : null;
  const networkEligible = workshop.verificationStatus === "VERIFIED" && ["ACTIVE", "PILOT_ACTIVE"].includes(workshop.pilotStatus) && workshop.isNetworkWorkshop === true;
  const eligible = networkEligible && capabilityMatch && locationMatch !== false && workshop.availability !== "PAUSED" && workshop.availability !== "TEMPORARILY_UNAVAILABLE";
  return { eligibility: eligible ? "ELIGIBLE" : locationMatch === false ? "INELIGIBLE" : networkEligible && (brandMatch || deviceMatch || capabilityMatch) ? "UNCERTAIN" : "INELIGIBLE", capabilityMatch: capabilityMatch ? "MATCHED" : "NOT_MATCHED", locationMatch: locationMatch === true ? "MATCHED" : locationMatch === false ? "NOT_MATCHED" : "UNKNOWN", reasons: [brandMatch || deviceMatch ? "Device brand/model supported" : null, capabilityMatch ? "Required capability recorded" : null, locationMatch === true ? "Service area matched" : null].filter(Boolean), limitations: [locationMatch === null ? "Service area not configured" : locationMatch === false ? "Case is outside configured service areas" : null, workshop.availability === "UNKNOWN" ? "Availability unknown" : null, !networkEligible ? "Not an active verified RepairX network workshop" : null].filter(Boolean) };
}
