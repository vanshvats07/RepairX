import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("device catalog architecture keeps catalog, physical device, and repair case identities separate", () => {
  const catalog = read("src/models/DeviceCatalog.js");
  const userDevice = read("src/models/UserDevice.js");
  const repairRequest = read("src/models/RepairRequest.js");
  const selector = read("src/components/DeviceCatalogSelector.js");

  for (const field of ["modelSlug", "variants", "releaseYear", "supportedRegions", "identifiers"]) assert.match(catalog, new RegExp(field));
  assert.match(userDevice, /catalogDeviceId/);
  assert.match(userDevice, /deviceId/);
  assert.match(repairRequest, /userDeviceId/);
  assert.doesNotMatch(selector, /Samsung|Apple|OnePlus|Galaxy S23|iPhone 15/);
});

test("catalog customer endpoints and admin write route exist", () => {
  for (const path of [
    "src/app/api/device-catalog/brands/route.js",
    "src/app/api/device-catalog/models/route.js",
    "src/app/api/device-catalog/models/[id]/route.js",
    "src/app/api/device-catalog/search/route.js",
  ]) assert.ok(fs.existsSync(new URL(`../${path}`, import.meta.url)), path);
  assert.match(read("src/app/api/device-catalog/models/route.js"), /requireRole\(user, \["ADMIN"\]\)/);
});
