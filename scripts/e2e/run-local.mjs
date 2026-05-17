import { createWriteStream } from "node:fs";
import {
  cp,
  mkdir,
  rm,
  symlink,
} from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  e2eDir,
  logsDir,
  ports,
  prepareSupabaseWorkdir,
  run,
  startSupabase,
  supabaseProjectRoot,
  waitForHttp,
  writeE2EEnv,
} from "../infra/supabase-stack.mjs";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const appWorkdir = path.join(e2eDir, "app-workdir");
const parserContainerName = "ats-cv-ai-checker-pdf-parser-e2e";
const parserImageName = "ats-cv-ai-checker-pdf-parser:e2e";
const parserSecret = "e2e-parser-secret";

const args = new Set(process.argv.slice(2));
const isUi = args.has("--ui");
const keepStack = args.has("--keep-stack");

const children = new Set();

function logPath(name) {
  return path.join(logsDir, `${name}.log`);
}

function spawnManaged(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? rootDir,
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: "pipe",
    shell: false,
  });
  children.add(child);

  if (options.logName) {
    const logStream = createWriteStream(logPath(options.logName), {
      flags: "a",
    });
    child.stdout.pipe(logStream, { end: false });
    child.stderr.pipe(logStream, { end: false });
    child.on("close", () => logStream.end());
  }

  child.on("close", () => children.delete(child));
  child.on("error", (error) => {
    console.error(`[e2e] ${command} failed to start:`, error);
  });
  return child;
}

async function symlinkFromRoot(relativePath, type) {
  await symlink(
    path.join(rootDir, relativePath),
    path.join(appWorkdir, relativePath),
    type
  );
}

async function prepareAppWorkdir() {
  await rm(appWorkdir, { recursive: true, force: true });
  await mkdir(appWorkdir, { recursive: true });

  await cp(path.join(rootDir, "src"), path.join(appWorkdir, "src"), {
    recursive: true,
  });
  await cp(path.join(rootDir, "public"), path.join(appWorkdir, "public"), {
    recursive: true,
  });
  await symlinkFromRoot("node_modules", "dir");

  for (const file of [
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    "components.json",
  ]) {
    await cp(path.join(rootDir, file), path.join(appWorkdir, file));
  }
}

async function startParser(supabaseEnv) {
  await run("docker", ["rm", "-f", parserContainerName], {
    allowFailure: true,
    logName: "parser-rm",
  });
  await run("docker", [
    "build",
    "-t",
    parserImageName,
    path.join(rootDir, "services", "pdf-parser"),
  ], { pipeOutput: true, logName: "parser-build" });
  await run("docker", [
    "run",
    "-d",
    "--name",
    parserContainerName,
    "--add-host=host.docker.internal:host-gateway",
    "-p",
    `${ports.parser}:8001`,
    "-e",
    `PYTHON_PARSER_SECRET=${parserSecret}`,
    "-e",
    `SUPABASE_URL=http://host.docker.internal:${ports.api}`,
    "-e",
    `SUPABASE_SERVICE_ROLE_KEY=${supabaseEnv.serviceRoleKey}`,
    parserImageName,
  ], { pipeOutput: true, logName: "parser-run" });
  await waitForHttp(`http://127.0.0.1:${ports.parser}/docs`, "PDF parser");
}

async function startNext(supabaseEnv) {
  const appEnv = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseEnv.supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseEnv.anonKey,
    SUPABASE_SERVICE_ROLE_KEY: supabaseEnv.serviceRoleKey,
    PYTHON_PARSER_URL: `http://127.0.0.1:${ports.parser}`,
    PYTHON_PARSER_SECRET: parserSecret,
    PYTHON_PARSER_TIMEOUT_MS: "15000",
    GEMINI_API_KEY: "",
  };
  const child = spawnManaged("npm", [
    "run",
    "dev",
    "--",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(ports.app),
  ], { cwd: appWorkdir, env: appEnv, logName: "next-dev" });
  await waitForHttp(
    `http://127.0.0.1:${ports.app}/login`,
    "Next.js app",
    120_000,
    child
  );
}

async function stopManagedProcesses() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  for (const child of children) {
    if (!child.killed) child.kill("SIGKILL");
  }
}

async function cleanup() {
  await stopManagedProcesses();
  await run("docker", ["rm", "-f", parserContainerName], {
    allowFailure: true,
    logName: "parser-cleanup",
  });
  if (!keepStack) {
    await run("npx", [
      "supabase",
      "stop",
      "--workdir",
      supabaseProjectRoot,
      "--project-id",
      "ats-cv-ai-checker-e2e",
      "--no-backup",
    ], { allowFailure: true, logName: "supabase-cleanup" });
  }
}

async function main() {
  await mkdir(logsDir, { recursive: true });
  await prepareSupabaseWorkdir();
  await prepareAppWorkdir();
  const supabaseEnv = await startSupabase();
  await startParser(supabaseEnv);
  await startNext(supabaseEnv);
  await writeE2EEnv(supabaseEnv);

  await run("npx", ["playwright", "install", "chromium"], {
    pipeOutput: true,
    logName: "playwright-install",
  });

  const playwrightArgs = ["playwright", "test"];
  if (isUi) playwrightArgs.push("--ui");
  await run("npx", playwrightArgs, {
    pipeOutput: true,
    env: {
      E2E_BASE_URL: `http://127.0.0.1:${ports.app}`,
    },
    logName: "playwright",
  });
}

const isDirectRun = path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);

if (isDirectRun) {
  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(143);
  });

  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await cleanup();
    });
}
