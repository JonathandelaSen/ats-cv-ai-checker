import { describe, expect, it } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { createTestJobMatchAnalysis } from "@/modules/test-helpers/analysis-fixtures";
import { createTestCV } from "@/modules/test-helpers/cv-fixtures";
import { ChatMessage } from "../../domain/entities/chat-message.entity";
import { AnalysisChatContent } from "../../domain/value-objects/analysis-chat-content.value-object";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatMessageId } from "../../domain/value-objects/analysis-chat-message-id.value-object";
import { AnalysisReference } from "../../domain/value-objects/analysis-reference.value-object";
import { SupabaseConversationRepository } from "./supabase-conversation.repository";
import { SupabaseChatMessageRepository } from "./supabase-chat-message.repository";

const supabase = getSupabaseClient();
const conversationRepo = new SupabaseConversationRepository();
conversationRepo.bindRequest(supabase);
const messageRepo = new SupabaseChatMessageRepository();
messageRepo.bindRequest(supabase);

async function createJobMatchAnalysis(userId: string) {
  const cv = await createTestCV(supabase, {
    id: crypto.randomUUID(),
    user_id: userId,
    name: testLabel("cv"),
    filename: "cv.pdf",
    file_size: 100,
    pdf_storage_path: null,
    text_python: "CV text",
    text_pdfjs: null,
    text_node: null,
    extract_error_python: null,
    extract_error_pdfjs: null,
    extract_error_node: null,
  });
  const analysis = await createTestJobMatchAnalysis(supabase, {
    id: crypto.randomUUID(),
    userId,
    cvId: cv.id,
    title: testLabel("analysis"),
    text: "Analysis text",
    score: 80,
  });
  if (!analysis) throw new Error("Failed to create test analysis");
  return analysis;
}

describe("SupabaseChatMessageRepository", () => {
  it("saves, lists, finds, and deletes messages", async () => {
    const user = await createTestUser("analysis-chat-msg");
    const analysis = await createJobMatchAnalysis(user.id);
    const conversation = await conversationRepo.create({
      user_id: user.id,
      analysis_id: analysis.id,
      title: "Chat",
    });
    const message = ChatMessage.createAssistantMessage({
      id: AnalysisChatMessageId.fromPrimitives(crypto.randomUUID()),
      userId: UserId.fromPrimitives(user.id),
      analysisReference: AnalysisReference.fromPrimitives({
        type: "job_match_analysis",
        id: analysis.id,
      }),
      conversationId: AnalysisChatConversationId.fromPrimitives(
        conversation.id,
      ),
      content: AnalysisChatContent.fromPrimitives("Respuesta"),
      model: "gemini",
      metadata: { requestId: "req-1" },
      createdAt: Timestamp.fromPrimitives(new Date().toISOString()),
    });

    const saved = await messageRepo.save(message);
    expect(saved.toPrimitives()).toMatchObject({
      userId: user.id,
      conversationId: conversation.id,
      role: "assistant",
      content: "Respuesta",
      model: "gemini",
      metadata: { requestId: "req-1" },
    });

    const listed = await messageRepo.search({
      userId: UserId.fromPrimitives(user.id),
      conversationId: AnalysisChatConversationId.fromPrimitives(
        conversation.id,
      ),
    });
    expect(listed.map((item) => item.id)).toContain(saved.id);

    const found = await messageRepo.findById(
      AnalysisChatMessageId.fromPrimitives(saved.id),
      UserId.fromPrimitives(user.id),
    );
    expect(found?.toPrimitives().content).toBe("Respuesta");

    await messageRepo.delete(
      AnalysisChatMessageId.fromPrimitives(saved.id),
      UserId.fromPrimitives(user.id),
    );
    await expect(
      messageRepo.findById(
        AnalysisChatMessageId.fromPrimitives(saved.id),
        UserId.fromPrimitives(user.id),
      ),
    ).resolves.toBeNull();
  });
});
