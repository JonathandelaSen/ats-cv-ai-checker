import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Add module names here only after the whole module domain has been migrated.
// Example: ["work-journal"]
export const migratedModules = ["work-journal"];

const primitiveTypeKinds = new Set([
  ts.SyntaxKind.AnyKeyword,
  ts.SyntaxKind.BigIntKeyword,
  ts.SyntaxKind.BooleanKeyword,
  ts.SyntaxKind.NumberKeyword,
  ts.SyntaxKind.ObjectKeyword,
  ts.SyntaxKind.StringKeyword,
  ts.SyntaxKind.SymbolKeyword,
  ts.SyntaxKind.UnknownKeyword,
]);

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

function parseSource(source, fileName) {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
}

function isExported(node) {
  return node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

function hasHeritage(node, baseName) {
  return (
    node.heritageClauses?.some((clause) =>
      clause.types.some((type) => type.expression.getText() === baseName)
    ) ?? false
  );
}

function hasMethod(node, name, { isStatic = false } = {}) {
  return node.members.some(
    (member) =>
      ts.isMethodDeclaration(member) &&
      member.name?.getText() === name &&
      hasModifier(member, ts.SyntaxKind.StaticKeyword) === isStatic
  );
}

function getConstructor(node) {
  return node.members.find((member) => ts.isConstructorDeclaration(member));
}

function findInterface(sourceFile, name) {
  return sourceFile.statements.find(
    (statement) => ts.isInterfaceDeclaration(statement) && statement.name.text === name
  );
}

function interfaceHasProperty(sourceFile, interfaceName, propertyName) {
  const declaration = findInterface(sourceFile, interfaceName);
  if (!declaration) return false;
  return declaration.members.some(
    (member) => ts.isPropertySignature(member) && member.name.getText() === propertyName
  );
}

function isSnakeCaseIdentifier(text) {
  return /^[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]*$/.test(text);
}

function location(sourceFile, node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${line + 1}:${character + 1}`;
}

function addViolation(violations, file, rule, reason, sourceFile, node) {
  violations.push({
    file,
    rule,
    reason,
    location: sourceFile && node ? location(sourceFile, node) : null,
  });
}

function checkNoSnakeCaseIdentifiers(sourceFile, file, violations) {
  function visit(node) {
    if (ts.isIdentifier(node) && isSnakeCaseIdentifier(node.text)) {
      addViolation(
        violations,
        file,
        "domain-snake-case",
        `Domain identifiers must use camelCase, found "${node.text}". Map snake_case in infrastructure repositories instead.`,
        sourceFile,
        node
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

function containsBannedRepositoryType(typeNode) {
  if (!typeNode) return null;

  if (primitiveTypeKinds.has(typeNode.kind)) {
    return typeNode.getText();
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const name = typeNode.typeName.getText();
    if (
      name === "Date" ||
      name.endsWith("Primitives") ||
      /^Create[A-Z].*Input$/.test(name) ||
      /^Update[A-Z].*Input$/.test(name)
    ) {
      return name;
    }

    for (const arg of typeNode.typeArguments ?? []) {
      const banned = containsBannedRepositoryType(arg);
      if (banned) return banned;
    }
  }

  if (ts.isArrayTypeNode(typeNode)) {
    return containsBannedRepositoryType(typeNode.elementType);
  }

  if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
    for (const childType of typeNode.types) {
      if (
        childType.kind === ts.SyntaxKind.NullKeyword ||
        childType.kind === ts.SyntaxKind.UndefinedKeyword
      ) {
        continue;
      }
      const banned = containsBannedRepositoryType(childType);
      if (banned) return banned;
    }
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    if (typeNode.literal.kind === ts.SyntaxKind.NullKeyword) return null;
    return typeNode.getText();
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    return "inline object type";
  }

  return null;
}

function checkEntityFile(sourceFile, file, violations) {
  const aggregateClasses = sourceFile.statements.filter(
    (statement) =>
      ts.isClassDeclaration(statement) &&
      statement.name &&
      isExported(statement) &&
      hasHeritage(statement, "AggregateRoot")
  );

  if (aggregateClasses.length === 0) {
    addViolation(
      violations,
      file,
      "entity-must-extend-aggregate-root",
      "Every migrated domain entity file must export a class extending AggregateRoot.",
      sourceFile,
      sourceFile
    );
    return [];
  }

  for (const aggregate of aggregateClasses) {
    const className = aggregate.name.text;
    const primitivesName = `${className}Primitives`;
    const createParamsName = `${className}CreateParams`;
    const constructor = getConstructor(aggregate);

    if (!findInterface(sourceFile, primitivesName)) {
      addViolation(
        violations,
        file,
        "entity-primitives-missing",
        `Aggregate ${className} must export interface ${primitivesName}.`,
        sourceFile,
        aggregate.name
      );
    }

    if (!findInterface(sourceFile, createParamsName)) {
      addViolation(
        violations,
        file,
        "entity-create-params-missing",
        `Aggregate ${className} must export interface ${createParamsName}.`,
        sourceFile,
        aggregate.name
      );
    } else if (!interfaceHasProperty(sourceFile, createParamsName, "id")) {
      addViolation(
        violations,
        file,
        "entity-id-missing",
        `Aggregate ${className} create params must include an id value object.`,
        sourceFile,
        aggregate.name
      );
    }

    if (!hasMethod(aggregate, "create", { isStatic: true })) {
      addViolation(
        violations,
        file,
        "entity-create-missing",
        `Aggregate ${className} must define static create(params).`,
        sourceFile,
        aggregate.name
      );
    }

    if (!hasMethod(aggregate, "fromPrimitives", { isStatic: true })) {
      addViolation(
        violations,
        file,
        "entity-from-primitives-missing",
        `Aggregate ${className} must define static fromPrimitives(primitives: ${primitivesName}).`,
        sourceFile,
        aggregate.name
      );
    }

    if (!hasMethod(aggregate, "toPrimitives")) {
      addViolation(
        violations,
        file,
        "entity-to-primitives-missing",
        `Aggregate ${className} must define toPrimitives(): ${primitivesName}.`,
        sourceFile,
        aggregate.name
      );
    }

    if (!constructor) {
      addViolation(
        violations,
        file,
        "entity-constructor-missing",
        `Aggregate ${className} must use a private or protected constructor.`,
        sourceFile,
        aggregate.name
      );
    } else if (
      !hasModifier(constructor, ts.SyntaxKind.PrivateKeyword) &&
      !hasModifier(constructor, ts.SyntaxKind.ProtectedKeyword)
    ) {
      addViolation(
        violations,
        file,
        "entity-constructor-public",
        `Aggregate ${className} constructor must be private or protected.`,
        sourceFile,
        constructor
      );
    }
  }

  return aggregateClasses.map((node) => node.name.text);
}

function checkValueObjectFile(sourceFile, file, violations) {
  const valueObjects = sourceFile.statements.filter(
    (statement) =>
      ts.isClassDeclaration(statement) &&
      statement.name &&
      isExported(statement) &&
      hasHeritage(statement, "ValueObject")
  );

  if (valueObjects.length === 0) {
    addViolation(
      violations,
      file,
      "value-object-must-extend-value-object",
      "Every migrated value-object file must export a class extending ValueObject.",
      sourceFile,
      sourceFile
    );
    return;
  }

  for (const valueObject of valueObjects) {
    const className = valueObject.name.text;

    if (!hasMethod(valueObject, "fromPrimitives", { isStatic: true })) {
      addViolation(
        violations,
        file,
        "value-object-from-primitives-missing",
        `Value object ${className} must define static fromPrimitives(...).`,
        sourceFile,
        valueObject.name
      );
    }

    if (!hasMethod(valueObject, "toPrimitives")) {
      addViolation(
        violations,
        file,
        "value-object-to-primitives-missing",
        `Value object ${className} must define toPrimitives().`,
        sourceFile,
        valueObject.name
      );
    }

    for (const member of valueObject.members) {
      if (ts.isMethodDeclaration(member)) {
        const methodName = member.name?.getText() ?? "";
        if (/^(set|update|change|mark|delete|save)/.test(methodName)) {
          addViolation(
            violations,
            file,
            "value-object-mutator-method",
            `Value object ${className} must be immutable; mutator-like method "${methodName}" is not allowed.`,
            sourceFile,
            member.name
          );
        }
      }

      if (ts.isPropertyDeclaration(member)) {
        const isPrivate = hasModifier(member, ts.SyntaxKind.PrivateKeyword);
        const isProtected = hasModifier(member, ts.SyntaxKind.ProtectedKeyword);
        const isReadonly = hasModifier(member, ts.SyntaxKind.ReadonlyKeyword);
        if (!isPrivate && !isProtected && !isReadonly) {
          addViolation(
            violations,
            file,
            "value-object-public-mutable-property",
            `Value object ${className} cannot expose public mutable properties.`,
            sourceFile,
            member.name
          );
        }
      }
    }
  }
}

function checkRepositoryFile(sourceFile, file, violations, aggregateClassNames) {
  const aggregateRepositoryNames = new Set(
    aggregateClassNames.map((className) => `${className}Repository`)
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isInterfaceDeclaration(statement)) continue;

    const interfaceName = statement.name.text;
    const isRepository = aggregateRepositoryNames.has(interfaceName);

    if (!isRepository) {
      continue;
    }

    const methodNames = new Set();

    for (const member of statement.members) {
      if (!ts.isMethodSignature(member)) continue;

      const methodName = member.name.getText();
      methodNames.add(methodName);

      if (methodName === "create" || methodName === "update") {
        addViolation(
          violations,
          file,
          "repository-create-update-method",
          `Repository ${interfaceName} must use save(entity) instead of ${methodName}(...).`,
          sourceFile,
          member.name
        );
      }

      for (const parameter of member.parameters) {
        const banned = containsBannedRepositoryType(parameter.type);
        if (banned) {
          addViolation(
            violations,
            file,
            "repository-primitive-parameter",
            `Repository ${interfaceName}.${methodName} parameter "${parameter.name.getText()}" uses primitive or persistence type "${banned}".`,
            sourceFile,
            parameter
          );
        }
      }

      const bannedReturn = containsBannedRepositoryType(member.type);
      if (bannedReturn) {
        addViolation(
          violations,
          file,
          "repository-primitive-return",
          `Repository ${interfaceName}.${methodName} return type uses primitive or persistence type "${bannedReturn}".`,
          sourceFile,
          member
        );
      }
    }

    if (!methodNames.has("save")) {
      addViolation(
        violations,
        file,
        "repository-save-missing",
        `Repository ${interfaceName} must expose save(entity).`,
        sourceFile,
        statement.name
      );
    }

    if (!methodNames.has("delete")) {
      addViolation(
        violations,
        file,
        "repository-delete-missing",
        `Repository ${interfaceName} must expose delete(id).`,
        sourceFile,
        statement.name
      );
    }
  }
}

async function readSourceFile(rootDir, relativePath) {
  const source = await readFile(path.join(rootDir, relativePath), "utf8");
  return parseSource(source, relativePath);
}

async function checkMigratedModule(moduleName, rootDir, violations) {
  const moduleDir = path.join(rootDir, "src/modules", moduleName);
  const files = (await walkFiles(moduleDir))
    .map((filePath) => toPosixRelative(rootDir, filePath))
    .filter((file) => file.includes("/domain/"))
    .sort();

  const aggregateClassNames = [];
  const repositoryFiles = files.filter((file) => file.includes("/domain/repositories/"));

  for (const file of files) {
    const sourceFile = await readSourceFile(rootDir, file);

    if (file.includes("/domain/entities/") && file.endsWith(".entity.ts")) {
      checkNoSnakeCaseIdentifiers(sourceFile, file, violations);
      aggregateClassNames.push(...checkEntityFile(sourceFile, file, violations));
    }

    if (file.includes("/domain/value-objects/") && file.endsWith(".value-object.ts")) {
      checkNoSnakeCaseIdentifiers(sourceFile, file, violations);
      checkValueObjectFile(sourceFile, file, violations);
    }

    if (
      !file.includes("/domain/entities/") &&
      !file.includes("/domain/value-objects/") &&
      !file.includes("/domain/repositories/")
    ) {
      checkNoSnakeCaseIdentifiers(sourceFile, file, violations);
    }

  }

  for (const file of repositoryFiles) {
    const sourceFile = await readSourceFile(rootDir, file);
    checkNoSnakeCaseIdentifiers(sourceFile, file, violations);
    checkRepositoryFile(sourceFile, file, violations, aggregateClassNames);
  }

  const repositorySources = await Promise.all(
    repositoryFiles.map(async (file) => ({
      file,
      source: await readFile(path.join(rootDir, file), "utf8"),
    }))
  );

  for (const className of aggregateClassNames) {
    const repository = repositorySources.find(({ source }) =>
      source.includes(`${className}Repository`)
    );
    if (!repository) {
      violations.push({
        file: `src/modules/${moduleName}/domain/entities`,
        rule: "entity-repository-missing",
        reason: `Aggregate ${className} must have an associated ${className}Repository interface.`,
        location: null,
      });
    }
  }
}

export async function findDddEntityViolations({
  rootDir = repoRoot,
  modules = migratedModules,
} = {}) {
  const violations = [];

  for (const moduleName of modules) {
    await checkMigratedModule(moduleName, rootDir, violations);
  }

  return violations;
}

export function formatDddEntityViolations(violations) {
  if (violations.length === 0) return "";

  return [
    "DDD entity violations:",
    ...violations.map((violation) => {
      const location = violation.location ? `:${violation.location}` : "";
      return `- ${violation.file}${location} (${violation.rule}): ${violation.reason}`;
    }),
  ].join("\n");
}

async function main() {
  const violations = await findDddEntityViolations();

  if (violations.length > 0) {
    console.error(formatDddEntityViolations(violations));
    process.exitCode = 1;
    return;
  }

  if (migratedModules.length === 0) {
    console.log("DDD entity check passed. No migrated modules configured yet.");
    return;
  }

  console.log("DDD entity check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
