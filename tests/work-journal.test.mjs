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
    "work_journal_highlights",
  ]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /user_id uuid not null references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /context_id uuid not null references public\.work_journal_contexts/);
  assert.match(migration, /source_entry_ids uuid\[\] not null default '\{\}'/);
  assert.match(migration, /candidate_bullets jsonb not null default '\[\]'::jsonb/);
  assert.match(migration, /work_journal_contexts_one_default_idx/);
  assert.match(migration, /Users can read their work journal entries/);
  assert.match(migration, /Users can update their work journal highlights/);
});

test("work journal DB helpers expose contexts, suggestions, entries, and highlights", () => {
  const db = read("src/lib/db.ts");

  for (const name of [
    "WorkJournalContext",
    "WorkJournalEntry",
    "WorkJournalHighlight",
    "suggestWorkJournalContextsFromCVs",
    "ensureDefaultWorkJournalContext",
    "listWorkJournalEntries",
    "createWorkJournalEntry",
    "updateWorkJournalEntry",
    "listWorkJournalHighlights",
    "createWorkJournalHighlight",
    "updateWorkJournalHighlight",
  ]) {
    assert.match(db, new RegExp(name));
  }
  assert.match(db, /\.from\("work_journal_contexts"\)/);
  assert.match(db, /\.from\("work_journal_entries"\)/);
  assert.match(db, /\.from\("work_journal_highlights"\)/);
  assert.match(db, /select\("context_id, updated_at"\)/);
  assert.match(db, /latestContextId/);
  assert.match(db, /profile\.experience/);
  assert.match(db, /profile\.projects/);
});

test("work journal AI prompts and controllers are separated and documented", () => {
  const prompts = read("src/lib/ai-work-journal-prompts.ts");
  const controller = read("src/lib/ai-work-journal.ts");
  const docs = read("docs/prompts/diario-trabajo/prompt.md");

  assert.match(prompts, /buildWorkJournalEntryDraftPrompt/);
  assert.match(prompts, /buildWorkJournalHighlightsPrompt/);
  assert.doesNotMatch(prompts, /GoogleGenAI/);
  assert.match(controller, /GoogleGenAI/);
  assert.match(controller, /draftWorkJournalEntry/);
  assert.match(controller, /generateWorkJournalHighlights/);
  assert.match(docs, /Runtime flow/);
  assert.match(docs, /src\/lib\/ai-work-journal-prompts\.ts/);
});

test("work journal routes and UI are wired into the app", () => {
  const appShell = read("src/components/app-shell.tsx");
  const sidebar = read("src/components/sidebar.tsx");
  const view = read("src/components/work-journal-view.tsx");
  const contextsRoute = read("src/app/api/work-journal/contexts/route.ts");
  const entriesRoute = read("src/app/api/work-journal/entries/route.ts");
  const draftRoute = read("src/app/api/work-journal/entries/draft/route.ts");
  const generateRoute = read("src/app/api/work-journal/highlights/generate/route.ts");

  assert.match(appShell, /WorkJournalView/);
  assert.match(appShell, /view=journal/);
  assert.match(sidebar, /Diario/);
  assert.match(view, /Escribir tal cual/);
  assert.match(view, /Ayudame a redactarlo/);
  assert.match(view, /Redactar preview/);
  assert.match(view, /Generar highlights/);
  assert.match(view, /Sugeridos desde tus CVs/);
  assert.match(view, /is_default: true/);
  assert.match(contextsRoute, /ensureDefaultWorkJournalContext/);
  assert.match(entriesRoute, /createWorkJournalEntry/);
  assert.match(entriesRoute, /updateWorkJournalContext/);
  assert.match(draftRoute, /draftWorkJournalEntry/);
  assert.match(generateRoute, /generateWorkJournalHighlights/);
  assert.match(generateRoute, /updateWorkJournalContext/);
});
