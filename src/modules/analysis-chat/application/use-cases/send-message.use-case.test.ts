import { describe, expect, it, vi } from "vitest";
import {
  InMemoryQueryBus,
  Timestamp,
  UserId,
  type EventTracker,
} from "@/modules/shared";
import { ChatMessage } from "../../domain/entities/chat-message.entity";
import { Conversation } from "../../domain/entities/conversation.entity";
import { AnalysisContextNotFoundError } from "../../domain/errors/analysis-context-not-found.error";
import type { AnalysisChatAIService } from "../../domain/repositories/analysis-chat-ai-service.repository";
import type { ChatMessageRepository } from "../../domain/repositories/chat-message.repository";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { AnalysisChatContent } from "../../domain/value-objects/analysis-chat-content.value-object";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatMessageId } from "../../domain/value-objects/analysis-chat-message-id.value-object";
import { AnalysisChatTitle } from "../../domain/value-objects/analysis-chat-title.value-object";
import { AnalysisReference } from "../../domain/value-objects/analysis-reference.value-object";
import { GetAnalysisChatContextQuery } from "../queries/get-analysis-chat-context.query";
import { SendMessageUseCase } from "./send-message.use-case";

function conversation() {
  return Conversation.create({
    id: AnalysisChatConversationId.fromPrimitives("conv-1"),
    userId: UserId.fromPrimitives("user-1"),
    analysisReference: AnalysisReference.fromPrimitives({
      type: "job_match_analysis",
      id: "analysis-1",
    }),
    title: AnalysisChatTitle.fromPrimitives("Chat"),
    createdAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
    updatedAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
  });
}

function historyMessage() {
  return ChatMessage.createUserMessage({
    id: AnalysisChatMessageId.fromPrimitives("history-1"),
    userId: UserId.fromPrimitives("user-1"),
    analysisReference: AnalysisReference.fromPrimitives({
      type: "job_match_analysis",
      id: "analysis-1",
    }),
    conversationId: AnalysisChatConversationId.fromPrimitives("conv-1"),
    content: AnalysisChatContent.fromPrimitives("Antes"),
    createdAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
  });
}

describe("SendMessageUseCase", () => {
  it("gets context through the query bus, saves both messages, calls AI, and records events", async () => {
    const queryBus = new InMemoryQueryBus();
    queryBus.register(GetAnalysisChatContextQuery.queryName, {
      async handle(query: GetAnalysisChatContextQuery) {
        expect(query.payload).toEqual({
          analysisId: "analysis-1",
          userId: "user-1",
        });
        return {
          analysisId: "analysis-1",
          cvId: "cv-1",
          analysisMode: "job_match",
          analysis: {},
          cv: {},
          cvText: "CV text",
        };
      },
    });
    const savedMessages: ChatMessage[] = [];
    const conversationRepo: ConversationRepository = {
      search: vi.fn(),
      findById: vi.fn(async () => conversation()),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const messageRepo: ChatMessageRepository = {
      search: vi.fn(async () => [historyMessage()]),
      findById: vi.fn(),
      save: vi.fn(async (message) => {
        savedMessages.push(message);
        return message;
      }),
      delete: vi.fn(),
    };
    const aiService: AnalysisChatAIService = {
      generateAnswer: vi.fn(async () => "Respuesta IA"),
    };
    const tracker = {
      record: vi.fn(async () => undefined),
    } satisfies EventTracker;

    const result = await new SendMessageUseCase({
      conversationRepo,
      messageRepo,
      aiFactory: { create: vi.fn(() => aiService) },
      queryBus,
      tracker,
    }).execute({
      userId: "user-1",
      analysisId: "analysis-1",
      conversationId: "conv-1",
      message: "Hola",
      provider: "mock",
      apiKey: "key",
      model: "gemini-3.1-pro-preview",
      requestId: "req-1",
    });

    expect(result.userMessage.toPrimitives().content).toBe("Hola");
    expect(result.assistantMessage.toPrimitives()).toMatchObject({
      role: "assistant",
      content: "Respuesta IA",
      model: "gemini-3.1-pro-preview",
    });
    expect(savedMessages).toHaveLength(2);
    expect(aiService.generateAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Hola",
        history: [expect.objectContaining({ content: "Antes" })],
      }),
    );
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "analysis_chat_message_sent" }),
    );
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "analysis_chat_ai_response_created" }),
    );
  });

  it("does not call AI when legacy context is missing", async () => {
    const queryBus = new InMemoryQueryBus();
    queryBus.register(GetAnalysisChatContextQuery.queryName, {
      async handle() {
        return null;
      },
    });
    const aiService: AnalysisChatAIService = {
      generateAnswer: vi.fn(async () => "Respuesta IA"),
    };

    await expect(
      new SendMessageUseCase({
        conversationRepo: {
          search: vi.fn(),
          findById: vi.fn(async () => conversation()),
          save: vi.fn(),
          delete: vi.fn(),
        },
        messageRepo: {
          search: vi.fn(async () => []),
          findById: vi.fn(),
          save: vi.fn(),
          delete: vi.fn(),
        },
        aiFactory: { create: vi.fn(() => aiService) },
      queryBus,
        tracker: { record: vi.fn() } as unknown as EventTracker,
      }).execute({
        userId: "user-1",
        analysisId: "missing",
        conversationId: "conv-1",
        message: "Hola",
        provider: "mock",
        apiKey: "key",
        model: "gemini-3.1-pro-preview",
        requestId: "req-1",
      }),
    ).rejects.toBeInstanceOf(AnalysisContextNotFoundError);

    expect(aiService.generateAnswer).not.toHaveBeenCalled();
  });
});
