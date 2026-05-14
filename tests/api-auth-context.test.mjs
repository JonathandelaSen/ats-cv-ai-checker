import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoRoot = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, repoRoot), "utf8");
}

function listApiFiles(dir = new URL("src/app/api/", repoRoot)) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir.pathname, entry.name);
    if (entry.isDirectory()) return listApiFiles(new URL(`${entry.name}/`, dir));
    return statSync(fullPath).isFile() ? [fullPath] : [];
  });
}

test("API auth request context is centralized and returns the standard 401 response", () => {
  const helperPath = "src/app/api/_shared/auth/request-context.ts";
  assert.ok(existsSync(new URL(helperPath, repoRoot)), "shared auth helper should exist");

  const source = read(helperPath);
  assert.match(source, /export async function getAuthenticatedRequestContext/);
  assert.match(source, /createClient\(\)/);
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\)/);
  assert.match(source, /ok: true/);
  assert.match(source, /ok: false/);
});

test("API validation helpers do not own or re-export auth context", () => {
  const validationFiles = listApiFiles().filter((file) => file.endsWith("/validation.ts"));

  assert.ok(validationFiles.length > 0, "expected API validation helpers");

  for (const file of validationFiles) {
    const source = read(file.slice(repoRoot.pathname.length));
    assert.doesNotMatch(source, /from "@\/lib\/supabase\/server"/, file);
    assert.doesNotMatch(source, /function getAuthedSupabase/, file);
    assert.doesNotMatch(source, /getAuthenticatedRequestContext/, file);
    assert.doesNotMatch(source, /@\/app\/api\/_shared\/auth\/request-context/, file);
  }
});

test("API route handlers use the shared authenticated request context", () => {
  const routeFiles = listApiFiles().filter(
    (file) => file.endsWith("/route.ts") && !file.includes("/_shared/")
  );

  assert.ok(routeFiles.length > 0, "expected API route handlers");

  for (const file of routeFiles) {
    const source = read(file.slice(repoRoot.pathname.length));
    if (source.includes("getAuthenticatedRequestContext")) {
      assert.match(source, /@\/app\/api\/_shared\/auth\/request-context/, file);
    }
    assert.doesNotMatch(source, /supabase\.auth\.getUser\(\)/, file);
    assert.doesNotMatch(
      source,
      /NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\)/,
      file
    );
  }
});
