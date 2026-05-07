import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMigration() {
  const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);
  const found = readdirSync(migrationsUrl).find((name) =>
    name.endsWith("_add_interview_questions.sql")
  );
  assert.ok(found, "interview questions migration should exist");
  return read(`supabase/migrations/${found}`);
}

test("AGENTS documents prompt/controller separation for model calls", () => {
  const agents = read("AGENTS.md");
  assert.match(agents, /prompts/i);
  assert.match(agents, /l[oó]gica\/controladores/i);
  assert.match(agents, /archivos separados/i);
});

test("interview questions migration creates owned relational question storage", () => {
  const migration = readMigration();

  assert.match(migration, /create table if not exists public\.interview_questions/);
  assert.match(migration, /user_id uuid not null references auth\.users/);
  assert.match(migration, /cv_id uuid references public\.cvs\(id\) on delete set null/);
  assert.match(migration, /analysis_id uuid references public\.analyses\(id\) on delete set null/);
  assert.match(migration, /answer text/);
  assert.match(migration, /ai_model text/);
  assert.match(migration, /ai_generated_at timestamptz/);
  assert.match(migration, /interview_questions_question_not_blank/);
  assert.match(migration, /alter table public\.interview_questions enable row level security/);
  assert.match(migration, /Users can read their interview questions/);
  assert.match(migration, /Users can create their interview questions/);
  assert.match(migration, /Users can update their interview questions/);
  assert.match(migration, /Users can delete their interview questions/);
  assert.match(migration, /interview_questions_user_created_idx/);
  assert.match(migration, /interview_questions_user_cv_idx/);
  assert.match(migration, /interview_questions_user_analysis_idx/);
});

test("DB helpers expose interview question CRUD with user scoping", () => {
  const db = read("src/lib/db.ts");

  assert.match(db, /export interface InterviewQuestion/);
  assert.match(db, /export (interface|type) InterviewQuestionSummary/);
  for (const helper of [
    "listInterviewQuestions",
    "getInterviewQuestion",
    "createInterviewQuestion",
    "updateInterviewQuestion",
    "deleteInterviewQuestion",
  ]) {
    assert.match(db, new RegExp(`export async function ${helper}`));
  }
  assert.match(db, /\.from\("interview_questions"\)/);
  assert.match(db, /\.eq\("user_id", userId\)/);
});

test("AI prompts and model-call controller stay separated", () => {
  const prompts = read("src/lib/ai-interview-question-prompts.ts");
  const generation = read("src/lib/ai-interview-question-generation.ts");

  assert.match(prompts, /buildInterviewQuestionPrompt/);
  assert.doesNotMatch(prompts, /GoogleGenAI/);
  assert.match(generation, /GoogleGenAI/);
  assert.match(generation, /buildInterviewQuestionPrompt/);
  assert.match(generation, /parseInterviewQuestionAIResponse/);
});

test("interview question routes validate ownership, offer mode, and AI context", () => {
  const listRoute = read("src/app/api/interview-questions/route.ts");
  const detailRoute = read("src/app/api/interview-questions/[id]/route.ts");
  const generateRoute = read("src/app/api/interview-questions/[id]/generate/route.ts");
  const editRoute = read("src/app/api/interview-questions/[id]/edit/route.ts");

  assert.match(listRoute, /listInterviewQuestions/);
  assert.match(listRoute, /createInterviewQuestion/);
  assert.match(listRoute, /createRequestId\("interview_question"\)/);
  assert.match(listRoute, /recordProcessingEvent/);
  assert.match(listRoute, /stage: "interview_question_create"/);
  assert.match(listRoute, /question is required/i);
  assert.match(listRoute, /normalizeOptionalLink/);
  assert.match(listRoute, /data\.context === undefined \? null/);
  assert.match(listRoute, /data\.answer === undefined \? null/);
  assert.match(listRoute, /validateQuestionLinks/);
  assert.match(listRoute, /links\.analysis\?\.cv_id/);
  assert.match(detailRoute, /updateInterviewQuestion/);
  assert.match(detailRoute, /deleteInterviewQuestion/);
  assert.match(detailRoute, /validateQuestionLinks/);
  assert.match(generateRoute, /generateInterviewQuestionAnswer/);
  assert.match(generateRoute, /stage: "interview_question_generate"/);
  assert.match(generateRoute, /recordProcessingEvent/);
  assert.match(generateRoute, /context is required/i);
  assert.match(generateRoute, /analysis_mode !== "job_match"/);
  assert.match(editRoute, /editInterviewQuestionAnswer/);
  assert.match(editRoute, /stage: "interview_question_edit"/);
  assert.match(editRoute, /recordProcessingEvent/);
  assert.match(editRoute, /context is required/i);
  assert.match(editRoute, /instruction is required/i);
});

test("interview question UI is reachable and linked from CVs and offers", () => {
  const sidebar = read("src/components/sidebar.tsx");
  const appShell = read("src/components/app-shell.tsx");
  const questionsView = read("src/components/interview-questions-view.tsx");
  const cvLibrary = read("src/components/cv-library.tsx");
  const analysisView = read("src/components/ai-analysis-view.tsx");

  assert.match(sidebar, /Preguntas/);
  assert.match(appShell, /InterviewQuestionsView/);
  assert.match(appShell, /view=questions/);
  assert.match(questionsView, /Buscar preguntas/);
  assert.match(questionsView, /Guardar sin IA/);
  assert.match(questionsView, /Crear y generar con IA/);
  assert.match(questionsView, /Modelo para generar con IA/);
  assert.match(questionsView, /Generar con IA/);
  assert.match(questionsView, /Guardar cambios manuales/);
  assert.match(questionsView, /Editar con IA/);
  assert.match(questionsView, /cvFilter/);
  assert.match(questionsView, /analysisFilter/);
  assert.match(cvLibrary, /Preguntas asociadas/);
  assert.match(analysisView, /Preguntas asociadas/);
  assert.match(analysisView, /Guardar sin IA/);
  assert.match(analysisView, /Crear y generar con IA/);
  assert.match(analysisView, /Modelo para generar con IA/);
  assert.match(analysisView, /interviewQuestions\.map/);
  assert.doesNotMatch(analysisView, /interviewQuestions\.slice/);

  const offerDescriptionIndex = analysisView.indexOf("Oferta de Trabajo Analizada");
  const questionsIndex = analysisView.lastIndexOf("Preguntas asociadas");
  const trackingIndex = analysisView.lastIndexOf("Seguimiento de oferta");
  assert.ok(offerDescriptionIndex < questionsIndex);
  assert.ok(questionsIndex < trackingIndex);
});
