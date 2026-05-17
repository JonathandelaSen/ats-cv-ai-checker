import { createWriteStream } from "node:fs";
import {
  cp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

export const e2eDir = path.join(rootDir, ".e2e");
export const logsDir = path.join(e2eDir, "logs");
export const supabaseProjectRoot = path.join(e2eDir, "supabase-workdir");
const supabaseDir = path.join(supabaseProjectRoot, "supabase");
const envJsonPath = path.join(e2eDir, "env.json");
const projectId = "ats-cv-ai-checker-e2e";

export const ports = {
  app: 3100,
  parser: 8101,
  api: 56431,
  db: 56432,
  shadow: 56430,
  pooler: 56429,
  studio: 56433,
  mailpit: 56434,
  analytics: 56427,
  edgeInspector: 56483,
};

function logPath(name) {
  return path.join(logsDir, `${name}.log`);
}

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: options.stdio ?? "pipe",
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    if (options.logName) {
      const logStream = createWriteStream(logPath(options.logName), {
        flags: "a",
      });
      child.stdout?.pipe(logStream, { end: false });
      child.stderr?.pipe(logStream, { end: false });
      child.on("close", () => logStream.end());
    }

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
      if (options.pipeOutput) process.stdout.write(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
      if (options.pipeOutput) process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || options.allowFailure) {
        resolve({ stdout, stderr, code });
        return;
      }
      const error = new Error(
        `${command} ${args.join(" ")} failed with exit code ${code}`
      );
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

export function canReach(url) {
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

export async function waitForHttp(url, label, timeoutMs = 120_000, processToWatch) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (processToWatch && processToWatch.exitCode !== null) {
      throw new Error(`${label} process exited before ${url} was ready.`);
    }
    if (await canReach(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for ${label} at ${url}`);
}

function parseSupabaseEnv(output) {
  const env = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }

  return {
    supabaseUrl: env.API_URL ?? `http://127.0.0.1:${ports.api}`,
    anonKey: env.ANON_KEY,
    serviceRoleKey: env.SERVICE_ROLE_KEY,
    dbUrl: env.DB_URL,
    mailpitUrl: env.INBUCKET_URL ?? `http://127.0.0.1:${ports.mailpit}`,
  };
}

export async function prepareSupabaseWorkdir() {
  await rm(supabaseProjectRoot, { recursive: true, force: true });
  await mkdir(supabaseDir, { recursive: true });
  await cp(path.join(rootDir, "supabase", "migrations"), path.join(supabaseDir, "migrations"), {
    recursive: true,
  });
  await cp(path.join(rootDir, "supabase", "templates"), path.join(supabaseDir, "templates"), {
    recursive: true,
  });

  const sourceConfig = await readFile(
    path.join(rootDir, "supabase", "config.toml"),
    "utf8"
  );
  const config = sourceConfig
    .replace(/project_id = ".*?"/, `project_id = "${projectId}"`)
    .replace(/port = 55431/, `port = ${ports.api}`)
    .replace(/port = 55432/, `port = ${ports.db}`)
    .replace(/shadow_port = 55430/, `shadow_port = ${ports.shadow}`)
    .replace(/port = 55429/, `port = ${ports.pooler}`)
    .replace(/port = 55433/, `port = ${ports.studio}`)
    .replace(/port = 55434/, `port = ${ports.mailpit}`)
    .replace(/inspector_port = 55483/, `inspector_port = ${ports.edgeInspector}`)
    .replace(/port = 55427/, `port = ${ports.analytics}`)
    .replace(
      /additional_redirect_urls = \[.*?\]/s,
      `additional_redirect_urls = ["http://127.0.0.1:${ports.app}/auth/callback**", "http://localhost:${ports.app}/auth/callback**"]`
    )
    .replace(/enabled = true\n# Specifies an ordered list of seed files/s, "enabled = false\n# Specifies an ordered list of seed files");

  await writeFile(path.join(supabaseDir, "config.toml"), config);
}

export async function startSupabase() {
  await run("npx", [
    "supabase",
    "stop",
    "--workdir",
    supabaseProjectRoot,
    "--project-id",
    projectId,
    "--no-backup",
  ], { allowFailure: true, logName: "supabase-stop" });

  await run("npx", [
    "supabase",
    "start",
    "--workdir",
    supabaseProjectRoot,
  ], { pipeOutput: true, logName: "supabase-start" });

  const { stdout } = await run("npx", [
    "supabase",
    "status",
    "--workdir",
    supabaseProjectRoot,
    "-o",
    "env",
  ], { logName: "supabase-status" });
  const env = parseSupabaseEnv(stdout);
  if (!env.anonKey || !env.serviceRoleKey) {
    throw new Error("Could not read Supabase E2E anon/service-role keys.");
  }
  return env;
}

export async function writeE2EEnv(supabaseEnv) {
  await writeFile(
    envJsonPath,
    JSON.stringify(
      {
        baseUrl: `http://127.0.0.1:${ports.app}`,
        parserUrl: `http://127.0.0.1:${ports.parser}`,
        supabaseUrl: supabaseEnv.supabaseUrl,
        anonKey: supabaseEnv.anonKey,
        serviceRoleKey: supabaseEnv.serviceRoleKey,
        dbUrl: supabaseEnv.dbUrl,
        mailpitUrl: supabaseEnv.mailpitUrl,
      },
      null,
      2
    )
  );
}
