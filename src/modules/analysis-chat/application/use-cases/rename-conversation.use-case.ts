import { Timestamp, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ConversationNotFoundError } from "../../domain/errors/conversation-not-found.error";
import type { Conversation } from "../../domain/entities/conversation.entity";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatTitle } from "../../domain/value-objects/analysis-chat-title.value-object";

export interface RenameConversationInput {
  userId: string;
  analysisId: string;
  conversationId: string;
  title: string;
  requestId: string;
}

export class RenameConversationUseCase {
  constructor(
    private readonly deps: {
      conversationRepo: ConversationRepository;
      tracker: EventTracker;
    },
  ) {}

  async execute(input: RenameConversationInput): Promise<Conversation> {
    const id = AnalysisChatConversationId.fromPrimitives(input.conversationId);
    const userId = UserId.fromPrimitives(input.userId);
    const conversation = await this.deps.conversationRepo.findById(id, userId);
    if (!conversation) throw new ConversationNotFoundError();

    conversation.rename(
      AnalysisChatTitle.fromPrimitives(input.title),
      Timestamp.fromPrimitives(new Date().toISOString()),
    );
    const saved = await this.deps.conversationRepo.save(conversation);

    await this.deps.tracker.record({
      userId: input.userId,
      analysisId: input.analysisId,
      requestId: input.requestId,
      stage: "analysis_chat_conversation_renamed",
      status: "success",
      source: "api_analysis_chat",
      metadata: { conversationId: input.conversationId },
    });

    return saved;
  }
}
