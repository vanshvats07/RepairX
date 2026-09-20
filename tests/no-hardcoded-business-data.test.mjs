import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);

function read(relativePath) {
  return fs.readFileSync(new URL(relativePath, root), "utf8");
}

test("production runtime does not rely on hardcoded business defaults or seed imports", () => {
  const repairService = read("src/services/repairService.js");
  assert.doesNotMatch(repairService, /partCost\s*=\s*4500/i);
  assert.doesNotMatch(repairService, /labourCost\s*=\s*700/i);
  assert.doesNotMatch(repairService, /inspectionCost\s*=\s*199/i);
  assert.doesNotMatch(repairService, /pickupCost\s*=\s*99/i);

  const sourceTree = read("src/services/repairService.js") + read("src/services/workshopService.js") + read("src/app/api/repair-requests/route.js");
  assert.doesNotMatch(sourceTree, /from\s+["']\.\.?\/.*seed|from\s+["']@\/data\/seed|demoDevice|demoRepairs|demoWorkshops/);
});
