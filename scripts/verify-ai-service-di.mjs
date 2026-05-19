import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".test-infra"].includes(entry.name)) return [];
      return walk(fullPath, predicate);
    }
    return predicate(fullPath) ? [fullPath] : [];
  });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function rel(file) {
  return path.relative(root, file);
}

for (const file of walk(path.join(root, "src/modules"), (file) =>
  /domain\/repositories\/.*ai.*service.*\.ts$/.test(file),
)) {
  const source = read(file);
  const matches = source.matchAll(/interface\s+\w*AIServiceFactory\s*{[\s\S]*?create\s*\(([\s\S]*?)\)\s*:/g);
  for (const match of matches) {
    if (!match[1].includes("provider")) {
      failures.push(`${rel(file)}: AI service factory create(...) must include provider.`);
    }
  }
}

for (const file of walk(path.join(root, "src/modules"), (file) =>
  /\/[^/]+\.module\.ts$/.test(file),
)) {
  const source = read(file);
  if (/new\s+\w+\wAIServiceFactory\s*\([^)]*\)/.test(source) && /aiServiceFactory:\s*new\s+Gemini|aiFactory:\s*new\s+Gemini/.test(source)) {
    failures.push(`${rel(file)}: modules must inject provider-aware factories into use cases.`);
  }
}

for (const file of walk(path.join(root, "src/modules"), (file) =>
  /infrastructure\/services\/provider-.*ai.*\.((service\.)?factory\.)?ts$/.test(file),
)) {
  const source = read(file);
  if (!source.includes("assertAIProviderAllowedForRuntime")) {
    failures.push(`${rel(file)}: provider-aware factory must call assertAIProviderAllowedForRuntime.`);
  }
}

for (const file of walk(path.join(root, "src"), (file) =>
  /(\.test\.ts|test-helpers.*\.ts)$/.test(file),
)) {
  const source = read(file);
  if (source.includes("@google/genai") || /gemini-.*ai\.service/.test(source)) {
    failures.push(`${rel(file)}: automated tests must not import real AI provider SDKs or services.`);
  }
}

for (const file of walk(path.join(root, "src"), (file) =>
  /\.(ts|tsx)$/.test(file) &&
  (/src\/app\/api\//.test(file) ||
    /src\/features\//.test(file) ||
    /src\/components\//.test(file) ||
    /src\/frontend\//.test(file) ||
    /src\/lib\/browser-preferences\.ts$/.test(file)),
)) {
  const source = read(file);
  if (/geminiApiKey|StoredGemini|getStoredGemini|saveStoredGemini|removeStoredGemini|hasStoredGemini/.test(source)) {
    failures.push(`${rel(file)}: AI HTTP/frontend settings must use provider/apiKey/model, not Gemini-specific names.`);
  }
}

if (failures.length > 0) {
  console.error("AI service DI verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AI service DI verification passed.");
