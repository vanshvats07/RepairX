import test from "node:test";
import assert from "node:assert/strict";
import { evaluateWorkshopCandidate } from "../src/services/workshopMatchingDomainService.js";

const base = { verificationStatus: "VERIFIED", pilotStatus: "PILOT_ACTIVE", isNetworkWorkshop: true, availability: "OPEN", supportedBrands: ["Samsung"], supportedDevices: ["Galaxy S23"], capabilities: ["Charging"], serviceAreas: { cities: ["Lucknow"] } };

test("matching is transparent and city-aware", () => {
  const result = evaluateWorkshopCandidate({ workshop: base, device: { brand: "Samsung", model: "Galaxy S23" }, requiredCapabilities: ["Charging"], location: { city: "Lucknow" } });
  assert.equal(result.eligibility, "ELIGIBLE");
  assert.equal(result.capabilityMatch, "MATCHED");
  assert.equal(result.locationMatch, "MATCHED");
  assert.ok(result.reasons.includes("Service area matched"));
});

test("a different city is not silently eligible", () => {
  const result = evaluateWorkshopCandidate({ workshop: base, device: { brand: "Samsung", model: "Galaxy S23" }, requiredCapabilities: ["Charging"], location: { city: "Delhi" } });
  assert.equal(result.eligibility, "INELIGIBLE");
  assert.equal(result.locationMatch, "NOT_MATCHED");
});
