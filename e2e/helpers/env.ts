import { readFileSync } from "node:fs";
import path from "node:path";

export interface E2EEnv {
  baseUrl: string;
  parserUrl: string;
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  dbUrl?: string;
  mailpitUrl: string;
}

export function getE2EEnv(): E2EEnv {
  const envPath = path.resolve(process.cwd(), ".e2e/env.json");
  return JSON.parse(readFileSync(envPath, "utf8")) as E2EEnv;
}

export function uniqueLabel(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
