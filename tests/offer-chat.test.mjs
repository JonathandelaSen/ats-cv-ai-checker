import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMigration() {
  const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);
  const found = readdirSync(migrationsUrl).find((name) =>
    name.endsWith("_add_analysis_chat_messages.sql")
  );
  assert.ok(found, "analysis chat messages migration should exist");
  return read(`supabase/migrations/${found}`);
}

test("offer chat migration creates owned messages linked to analyses", () => {
  const migration = readMigration();

  assert.match(migration, /create table if not exists public\.analysis_chat_messages/);
  assert.match(migration, /user_id uuid not null references auth\.users/);
  assert.match(migration, /analysis_id uuid not null references public\.analyses\(id\) on delete cascade/);
  assert.match(migration, /role text not null/);
  assert.match(migration, /content text not null/);
  assert.match(migration, /model text/);
  assert.match(migration, /metadata jsonb/);
  assert.match(migration, /analysis_chat_messages_role_check/);
  assert.match(migration, /'user'/);
  assert.match(migration, /'assistant'/);
  assert.match(migration, /analysis_chat_messages_content_not_blank/);
  assert.match(migration, /alter table public\.analysis_chat_messages enable row level security/);
  assert.match(migration, /Users can read their analysis chat messages/);
  assert.match(migration, /Users can create their analysis chat messages/);
  assert.match(migration, /analysis_chat_messages_user_analysis_created_idx/);
});

test("analysis chat module owns messages and conversations with user scoping", () => {
  const db = read("src/lib/db.ts");
  const conversationRepo = read(
    "src/modules/analysis-chat/infrastructure/repositories/supabase-conversation.repository.ts"
  );
  const messageRepo = read(
    "src/modules/analysis-chat/infrastructure/repositories/supabase-chat-message.repository.ts"
  );
  const moduleBarrel = read("src/modules/analysis-chat/index.ts");

  assert.doesNotMatch(db, /export async function listAnalysisChatMessages/);
  assert.doesNotMatch(db, /export async function createAnalysisChatMessage/);
  assert.doesNotMatch(db, /export async function listAnalysisChatConversations/);
  assert.match(moduleBarrel, /createAnalysisChatModule/);
  assert.match(conversationRepo, /\.from\("analysis_chat_conversations"\)/);
  assert.match(messageRepo, /\.from\("analysis_chat_messages"\)/);
  assert.match(conversationRepo, /\.eq\("user_id"/);
  assert.match(messageRepo, /\.eq\("user_id"/);
  assert.match(messageRepo, /\.eq\("conversation_id"/);
});

test("offer chat prompts include CV, offer, analysis, and recent history without model calls", () => {
  const prompts = read("src/lib/ai-offer-chat-prompts.ts");
  const controller = read("src/lib/ai-offer-chat.ts");

  assert.match(prompts, /OFFER_CHAT_SYSTEM_PROMPT/);
  assert.match(prompts, /buildOfferChatPrompt/);
  assert.match(prompts, /job_description/);
  assert.match(prompts, /job_key_data/);
  assert.match(prompts, /missing_keywords/);
  assert.match(prompts, /cvText/);
  assert.match(prompts, /Structured CV profile JSON/);
  assert.match(prompts, /Recent conversation/);
  assert.match(prompts, /Redis/);
  assert.doesNotMatch(prompts, /GoogleGenAI/);
  assert.match(controller, /GoogleGenAI/);
  assert.match(controller, /buildOfferChatPrompt/);
  assert.match(controller, /OFFER_CHAT_SYSTEM_PROMPT/);
  assert.match(controller, /generateOfferChatAnswer/);
});

test("analysis chat route validates auth, offer mode, API key, and supports conversations", () => {
  const route = read("src/app/api/analyses/[id]/chat/route.ts");

  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /createAnalysisChatModule/);
  assert.match(route, /registerAnalysisChatQueries/);
  assert.match(route, /InMemoryQueryBus/);
  assert.match(route, /mod\.listMessages\.execute/);
  assert.match(route, /mod\.sendMessage\.execute/);
  assert.match(route, /presentMessages/);
  assert.match(route, /presentMessage/);
  assert.match(route, /Only job match analyses can use offer chat/);
  assert.match(route, /Message is required/);
  assert.match(route, /Configura tu API key de Gemini/);
  assert.match(route, /createRequestId\("offer_chat"\)/);
  assert.match(route, /stage: "offer_chat_generate"/);
  assert.match(route, /recordProcessingEvent/);
  assert.match(route, /mod\.listConversations\.execute/);
  assert.match(route, /mod\.createConversation\.execute/);
  assert.match(route, /mod\.deleteConversation\.execute/);
  assert.match(route, /action === "create_conversation"/);
  assert.match(route, /action === "rename_conversation"/);
  assert.match(route, /action === "delete_conversation"/);
  assert.match(route, /conversationId/);
  assert.doesNotMatch(route, /@\/lib\/db/);
});

test("analysis UI exposes a persistent offer chat tab with conversations", () => {
  const analysisView = read("src/components/analysis/analysis-view.tsx");
  const tabChat = read("src/components/analysis/tab-chat-oferta.tsx");

  assert.match(analysisView, /TabChatOferta/);
  assert.match(analysisView, /value="chat"/);
  assert.match(analysisView, /Chat/);
  assert.match(analysisView, /geminiApiKey=\{geminiApiKey\}/);
  assert.match(analysisView, /hasGeminiApiKey=\{hasGeminiApiKey\}/);
  assert.match(tabChat, /\/api\/analyses\/\$\{analysisId\}\/chat/);
  assert.match(tabChat, /role === "assistant"/);
  assert.match(tabChat, /Pregunta sobre esta oferta/);
  assert.match(tabChat, /Loader2/);
  assert.match(tabChat, /Send/);
  assert.match(tabChat, /ConversationList/);
  assert.match(tabChat, /createConversation/);
  assert.match(tabChat, /ReactMarkdown/);
  assert.match(tabChat, /AnalysisChatConversation/);
  assert.match(tabChat, /@\/modules\/analysis-chat/);
});
