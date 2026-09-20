import test from "node:test";
import assert from "node:assert/strict";
import { buildProvenanceEvent, calculateIntelligenceQuality, classifyIssueRelation } from "../src/services/intelligenceDomainService.js";

test("classifies relevant and unrelated physical-device history", () => {
  assert.equal(classifyIssueRelation("intermittent charging", "charging port replaced"), "RELATED");
  assert.equal(classifyIssueRelation("speaker issue", "display replaced"), "UNRELATED");
  assert.equal(classifyIssueRelation("charging issue", "previous repair recorded"), "INSUFFICIENT_DATA");
});

test("intelligence quality reflects actual record depth", () => {
  assert.equal(calculateIntelligenceQuality({}), "LIMITED");
  assert.equal(calculateIntelligenceQuality({ repairs: 1, investigations: 1 }), "PARTIAL");
  assert.equal(calculateIntelligenceQuality({ repairs: 2, components: 2, verifiedDiagnoses: 1 }), "COMPLETE");
});

test("Repair DNA events retain provenance", () => {
  const event = buildProvenanceEvent({ eventType: "PART_INSTALLED", sourceType: "PartInstallation", sourceId: "part-1", timestamp: "2026-09-20T10:00:00Z", state: "VERIFIED" });
  assert.deepEqual(event, { eventType: "PART_INSTALLED", sourceType: "PartInstallation", sourceId: "part-1", timestamp: "2026-09-20T10:00:00Z", state: "VERIFIED" });
});
