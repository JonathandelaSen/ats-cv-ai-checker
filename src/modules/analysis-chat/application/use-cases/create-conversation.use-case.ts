import { Timestamp, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { Conversation } from "../../domain/entities/conversation.entity";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatTitle } from "../../domain/value-objects/analysis-chat-title.value-object";
import { AnalysisReference } from "../../domain/value-objects/analysis-reference.value-object";

export interface CreateConversationInput {
  userId: string;
  analysisId: string;
  title?: string | null;
  requestId: string;
}

export class CreateConversationUseCase {
  constructor(
    private readonly deps: {
      conversationRepo: ConversationRepository;
      tracker: EventTracker;
    },
  ) {}

  async execute(input: CreateConversationInput): Promise<Conversation> {
    const now = new Date().toISOString();
    const conversation = await this.deps.conversationRepo.save(
      Conversation.create({
        id: AnalysisChatConversationId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.userId),
        analysisReference: AnalysisReference.fromPrimitives({
          type: "job_match_analysis",
          id: input.analysisId,
        }),
        title: AnalysisChatTitle.fromPrimitives(
          input.title ?? "Nueva conversación",
        ),
        createdAt: Timestamp.fromPrimitives(now),
        updatedAt: Timestamp.fromPrimitives(now),
      }),
    );

    await this.deps.tracker.record({
      userId: input.userId,
      analysisId: input.analysisId,
      requestId: input.requestId,
      stage: "analysis_chat_conversation_created",
      status: "success",
      source: "api_analysis_chat",
      metadata: { conversationId: conversation.id },
    });

    return conversation;
  }
}
