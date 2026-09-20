import "server-only";
import Workshop from "@/models/Workshop";
import WorkshopCapability from "@/models/WorkshopCapability";
import WorkshopMatch from "@/models/WorkshopMatch";

function normalized(value) { return String(value || "").trim().toLowerCase(); }
function textMatches(value, terms) { return terms.some((term) => normalized(value).includes(normalized(term))); }

function evaluateWorkshop({ workshop, capabilities, device, complaint, requiredCapabilities = [], location = {} }) {
  const requiredText = [complaint, ...requiredCapabilities].join(" ");
  const brandMatch = workshop.supportedBrands?.some((brand) => normalized(brand) === normalized(device.brand));
  const deviceMatch = workshop.supportedDevices?.some((model) => normalized(device.model).includes(normalized(model)) || normalized(model).includes(normalized(device.model)));
  const capabilityNames = [...(workshop.capabilities || []), ...capabilities.map((item) => item.name)];
  const capabilityMatch = capabilityNames.length ? capabilityNames.some((capability) => textMatches(capability, requiredCapabilities.length ? requiredCapabilities : [requiredText])) : false;
  const categoryMatch = capabilityNames.length ? capabilityNames.some((capability) => /battery|charg|thermal|diagnostic|board|display|audio|camera|repair/i.test(`${capability} ${requiredText}`)) : false;
  const configuredAreas = workshop.serviceAreas || {};
  const areaValues = [...(configuredAreas.localities || []), ...(configuredAreas.pincodes || []), ...(configuredAreas.cities || [])].map(normalized);
  const requestedLocation = [location.locality, location.pincode, location.city].filter(Boolean).map(normalized);
  const locationMatch = areaValues.length ? requestedLocation.some((value) => areaValues.includes(value)) : null;
  const availabilityState = workshop.availability === "OPEN" ? "AVAILABLE" : workshop.availability === "CLOSED" || workshop.availability === "PAUSED" || workshop.availability === "TEMPORARILY_UNAVAILABLE" ? "UNAVAILABLE" : "UNKNOWN";
  const verified = workshop.verificationStatus === "VERIFIED" && ["ACTIVE", "PILOT_ACTIVE"].includes(workshop.pilotStatus) && workshop.isNetworkWorkshop === true;
  const reasons = [];
  const limitations = [];
  if (brandMatch || deviceMatch) reasons.push("Supports this device brand or model"); else limitations.push("Device compatibility is not confirmed");
  if (capabilityMatch || categoryMatch) reasons.push("Relevant repair capability is recorded"); else limitations.push("Required repair capability is not confirmed");
  if (locationMatch === true) reasons.push("Configured service area matches the case"); else if (locationMatch === false) limitations.push("Case location is outside configured service areas"); else limitations.push("Service area is not configured");
  if (availabilityState === "AVAILABLE") reasons.push("Workshop is marked open"); else if (availabilityState === "UNKNOWN") limitations.push("Current availability is unknown");
  if (!verified) limitations.push("Workshop is not an active verified RepairX network partner");
  const eligible = verified && (capabilityMatch || categoryMatch) && locationMatch !== false && availabilityState !== "UNAVAILABLE";
  return { workshopId: workshop._id, workshop, eligibility: eligible ? "ELIGIBLE" : locationMatch === false ? "INELIGIBLE" : verified && (capabilityMatch || categoryMatch) ? "UNCERTAIN" : "INELIGIBLE", matchReasons: reasons, limitations, capabilityMatch: capabilityMatch || categoryMatch ? "MATCHED" : "NOT_MATCHED", locationMatch: locationMatch === true ? "MATCHED" : locationMatch === false ? "NOT_MATCHED" : "UNKNOWN", serviceMatch: locationMatch === false ? "NOT_MATCHED" : locationMatch === true ? "MATCHED" : "UNKNOWN", availabilityState, verificationState: workshop.verificationStatus, pilotStatus: workshop.pilotStatus };
}

export async function matchWorkshopCandidates({ device, complaint = "", requiredCapabilities = [], location = {} }) {
  const workshops = await Workshop.find({ verificationStatus: { $in: ["VERIFIED"] }, pilotStatus: { $in: ["ACTIVE", "PILOT_ACTIVE"] }, isNetworkWorkshop: true }).lean();
  const capabilities = workshops.length ? await WorkshopCapability.find({ workshopId: { $in: workshops.map((workshop) => workshop._id) } }).lean() : [];
  return workshops.map((workshop) => evaluateWorkshop({ workshop, capabilities: capabilities.filter((item) => String(item.workshopId) === String(workshop._id)), device, complaint, requiredCapabilities, location })).sort((left, right) => Number(right.eligibility === "ELIGIBLE") - Number(left.eligibility === "ELIGIBLE"));
}

export async function persistWorkshopMatches(repairRequestId, candidates, selectionMode = "RULE_BASED_ASSIGNMENT") {
  if (!repairRequestId || !candidates.length) return [];
  return Promise.all(candidates.map((candidate) => WorkshopMatch.findOneAndUpdate({ repairRequestId, candidateWorkshopId: candidate.workshopId }, { ...candidate, repairRequestId, candidateWorkshopId: candidate.workshopId, selectionMode }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean()));
}

export async function findEligibleWorkshop(input) {
  const candidates = await matchWorkshopCandidates(input);
  return candidates.find((candidate) => candidate.eligibility === "ELIGIBLE")?.workshop || null;
}
