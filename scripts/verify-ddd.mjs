import { spawn } from "node:child_process";

const checks = [
  ["node", ["scripts/verify-ddd-tests.mjs"]],
  ["node", ["scripts/verify-ddd-imports.mjs"]],
  ["node", ["scripts/verify-ddd-entities.mjs"]],
  ["node", ["scripts/verify-query-bus.mjs"]],
  ["node", ["scripts/verify-ddd-supabase-repository-tables.mjs"]],
  ["node", ["scripts/verify-ddd-route-imports.mjs"]],
  ["node", ["scripts/verify-ddd-barrel-exports.mjs"]],
  ["node", ["scripts/verify-frontend-boundaries.mjs"]],
];

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", (error) => {
      console.error(error);
      resolve(1);
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

let failed = false;
for (const [command, args] of checks) {
  const code = await run(command, args);
  if (code !== 0) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
