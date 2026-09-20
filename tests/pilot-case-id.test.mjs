import test from "node:test";
import assert from "node:assert/strict";
import { generateCaseId } from "../src/services/pilotCaseService.js";

test("generateCaseId produces a valid private pilot case identifier", async () => {
  const caseId = await generateCaseId();

  assert.match(caseId, /^PX-[A-Z0-9-]+$/);
  assert.ok(caseId.length >= 12);
});
