import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

test("production execution of the seed script is blocked", () => {
  const env = { ...process.env, APP_ENV: "production", NODE_ENV: "production" };
  const result = spawnSync("node", ["scripts/seed.js"], {
    cwd: root,
    env,
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0, "seed script should refuse production execution");
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /production.*seed|seed.*production|development.*only/i, "seed script should explicitly block production");
});
