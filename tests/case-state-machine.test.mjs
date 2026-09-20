import test from "node:test";
import assert from "node:assert/strict";
import { assertCaseTransition } from "../src/services/caseStateMachine.js";

test("case state machine allows only the stakeholder who owns the next action", () => {
  const record = { status: "AWAITING_TECHNICIAN" };
  assert.doesNotThrow(() => assertCaseTransition(record, "WORKSHOP_ACCEPTED", "WORKSHOP_OWNER"));
  assert.throws(() => assertCaseTransition(record, "WORKSHOP_ACCEPTED", "CUSTOMER"), /cannot transition/);
});

test("case state machine prevents skipping quote approval and quality states", () => {
  assert.throws(() => assertCaseTransition({ status: "DIAGNOSIS_VERIFIED" }, "APPROVED", "CUSTOMER"), /cannot transition/);
  assert.throws(() => assertCaseTransition({ status: "REPAIR_IN_PROGRESS" }, "COMPLETED", "TECHNICIAN"), /cannot transition/);
  assert.doesNotThrow(() => assertCaseTransition({ status: "QUALITY_CHECK" }, "COMPLETED", "TECHNICIAN"));
});
