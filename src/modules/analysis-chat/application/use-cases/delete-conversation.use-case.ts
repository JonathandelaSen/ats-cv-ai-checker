import { UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";

export interface DeleteConversationInput {
  userId: string;
  analysisId: string;
  conversationId: string;
  requestId: string;
}

export class DeleteConversationUseCase {
  constructor(
    private readonly deps: {
      conversationRepo: ConversationRepository;
      tracker: EventTracker;
    },
  ) {}

  async execute(input: DeleteConversationInput): Promise<void> {
    await this.deps.conversationRepo.delete(
      AnalysisChatConversationId.fromPrimitives(input.conversationId),
      UserId.fromPrimitives(input.userId),
    );
    await this.deps.tracker.record({
      userId: input.userId,
      analysisId: input.analysisId,
      requestId: input.requestId,
      stage: "analysis_chat_conversation_deleted",
      status: "success",
      source: "api_analysis_chat",
      metadata: { conversationId: input.conversationId },
    });
  }
}
