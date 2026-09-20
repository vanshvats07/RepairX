import test from "node:test";
import assert from "node:assert/strict";
import { caseNextActionService, createProductLearningRecord, CASE_LIFECYCLE_STATES } from "../src/services/caseLifecycleService.js";

test("caseNextActionService assigns the next operational owner for a new repair request", () => {
  const action = caseNextActionService({
    status: "REQUESTED",
    createdAt: new Date("2026-09-20T10:00:00Z"),
    customerId: "customer-1",
    workshopId: "workshop-1",
  });

  assert.equal(action.actionType, "REPAIR_REQUEST_CREATED");
  assert.equal(action.responsibleRole, "CUSTOMER");
  assert.equal(action.label, "Complete case intake and consent");
  assert.ok(action.description.includes("consent"));
  assert.equal(action.priority, "HIGH");
});

test("case lifecycle includes real pilot states and product learning records can be created from evidence", () => {
  const record = createProductLearningRecord({
    sourceCaseIds: ["RX-DEL-2026-0001", "RX-DEL-2026-0002"],
    category: "AI",
    observation: "AI assessment was often uncertain without clear technician evidence.",
    evidence: ["Two cases had insufficient component verification.", "Technician disagreement rate remained visible."],
    impact: "Pilot feedback was delayed while evidence was gathered.",
    status: "OBSERVED",
    createdBy: "admin-1",
  });

  assert.ok(CASE_LIFECYCLE_STATES.includes("ASSESSMENT_PENDING"));
  assert.equal(record.status, "OBSERVED");
  assert.equal(record.category, "AI");
  assert.equal(record.sourceCaseIds.length, 2);
});
