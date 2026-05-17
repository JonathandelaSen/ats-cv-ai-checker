import { access, mkdir } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  e2eDir,
  logsDir,
  ports,
  prepareSupabaseWorkdir,
  startSupabase,
  supabaseProjectRoot,
  writeE2EEnv,
} from "./infra/supabase-stack.mjs";

const envJsonPath = path.join(e2eDir, "env.json");

function canReach(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode !== undefined && response.statusCode < 500);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(2_000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: options.stdio ?? "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function ensureSupabaseE2EStack() {
  await mkdir(logsDir, { recursive: true });

  const apiUrl = `http://127.0.0.1:${ports.api}`;
  const hasEnv = await fileExists(envJsonPath);
  if (hasEnv && (await canReach(apiUrl))) {
    return;
  }

  await prepareSupabaseWorkdir();
  const supabaseEnv = await startSupabase();
  await writeE2EEnv(supabaseEnv);

  console.log(`[backend-test] Supabase E2E stack ready at ${apiUrl}`);
  console.log(`[backend-test] Workdir: ${supabaseProjectRoot}`);
}

await ensureSupabaseE2EStack();
await run("npx", ["vitest", "run"]);
