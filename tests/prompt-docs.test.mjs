import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const promptDocs = [
  {
    name: "CV analysis",
    doc: "docs/prompts/analisis-cv/prompt.md",
    source: "src/lib/ai-scoring.ts",
    required: ["buildGeneralPrompt", "extracted CV text", "ai_context"],
  },
  {
    name: "offer analysis",
    doc: "docs/prompts/analisis-oferta/prompt.md",
    source: "src/lib/ai-scoring.ts",
    required: ["buildJobMatchPrompt", "job_description", "job_url"],
  },
  {
    name: "CV information extraction",
    doc: "docs/prompts/extraccion-info-cv/prompt.md",
    source: "src/modules/cv-library/infrastructure/services/cv-profile-structuring-prompts.ts",
    required: ["SYSTEM_PROMPT", "StructureCVProfileWithAIUseCase", "CV_PROFILE_SCHEMA_VERSION"],
  },
  {
    name: "CV editing",
    doc: "docs/prompts/editado-cv/prompt.md",
    source: "src/modules/cv-library/infrastructure/services/cv-profile-editing-prompts.ts",
    required: ["SYSTEM_PROMPT", "EditCVProfileWithAIUseCase", "recommendations"],
  },
  {
    name: "offer chat",
    doc: "docs/prompts/chat-oferta-ai/prompt.md",
    source: "src/lib/ai-offer-chat-prompts.ts",
    required: ["OFFER_CHAT_SYSTEM_PROMPT", "buildOfferChatPrompt", "Recent conversation"],
  },
  {
    name: "interview questions",
    doc: "docs/prompts/preguntas-entrevista/prompt.md",
    source: "src/lib/ai-interview-question-prompts.ts",
    required: ["INTERVIEW_QUESTION_SYSTEM_PROMPT", "buildInterviewQuestionPrompt", "Linked job posting"],
  },
];

test("prompt documentation exists for every AI prompt family", () => {
  for (const item of promptDocs) {
    const doc = read(item.doc);

    assert.match(doc, /^# /m, `${item.name} doc should have a title`);
    assert.match(doc, /## Source/, `${item.name} doc should explain source`);
    assert.match(doc, /## Current Prompt/, `${item.name} doc should include prompt`);
    assert.match(doc, /## Data Inputs/, `${item.name} doc should document inputs`);
    assert.match(doc, /## Runtime Flow/, `${item.name} doc should document flow`);
    assert.match(doc, new RegExp(item.source.replaceAll("/", "\\/")));
    for (const required of item.required) {
      assert.match(doc, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  }
});

test("AGENTS requires prompt docs to be kept in sync with prompt changes", () => {
  const agents = read("AGENTS.md");

  assert.match(agents, /docs\/prompts/);
  assert.match(agents, /prompt\.md/);
  assert.match(agents, /actualizar la documentaci[oó]n/i);
  assert.match(agents, /prompt/i);
});
