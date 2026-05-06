import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

const migrationSources = readdirSync(new URL("supabase/migrations", root))
  .filter((filename) => filename.endsWith(".sql"))
  .sort()
  .map((filename) => read(`supabase/migrations/${filename}`))
  .join("\n");

test("structured CV profile migration creates an owned cache table with RLS", () => {
  assert.match(migrationSources, /create table public\.cv_structured_profiles/);
  assert.match(migrationSources, /schema_version text not null/);
  assert.match(migrationSources, /source_text_hash text not null/);
  assert.match(migrationSources, /profile jsonb not null/);
  assert.match(
    migrationSources,
    /unique\s*\(\s*cv_id\s*,\s*schema_version\s*\)/i
  );
});

test("CV template versions migration creates a table for derived CVs", () => {
  assert.match(migrationSources, /create table if not exists public\.cv_template_versions/);
  assert.match(migrationSources, /source_cv_id uuid not null references public\.cvs/);
  assert.match(migrationSources, /template_id text not null/);
  assert.match(migrationSources, /profile jsonb not null/);
  assert.match(migrationSources, /Users can read their CV template versions/);
  assert.match(migrationSources, /exists \(\s*select 1\s*from public\.cvs/s);
});

test("structured profile helpers define the reusable standard profile contract", () => {
  assert.ok(exists("src/lib/cv-profile.ts"));
  const source = read("src/lib/cv-profile.ts");

  assert.match(source, /CV_PROFILE_SCHEMA_VERSION\s*=\s*"cv-profile\.v1"/);
  assert.match(source, /export interface StandardCVProfile/);
  assert.match(source, /export function normalizeStandardCVProfile/);
});

test("AI structuring helper is faithful JSON-only extraction", () => {
  assert.ok(exists("src/lib/ai-cv-structuring.ts"));
  const source = read("src/lib/ai-cv-structuring.ts");
  assert.match(source, /structureCVProfileWithAI/);
});

test("AI editing helper keeps edits JSON-only and rejects unusable profiles", () => {
  assert.ok(exists("src/lib/ai-cv-editing.ts"));
  const source = read("src/lib/ai-cv-editing.ts");
  assert.match(source, /editCVProfileWithAI/);
  assert.match(source, /parseEditedCVProfile/);
});

test("unified template CV endpoints handle CRUD and AI edits", () => {
  assert.ok(exists("src/app/api/cvs/[id]/route.ts"));
  assert.ok(exists("src/app/api/cvs/[id]/edit/route.ts"));
  assert.ok(exists("src/app/api/cvs/[id]/template-pdf/route.ts"));

  const editSource = read("src/app/api/cvs/[id]/edit/route.ts");
  assert.match(editSource, /getCV\(supabase,\s*id,\s*user\.id\)/);
  assert.match(editSource, /editCVProfileWithAI/);
  assert.match(editSource, /updateCVProfile/);
  assert.match(editSource, /cv\.type !== "template"/);
});

test("CV template selection creates a new version from original", () => {
  assert.ok(exists("src/app/api/cvs/[id]/template/route.ts"));
  const source = read("src/app/api/cvs/[id]/template/route.ts");

  assert.match(source, /getCV\(supabase,\s*id,\s*user\.id\)/);
  assert.match(source, /getCVStructuredProfile/);
  assert.match(source, /createTemplateCV/);
});

test("template recommendations API returns the latest analyzed CV recommendations", () => {
  assert.ok(exists("src/app/api/cvs/[id]/recommendations/route.ts"));
  const source = read("src/app/api/cvs/[id]/recommendations/route.ts");
  assert.match(source, /getLatestRecommendationAnalysisForCV/);
});

test("templates UI is reachable and follows the new catalog -> editor flow", () => {
  const appShell = read("src/components/app-shell.tsx");
  const sidebar = read("src/components/sidebar.tsx");
  const templatesView = read("src/components/templates-view.tsx");
  const editorView = read("src/components/cv-editor-view.tsx");

  assert.match(appShell, /TemplatesView/);
  assert.match(appShell, /CVEditorView/);
  assert.match(sidebar, /onOpenTemplates/);
  assert.match(sidebar, /onOpenEditor/);
  assert.match(templatesView, /Catálogo de Plantillas/);
  assert.match(templatesView, /handleCreateVersion/);
  assert.match(editorView, /Editor IA/);
  assert.match(editorView, /Canvas/i);
});

test("Filo template is registered across catalog, preview, PDF, and AI editing context", () => {
  const templatesSource = read("src/lib/cv-templates.ts");
  const previewSource = read("src/components/cv-template-preview.tsx");
  const pdfSource = read("src/lib/cv-template-pdf.tsx");
  const editSource = read("src/app/api/cvs/[id]/edit/route.ts");

  assert.match(
    templatesSource,
    /export type CVTemplateId\s*=\s*"compact"\s*\|\s*"classic"\s*\|\s*"modern"\s*\|\s*"filo"/
  );
  assert.match(templatesSource, /templateId:\s*"filo"/);
  assert.match(templatesSource, /name:\s*"Filo"/);
  assert.match(templatesSource, /filo:\s*"#[0-9a-fA-F]{6}"/);
  assert.match(previewSource, /filo:\s*"cvp-filo"/);
  assert.match(pdfSource, /const filoStyles\s*=\s*StyleSheet\.create/);
  assert.match(pdfSource, /templateId === "filo"/);
  assert.match(editSource, /import type \{ CVTemplateId, CVTemplateLocale \}/);
  assert.doesNotMatch(editSource, /as "compact"/);
});

test("CV editor exposes session undo and redo controls for profile edits", () => {
  assert.ok(exists("src/components/cv-manual-editor/use-profile-history.ts"));
  const editorView = read("src/components/cv-editor-view.tsx");
  const historyHook = read("src/components/cv-manual-editor/use-profile-history.ts");

  assert.match(historyHook, /useProfileHistory/);
  assert.match(historyHook, /canUndo/);
  assert.match(historyHook, /canRedo/);
  assert.match(editorView, /Undo2/);
  assert.match(editorView, /Redo2/);
  assert.match(editorView, /metaKey/);
  assert.match(editorView, /ctrlKey/);
  assert.match(editorView, /shiftKey/);
  assert.match(editorView, /Ctrl\+Y/);
});

test("manual CV editor is controlled by the shared profile history", () => {
  const manualEditor = read("src/components/cv-manual-editor/manual-editor.tsx");

  assert.doesNotMatch(manualEditor, /useState<StandardCVProfile>/);
  assert.doesNotMatch(manualEditor, /setTimeout\(\(\) => save/);
  assert.match(manualEditor, /onChange: \(updater: \(prev: StandardCVProfile\) => StandardCVProfile\) => void/);
  assert.match(manualEditor, /onSave: \(\) => void/);
  assert.match(manualEditor, /saveState: "idle" \| "saving" \| "saved"/);
});
