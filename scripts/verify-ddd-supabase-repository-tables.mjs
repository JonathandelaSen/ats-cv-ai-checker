import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fromTablePattern = /\.from\s*\(\s*["']([^"']+)["']\s*\)/g;

const tableOwners = new Map(
  Object.entries({
    analysis_chat_conversations: "analysis-chat",
    analysis_chat_messages: "analysis-chat",
    commitment_contexts: "commitments",
    commitment_items: "commitments",
    commitment_outcomes: "commitments",
    commitments: "commitments",
    cv_analyses: "cv-analysis",
    cv_structured_profiles: "cv-library",
    cvs: "cv-library",
    feedback_notes_entries: "feedback-notes",
    feedback_notes_feedbacks: "feedback-notes",
    follow_ups: "selection-process",
    job_match_analyses: "job-match-analysis",
    job_opportunities: "selection-process",
    process_questions: "selection-process",
    received_feedback: "received-feedback",
    work_journal_contexts: "work-journal",
    work_journal_entries: "work-journal",
    work_journal_hidden_context_suggestions: "work-journal",
  }),
);

const legacyCrossModuleReads = new Set([
  "src/modules/selection-process/infrastructure/repositories/supabase-follow-up.repository.ts::job_match_analyses",
  "src/modules/work-journal/infrastructure/repositories/supabase-cv-data.repository.ts::cvs",
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
    if (
      entry.isFile() &&
      entry.name.startsWith("supabase-") &&
      entry.name.endsWith(".repository.ts") &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(entryPath);
    }
  }
  return files;
}

function toPosixRelative(rootDir, filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function moduleNameFromRepositoryPath(relativePath) {
  const parts = relativePath.split("/");
  if (parts[0] !== "src" || parts[1] !== "modules") return null;
  if (parts[2] === "shared" || parts[2] === "test-helpers") return null;
  if (!relativePath.includes("/infrastructure/repositories/")) return null;
  return parts[2];
}

function inferredOwnerForTable(table) {
  const explicitOwner = tableOwners.get(table);
  if (explicitOwner) return explicitOwner;

  const normalizedTable = table.replaceAll("_", "-");
  return normalizedTable.split("-").slice(0, -1).join("-");
}

function reasonForTable(moduleName, table, owner) {
  return `Supabase repositories may only query tables owned by their module. Move cross-module reads behind a query bus read model owned by "${owner}".`;
}

export async function findSupabaseRepositoryTableViolations({
  rootDir = repoRoot,
} = {}) {
  const modulesDir = path.join(rootDir, "src/modules");
  const files = (await walkFiles(modulesDir))
    .map((filePath) => toPosixRelative(rootDir, filePath))
    .sort();

  const violations = [];
  for (const file of files) {
    const moduleName = moduleNameFromRepositoryPath(file);
    if (!moduleName) continue;

    const source = await readFile(path.join(rootDir, file), "utf8");
    const tables = new Set(
      [...source.matchAll(fromTablePattern)].map((match) => match[1]),
    );

    for (const table of tables) {
      if (legacyCrossModuleReads.has(`${file}::${table}`)) continue;
      const owner = inferredOwnerForTable(table);
      if (!owner || owner === moduleName) continue;
      violations.push({
        file,
        moduleName,
        table,
        reason: reasonForTable(moduleName, table, owner),
      });
    }
  }

  return violations;
}

export function formatSupabaseRepositoryTableViolations(violations) {
  if (violations.length === 0) return "";

  return [
    "Supabase repository table ownership violations:",
    ...violations.map(
      (violation) =>
        `- ${violation.file} queries "${violation.table}": ${violation.reason}`,
    ),
  ].join("\n");
}

async function main() {
  const violations = await findSupabaseRepositoryTableViolations();

  if (violations.length > 0) {
    console.error(formatSupabaseRepositoryTableViolations(violations));
    process.exitCode = 1;
    return;
  }

  console.log("Supabase repository table ownership check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
