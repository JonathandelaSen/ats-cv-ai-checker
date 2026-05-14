import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const exportPattern =
  /(?:export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

const EXEMPT_MODULES = new Set(["shared"]);

async function main() {
  const modulesDir = path.join(repoRoot, "src/modules");
  const entries = await readdir(modulesDir, { withFileTypes: true });

  const violations = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || EXEMPT_MODULES.has(entry.name)) continue;

    const indexPath = path.join(modulesDir, entry.name, "index.ts");
    let source;
    try {
      source = await readFile(indexPath, "utf8");
    } catch {
      continue;
    }

    for (const match of source.matchAll(exportPattern)) {
      const specifier = match[1];
      if (specifier.includes("/infrastructure/")) {
        violations.push({
          module: entry.name,
          file: `src/modules/${entry.name}/index.ts`,
          reExport: specifier,
          reason: "infrastructure internals must not be re-exported",
        });
      }
      if (specifier.includes("/domain/repositories/")) {
        violations.push({
          module: entry.name,
          file: `src/modules/${entry.name}/index.ts`,
          reExport: specifier,
          reason: "repository port interfaces are module-internal",
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error(
      "Module barrel files (index.ts) contain forbidden re-exports:",
    );
    for (const v of violations) {
      console.error(`  - ${v.file} re-exports "${v.reExport}" (${v.reason})`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Barrel export check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
