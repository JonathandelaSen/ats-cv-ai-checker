import type { UserId } from "@/modules/shared";
import type { ChatMessage } from "../entities/chat-message.entity";
import type { AnalysisChatMessageId } from "../value-objects/analysis-chat-message-id.value-object";
import type { AnalysisChatConversationId } from "../value-objects/analysis-chat-conversation-id.value-object";

export interface ChatMessageSearchCriteria {
  userId: UserId;
  conversationId: AnalysisChatConversationId;
}

export interface ChatMessageRepository {
  search(criteria: ChatMessageSearchCriteria): Promise<ChatMessage[]>;
  findById(id: AnalysisChatMessageId, userId: UserId): Promise<ChatMessage | null>;
  save(message: ChatMessage): Promise<ChatMessage>;
  delete(id: AnalysisChatMessageId, userId: UserId): Promise<void>;
}
