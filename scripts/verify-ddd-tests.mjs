import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

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
    if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

function toPosixRelative(rootDir, filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function expectedTestPath(sourcePath) {
  return sourcePath.replace(/\.ts$/, ".test.ts");
}

function isUseCaseSource(relativePath) {
  return (
    relativePath.startsWith("src/modules/") &&
    relativePath.includes("/application/use-cases/") &&
    relativePath.endsWith(".use-case.ts") &&
    !relativePath.endsWith(".test.ts")
  );
}

function isRepositoryImplementationSource(relativePath) {
  return (
    relativePath.startsWith("src/modules/") &&
    relativePath.includes("/infrastructure/repositories/") &&
    relativePath.endsWith(".repository.ts") &&
    !relativePath.endsWith(".test.ts")
  );
}

async function missingTestsFor(files, rootDir) {
  const missing = [];

  for (const sourceFile of files) {
    const expectedTest = expectedTestPath(sourceFile);
    if (await fileExists(path.join(rootDir, expectedTest))) continue;
    missing.push({ source: sourceFile, expectedTest });
  }

  return missing;
}

export async function findMissingDddTests({ rootDir = repoRoot } = {}) {
  const modulesDir = path.join(rootDir, "src/modules");
  const files = (await walkFiles(modulesDir)).map((filePath) =>
    toPosixRelative(rootDir, filePath)
  );

  const useCases = files.filter(isUseCaseSource).sort();
  const repositories = files.filter(isRepositoryImplementationSource).sort();

  return {
    missingUseCaseTests: await missingTestsFor(useCases, rootDir),
    missingRepositoryTests: await missingTestsFor(repositories, rootDir),
  };
}

export function formatMissingDddTests(result) {
  const sections = [];

  if (result.missingUseCaseTests.length > 0) {
    sections.push(
      [
        "Use cases without colocated tests:",
        ...result.missingUseCaseTests.map(
          (item) => `- ${item.source} -> expected ${item.expectedTest}`
        ),
      ].join("\n")
    );
  }

  if (result.missingRepositoryTests.length > 0) {
    sections.push(
      [
        "Repository implementations without colocated tests:",
        ...result.missingRepositoryTests.map(
          (item) => `- ${item.source} -> expected ${item.expectedTest}`
        ),
      ].join("\n")
    );
  }

  return sections.join("\n\n");
}

async function main() {
  const result = await findMissingDddTests();
  const missingCount =
    result.missingUseCaseTests.length + result.missingRepositoryTests.length;

  if (missingCount > 0) {
    console.error(formatMissingDddTests(result));
    process.exitCode = 1;
    return;
  }

  console.log("DDD test coverage check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
