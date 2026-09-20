import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);

test("private pilot config and onboarding language are present", () => {
  const envFile = fs.readFileSync(new URL("src/config/env.js", root), "utf8");
  const readme = fs.readFileSync(new URL("README.md", root), "utf8");

  assert.match(envFile, /PILOT_MODE|pilotMode/i);
  assert.match(readme, /private pilot|Delhi NCR/i);
});
