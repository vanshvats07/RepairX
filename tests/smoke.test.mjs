import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);

test("project exposes a production-oriented RepairX MVP workflow", () => {
  const pkg = JSON.parse(fs.readFileSync(new URL("package.json", root), "utf8"));
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.scripts.lint, "eslint");
  assert.equal(pkg.scripts.test, "node --test tests/**/*.test.mjs");

  const readme = fs.readFileSync(new URL("README.md", root), "utf8");
  assert.match(readme, /Delhi NCR/i);
  assert.match(readme, /Repair DNA/i);
  assert.match(readme, /RepairX/i);
});
