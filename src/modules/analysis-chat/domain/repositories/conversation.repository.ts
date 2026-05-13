import type { UserId } from "@/modules/shared";
import type { Conversation } from "../entities/conversation.entity";
import type { AnalysisChatConversationId } from "../value-objects/analysis-chat-conversation-id.value-object";
import type { AnalysisReference } from "../value-objects/analysis-reference.value-object";

export interface ConversationSearchCriteria {
  userId: UserId;
  analysisReference: AnalysisReference;
}

export interface ConversationRepository {
  search(criteria: ConversationSearchCriteria): Promise<Conversation[]>;
  findById(
    id: AnalysisChatConversationId,
    userId: UserId,
  ): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<Conversation>;
  delete(id: AnalysisChatConversationId, userId: UserId): Promise<void>;
}
