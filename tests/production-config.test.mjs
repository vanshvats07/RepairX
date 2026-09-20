import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);

test("production config uses variable names only and includes readiness endpoint", () => {
  const envExample = fs.readFileSync(new URL(".env.example", root), "utf8");
  const readyRoute = fs.existsSync(new URL("src/app/api/ready/route.js", root));

  assert.match(envExample, /MONGODB_URI=/i);
  assert.doesNotMatch(envExample, /MONGODB_URI=mongodb/i);
  assert.equal(readyRoute, true);
});
