import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
    if (entry.isFile() && entry.name.endsWith(".ts")) files.push(entryPath);
  }
  return files;
}

function toPosixRelative(rootDir, filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function parseModulePath(relativePath) {
  const parts = relativePath.split("/");
  if (parts[0] !== "src" || parts[1] !== "modules") return null;
  if (parts[2] === "test-helpers") return null;

  const moduleName = parts[2];
  const layer = ["domain", "application", "infrastructure"].includes(parts[3])
    ? parts[3]
    : "composition";

  return { moduleName, layer };
}

function shouldCheckSource(relativePath) {
  if (!relativePath.startsWith("src/modules/")) return false;
  if (relativePath.endsWith(".test.ts")) return false;
  if (relativePath.startsWith("src/modules/test-helpers/")) return false;
  return parseModulePath(relativePath) !== null;
}

function resolveImportPath(specifier, sourceRelativePath) {
  if (specifier.startsWith("@/")) return `src/${specifier.slice(2)}`;
  if (!specifier.startsWith(".")) return null;

  const sourceDir = path.posix.dirname(sourceRelativePath);
  return path.posix.normalize(path.posix.join(sourceDir, specifier));
}

function extractImportSpecifiers(source) {
  const imports = [];
  for (const match of source.matchAll(importPattern)) {
    imports.push(match[1]);
  }
  return imports;
}

function violationForImport(sourceInfo, targetInfo, targetRelativePath) {
  if (!targetInfo) return null;
  if (targetInfo.moduleName === "shared") return null;

  if (
    sourceInfo.moduleName !== targetInfo.moduleName &&
    targetRelativePath.startsWith("src/modules/")
  ) {
    return {
      rule: "cross-module-internal-import",
      reason:
        "Feature modules should depend on their own internals or shared ports, not another feature module's internals.",
    };
  }

  if (sourceInfo.layer === "domain" && targetInfo.layer === "application") {
    return {
      rule: "domain-imports-application",
      reason: "Domain code must not depend on application use cases.",
    };
  }

  if (sourceInfo.layer === "domain" && targetInfo.layer === "infrastructure") {
    return {
      rule: "domain-imports-infrastructure",
      reason: "Domain code must not depend on infrastructure implementations.",
    };
  }

  if (sourceInfo.layer === "application" && targetInfo.layer === "infrastructure") {
    return {
      rule: "application-imports-infrastructure",
      reason:
        "Application use cases should receive ports through dependency injection instead of importing infrastructure.",
    };
  }

  if (sourceInfo.layer === "infrastructure" && targetInfo.layer === "application") {
    return {
      rule: "infrastructure-imports-application",
      reason: "Infrastructure adapters must not depend on application use cases.",
    };
  }

  return null;
}

export async function findDddImportViolations({ rootDir = repoRoot } = {}) {
  const modulesDir = path.join(rootDir, "src/modules");
  const files = (await walkFiles(modulesDir))
    .map((filePath) => toPosixRelative(rootDir, filePath))
    .filter(shouldCheckSource)
    .sort();

  const violations = [];
  for (const file of files) {
    const sourceInfo = parseModulePath(file);
    const source = await readFile(path.join(rootDir, file), "utf8");

    for (const specifier of extractImportSpecifiers(source)) {
      const resolvedPath = resolveImportPath(specifier, file);
      if (!resolvedPath) continue;

      const targetInfo = parseModulePath(resolvedPath);
      const violation = violationForImport(sourceInfo, targetInfo, resolvedPath);
      if (!violation) continue;

      violations.push({
        file,
        import: specifier,
        resolvedPath,
        ...violation,
      });
    }
  }

  return violations;
}

export function formatDddImportViolations(violations) {
  if (violations.length === 0) return "";

  return [
    "DDD import violations:",
    ...violations.map(
      (violation) =>
        `- ${violation.file} imports "${violation.import}" (${violation.rule}): ${violation.reason}`
    ),
  ].join("\n");
}

async function main() {
  const violations = await findDddImportViolations();

  if (violations.length > 0) {
    console.error(formatDddImportViolations(violations));
    process.exitCode = 1;
    return;
  }

  console.log("DDD import check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
