import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMigration() {
  const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);
  const found = readdirSync(migrationsUrl).find((name) =>
    name.endsWith("_add_work_journal.sql")
  );
  assert.ok(found, "work journal migration should exist");
  return read(`supabase/migrations/${found}`);
}

test("work journal migration creates private owned journal tables", () => {
  const migration = readMigration();

  for (const table of [
    "work_journal_contexts",
    "work_journal_hidden_context_suggestions",
    "work_journal_entries",
  ]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /user_id uuid not null references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /context_id uuid not null references public\.work_journal_contexts/);
  assert.match(migration, /work_journal_contexts_one_default_idx/);
  assert.match(migration, /Users can read their work journal entries/);
  assert.doesNotMatch(migration, /work_journal_highlights/);
});

test("work journal module exposes domain entities, repositories, and use cases", () => {
  const barrel = read("src/modules/work-journal/index.ts");
  assert.match(barrel, /createWorkJournalModule/);
  assert.match(barrel, /WorkJournalContext/);
  assert.match(barrel, /WorkJournalEntry/);
  assert.match(barrel, /ContextNotFoundError/);
  assert.match(barrel, /EntryNotFoundError/);

  const contextRepo = read("src/modules/work-journal/infrastructure/repositories/supabase-work-journal-context.repository.ts");
  assert.match(contextRepo, /\.from\("activity_contexts"\)/);
  assert.match(contextRepo, /findLatestEntryContextId/);

  const entryRepo = read("src/modules/work-journal/infrastructure/repositories/supabase-work-journal-entry.repository.ts");
  assert.match(entryRepo, /\.from\("work_journal_entries"\)/);

  const suggestService = read("src/modules/work-journal/domain/services/suggest-contexts.service.ts");
  assert.match(suggestService, /suggestWorkJournalContextsFromCVs/);
  assert.match(suggestService, /profile\.experience/);
  assert.match(suggestService, /profile\.projects/);

  const ensureUC = read("src/modules/work-journal/application/use-cases/ensure-default-context.use-case.ts");
  assert.match(ensureUC, /EnsureDefaultContextUseCase/);
});

test("work journal AI prompts and controllers are separated and documented", () => {
  const prompts = read("src/modules/work-journal/infrastructure/services/work-journal-prompts.ts");
  const controller = read("src/modules/work-journal/infrastructure/services/gemini-journal-ai.service.ts");
  const docs = read("docs/prompts/diario-trabajo/prompt.md");

  assert.match(prompts, /buildWorkJournalEntryDraftPrompt/);
  assert.doesNotMatch(prompts, /Highlight/i);
  assert.doesNotMatch(prompts, /GoogleGenAI/);
  assert.match(controller, /GoogleGenAI/);
  assert.match(controller, /draftEntry/);
  assert.doesNotMatch(controller, /Highlight/i);
  assert.match(docs, /Runtime flow/);
  assert.match(docs, /src\/modules\/work-journal\/infrastructure\/services\/work-journal-prompts\.ts/);
});

test("work journal routes use the hexagonal module and UI is wired into the app", () => {
  const appShell = read("src/components/app-shell.tsx");
  const sidebar = read("src/components/sidebar.tsx");
  const view = read("src/components/work-journal-view.tsx");
  const contextsRoute = read("src/app/api/work-journal/contexts/route.ts");
  const entriesRoute = read("src/app/api/work-journal/entries/route.ts");
  const draftRoute = read("src/app/api/work-journal/entries/draft/route.ts");

  assert.match(appShell, /WorkJournalView/);
  assert.match(appShell, /view=journal/);
  assert.match(sidebar, /workJournal/);
  assert.match(view, /Escritura libre/);
  assert.match(view, /Redacción con IA/);
  assert.doesNotMatch(view, /highlight/i);
  assert.match(view, /Sugeridos desde tus CVs/);
  assert.match(view, /is_default: true/);
  assert.match(contextsRoute, /workJournalModule/);
  assert.match(contextsRoute, /ensureDefaultContext/);
  assert.match(entriesRoute, /createEntry/);
  assert.match(draftRoute, /createDraftEntryUseCase/);
});

test("work journal highlight routes are removed", () => {
  const files = readdirSync(new URL("../src/app/api/work-journal/", import.meta.url), {
    recursive: true,
  }).map(String);
  assert.ok(!files.some((file) => file.includes("highlights")));
});

test("db.ts no longer contains work journal code", () => {
  const routes = [
    read("src/app/api/work-journal/contexts/route.ts"),
    read("src/app/api/work-journal/entries/route.ts"),
    read("src/app/api/work-journal/entries/draft/route.ts"),
  ].join("\n");

  assert.doesNotMatch(routes, /@\/lib\/db/);
  assert.match(routes, /workJournalModule/);
});
