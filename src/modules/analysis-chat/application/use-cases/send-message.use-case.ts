import {
  Timestamp,
  UserId,
  type AIProvider,
  type QueryBus,
} from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { AnalysisContextNotFoundError } from "../../domain/errors/analysis-context-not-found.error";
import { ConversationNotFoundError } from "../../domain/errors/conversation-not-found.error";
import { ChatMessage } from "../../domain/entities/chat-message.entity";
import type { ChatMessageRepository } from "../../domain/repositories/chat-message.repository";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import type {
  AnalysisChatAIServiceFactory,
  AnalysisChatContext,
} from "../../domain/repositories/analysis-chat-ai-service.repository";
import { AnalysisChatContent } from "../../domain/value-objects/analysis-chat-content.value-object";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatMessageId } from "../../domain/value-objects/analysis-chat-message-id.value-object";
import { AnalysisReference } from "../../domain/value-objects/analysis-reference.value-object";
import { GetAnalysisChatContextQuery } from "../queries/get-analysis-chat-context.query";

function getErrorCode(error: unknown) {
  if (error instanceof Error) return error.name || "Error";
  return "UnknownError";
}

function sanitizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted-api-key]")
    .replace(/Bearer\s+[0-9A-Za-z._-]+/gi, "Bearer [redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

export interface SendMessageInput {
  userId: string;
  analysisId: string;
  conversationId: string;
  message: string;
  provider: AIProvider;
  apiKey?: string;
  model: string;
  requestId: string;
  startedAt?: number;
}

export interface SendMessageResult {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export class SendMessageUseCase {
  constructor(
    private readonly deps: {
      conversationRepo: ConversationRepository;
      messageRepo: ChatMessageRepository;
      aiFactory: AnalysisChatAIServiceFactory;
      queryBus: QueryBus;
      tracker: EventTracker;
    },
  ) {}

  async execute(input: SendMessageInput): Promise<SendMessageResult> {
    const ownerId = UserId.fromPrimitives(input.userId);
    const conversationId = AnalysisChatConversationId.fromPrimitives(
      input.conversationId,
    );
    const conversation = await this.deps.conversationRepo.findById(
      conversationId,
      ownerId,
    );
    if (!conversation) throw new ConversationNotFoundError();

    const context =
      await this.deps.queryBus.execute<AnalysisChatContext | null>(
        new GetAnalysisChatContextQuery({
          analysisId: input.analysisId,
          userId: input.userId,
        }),
      );
    if (!context) throw new AnalysisContextNotFoundError();

    const history = await this.deps.messageRepo.search({
      userId: ownerId,
      conversationId,
    });
    const analysisReference = AnalysisReference.fromPrimitives({
      type: "job_match_analysis",
      id: input.analysisId,
    });
    const now = new Date().toISOString();
    const userMessage = await this.deps.messageRepo.save(
      ChatMessage.createUserMessage({
        id: AnalysisChatMessageId.fromPrimitives(crypto.randomUUID()),
        userId: ownerId,
        analysisReference,
        conversationId,
        content: AnalysisChatContent.fromPrimitives(input.message),
        createdAt: Timestamp.fromPrimitives(now),
      }),
    );

    await this.deps.tracker.record({
      userId: input.userId,
      cvId: context.cvId,
      analysisId: input.analysisId,
      requestId: input.requestId,
      stage: "analysis_chat_message_sent",
      status: "started",
      source: "api_analysis_chat",
      textLength: input.message.length,
      metadata: {
        model: input.model,
        provider: input.provider,
        conversationId: input.conversationId,
        historyLength: history.length,
        userMessageId: userMessage.id,
      },
    });

    let answer: string;
    try {
      const aiService = this.deps.aiFactory.create({
        provider: input.provider,
        apiKey: input.apiKey,
        model: input.model,
      });
      answer = await aiService.generateAnswer({
        message: input.message,
        context,
        history: history.map((message) => message.toPrimitives()),
      });
    } catch (error) {
      await this.deps.tracker.record({
        userId: input.userId,
        cvId: context.cvId,
        analysisId: input.analysisId,
        requestId: input.requestId,
        stage: "analysis_chat_ai_response_failed",
        status: "error",
        source: "api_analysis_chat",
        errorCode: getErrorCode(error),
        errorMessage: sanitizeErrorMessage(error),
        metadata: {
          model: input.model,
          provider: input.provider,
          conversationId: input.conversationId,
        },
      });
      throw error;
    }

    const assistantMessage = await this.deps.messageRepo.save(
      ChatMessage.createAssistantMessage({
        id: AnalysisChatMessageId.fromPrimitives(crypto.randomUUID()),
        userId: ownerId,
        analysisReference,
        conversationId,
        content: AnalysisChatContent.fromPrimitives(answer),
        model: input.model,
        metadata: { requestId: input.requestId },
        createdAt: Timestamp.fromPrimitives(new Date().toISOString()),
      }),
    );

    await this.deps.tracker.record({
      userId: input.userId,
      cvId: context.cvId,
      analysisId: input.analysisId,
      requestId: input.requestId,
      stage: "analysis_chat_ai_response_created",
      status: "success",
      source: "api_analysis_chat",
      durationMs:
        input.startedAt === undefined
          ? null
          : performance.now() - input.startedAt,
      textLength: answer.length,
      metadata: {
        model: input.model,
        provider: input.provider,
        conversationId: input.conversationId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      },
    });

    return { userMessage, assistantMessage };
  }
}
