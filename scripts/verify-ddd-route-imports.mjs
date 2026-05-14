import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

async function walkFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      files.push(...(await walkFiles(entryPath)));
      continue;
    }
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(entryPath);
  }
  return files;
}

function toPosixRelative(rootDir, filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function isModuleInternalImport(specifier) {
  if (!specifier.startsWith("@/modules/")) return false;
  const rest = specifier.slice("@/modules/".length);
  const parts = rest.split("/");
  if (parts[0] === "shared") return false;
  // @/modules/<name> or @/modules/<name>/index → barrel (OK)
  // @/modules/<name>/client → client barrel (OK)
  // @/modules/<name>/anything/else → internal (violation)
  if (parts.length <= 1) return false;
  if (parts.length === 2 && (parts[1] === "index" || parts[1] === "client")) return false;
  return true;
}

async function findRouteImportViolations() {
  const appDir = path.join(repoRoot, "src/app");
  const componentDir = path.join(repoRoot, "src/components");
  const libDir = path.join(repoRoot, "src/lib");

  const files = [
    ...(await walkFiles(appDir)),
    ...(await walkFiles(componentDir)),
    ...(await walkFiles(libDir)),
  ]
    .map((f) => toPosixRelative(repoRoot, f))
    .filter((f) => !f.endsWith(".test.ts"))
    .sort();

  const reExportShims = new Set([
    "src/lib/cv-profile.ts",
    "src/lib/cv-templates.ts",
  ]);

  const violations = [];
  for (const file of files) {
    if (reExportShims.has(file)) continue;
    const source = await readFile(path.join(repoRoot, file), "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (isModuleInternalImport(specifier)) {
        violations.push({ file, import: specifier });
      }
    }
  }

  return violations;
}

async function main() {
  const violations = await findRouteImportViolations();

  if (violations.length > 0) {
    console.error("Route/component/lib files must import modules via barrel (index.ts) only:");
    for (const v of violations) {
      console.error(`- ${v.file} imports "${v.import}"`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Route module import check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
