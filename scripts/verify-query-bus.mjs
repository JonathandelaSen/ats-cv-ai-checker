import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const queryNamePattern = /static\s+readonly\s+queryName\s*=\s*["']([^"']+)["']/g;
const classPattern = /export\s+class\s+([A-Za-z0-9_]+)/g;
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
const bannedDbCallPattern = /\.(?:from|insert|update|delete|select)\s*\(/;

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

function isQueryFile(relativePath) {
  return (
    relativePath.startsWith("src/modules/") &&
    relativePath.includes("/application/queries/") &&
    relativePath.endsWith(".query.ts") &&
    !relativePath.endsWith(".test.ts")
  );
}

function isQueryHandlerFile(relativePath) {
  return (
    relativePath.startsWith("src/modules/") &&
    relativePath.includes("/application/queries/") &&
    relativePath.endsWith(".query-handler.ts") &&
    !relativePath.endsWith(".test.ts")
  );
}

function expectedHandlerPath(queryPath) {
  return queryPath.replace(/\.query\.ts$/, ".query-handler.ts");
}

function expectedHandlerClass(queryClassName) {
  return `${queryClassName}Handler`;
}

function expectedUseCaseClass(queryClassName) {
  return `${queryClassName.replace(/Query$/, "")}UseCase`;
}

function addViolation(violations, file, rule, message) {
  violations.push({ file, rule, message });
}

function extractClassNames(source) {
  return [...source.matchAll(classPattern)].map((match) => match[1]);
}

function extractImportSpecifiers(source) {
  return [...source.matchAll(importPattern)].map((match) => match[1]);
}

function extractQueryNames(source) {
  return [...source.matchAll(queryNamePattern)].map((match) => match[1]);
}

function resolveImportPath(specifier, sourceRelativePath) {
  if (specifier.startsWith("@/")) return `src/${specifier.slice(2)}`;
  if (!specifier.startsWith(".")) return null;

  return path.posix.normalize(
    path.posix.join(path.posix.dirname(sourceRelativePath), specifier)
  );
}

function handlerDelegatesToUseCase(source, useCaseClassName) {
  return (
    source.includes(useCaseClassName) &&
    /constructor\s*\([^)]*useCase[^)]*\)/s.test(source) &&
    /this\.useCase\.execute\s*\(/.test(source)
  );
}

function handlerImportsInfrastructure(source, handlerPath) {
  return extractImportSpecifiers(source).some((specifier) => {
    const resolved = resolveImportPath(specifier, handlerPath) ?? specifier;
    return resolved.includes("/infrastructure/");
  });
}

export async function findQueryBusViolations({ rootDir = repoRoot } = {}) {
  const modulesDir = path.join(rootDir, "src/modules");
  const files = (await walkFiles(modulesDir))
    .map((filePath) => toPosixRelative(rootDir, filePath))
    .sort();
  const fileSet = new Set(files);
  const violations = [];
  const queryNames = new Map();

  for (const queryFile of files.filter(isQueryFile)) {
    const source = await readFile(path.join(rootDir, queryFile), "utf8");
    const queryClassName = extractClassNames(source).find((name) =>
      name.endsWith("Query")
    );

    if (!queryClassName) {
      addViolation(
        violations,
        queryFile,
        "query-class-missing",
        "Query files must export a class ending in Query."
      );
    }

    const handlerPath = expectedHandlerPath(queryFile);
    if (!fileSet.has(handlerPath)) {
      addViolation(
        violations,
        queryFile,
        "query-handler-missing",
        `${queryFile} must have matching ${handlerPath}.`
      );
    }

    for (const queryName of extractQueryNames(source)) {
      const existing = queryNames.get(queryName);
      if (existing) {
        addViolation(
          violations,
          queryFile,
          "duplicate-query-name",
          `Query name "${queryName}" is already used by ${existing}.`
        );
      } else {
        queryNames.set(queryName, queryFile);
      }
    }
  }

  for (const handlerFile of files.filter(isQueryHandlerFile)) {
    const source = await readFile(path.join(rootDir, handlerFile), "utf8");
    const queryPath = handlerFile.replace(/\.query-handler\.ts$/, ".query.ts");
    const querySource = fileSet.has(queryPath)
      ? await readFile(path.join(rootDir, queryPath), "utf8")
      : "";
    const queryClassName = extractClassNames(querySource).find((name) =>
      name.endsWith("Query")
    );
    const expectedClassName = queryClassName
      ? expectedHandlerClass(queryClassName)
      : null;
    const handlerClassNames = extractClassNames(source);

    if (!expectedClassName || !handlerClassNames.includes(expectedClassName)) {
      addViolation(
        violations,
        handlerFile,
        "query-handler-wrong-class-name",
        expectedClassName
          ? `${handlerFile} must export ${expectedClassName}.`
          : `${handlerFile} must have a matching query class.`
      );
    }

    if (handlerImportsInfrastructure(source, handlerFile)) {
      addViolation(
        violations,
        handlerFile,
        "query-handler-imports-infrastructure",
        "Query handlers must not import infrastructure directly."
      );
    }

    if (bannedDbCallPattern.test(source)) {
      addViolation(
        violations,
        handlerFile,
        "query-handler-banned-db-call",
        "Query handlers must delegate to use cases instead of calling persistence APIs."
      );
    }

    if (queryClassName) {
      const useCaseClassName = expectedUseCaseClass(queryClassName);
      if (!handlerDelegatesToUseCase(source, useCaseClassName)) {
        addViolation(
          violations,
          handlerFile,
          "query-handler-no-use-case",
          `${expectedHandlerClass(queryClassName)} must delegate to ${useCaseClassName}.`
        );
      }
    } else if (!/this\.useCase\.execute\s*\(/.test(source)) {
      addViolation(
        violations,
        handlerFile,
        "query-handler-no-use-case",
        "Query handlers must delegate to a matching use case."
      );
    }
  }

  return violations;
}

export function formatQueryBusViolations(violations) {
  if (violations.length === 0) return "";

  return [
    "Query bus violations:",
    ...violations.map(
      (violation) =>
        `- ${violation.file} (${violation.rule}): ${violation.message}`
    ),
  ].join("\n");
}

async function main() {
  const violations = await findQueryBusViolations();

  if (violations.length > 0) {
    console.error(formatQueryBusViolations(violations));
    process.exitCode = 1;
    return;
  }

  console.log("Query bus check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
