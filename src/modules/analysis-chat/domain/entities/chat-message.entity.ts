import {
  AggregateRoot,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import { AnalysisChatContent } from "../value-objects/analysis-chat-content.value-object";
import { AnalysisChatConversationId } from "../value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatMessageId } from "../value-objects/analysis-chat-message-id.value-object";
import {
  AnalysisChatRole,
  type AnalysisChatRolePrimitives,
} from "../value-objects/analysis-chat-role.value-object";
import {
  AnalysisReference,
  type AnalysisReferencePrimitives,
} from "../value-objects/analysis-reference.value-object";

export interface ChatMessagePrimitives {
  id: string;
  userId: string;
  analysisReference: AnalysisReferencePrimitives;
  conversationId: string;
  role: AnalysisChatRolePrimitives;
  content: string;
  model: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ChatMessageCreateParams {
  id: AnalysisChatMessageId;
  userId: UserIdType;
  analysisReference: AnalysisReference;
  conversationId: AnalysisChatConversationId;
  content: AnalysisChatContent;
  createdAt: Timestamp;
}

export interface AssistantChatMessageCreateParams extends ChatMessageCreateParams {
  model: string | null;
  metadata: Record<string, unknown> | null;
}

export class ChatMessage extends AggregateRoot {
  private constructor(
    private readonly messageId: AnalysisChatMessageId,
    private readonly ownerId: UserIdType,
    private readonly messageAnalysisReference: AnalysisReference,
    private readonly messageConversationId: AnalysisChatConversationId,
    private readonly messageRole: AnalysisChatRole,
    private readonly messageContent: AnalysisChatContent,
    private readonly messageModel: string | null,
    private readonly messageMetadata: Record<string, unknown> | null,
    private readonly messageCreatedAt: Timestamp
  ) {
    super();
  }

  static createUserMessage(params: ChatMessageCreateParams): ChatMessage {
    return new ChatMessage(
      params.id,
      params.userId,
      params.analysisReference,
      params.conversationId,
      AnalysisChatRole.user(),
      params.content,
      null,
      null,
      params.createdAt
    );
  }

  static createAssistantMessage(params: AssistantChatMessageCreateParams): ChatMessage {
    return new ChatMessage(
      params.id,
      params.userId,
      params.analysisReference,
      params.conversationId,
      AnalysisChatRole.assistant(),
      params.content,
      params.model,
      params.metadata,
      params.createdAt
    );
  }

  static fromPrimitives(primitives: ChatMessagePrimitives): ChatMessage {
    return new ChatMessage(
      AnalysisChatMessageId.fromPrimitives(primitives.id),
      UserId.fromPrimitives(primitives.userId),
      AnalysisReference.fromPrimitives(primitives.analysisReference),
      AnalysisChatConversationId.fromPrimitives(primitives.conversationId),
      AnalysisChatRole.fromPrimitives(primitives.role),
      AnalysisChatContent.fromPrimitives(primitives.content),
      primitives.model,
      primitives.metadata,
      Timestamp.fromPrimitives(primitives.createdAt)
    );
  }

  get id(): string {
    return this.messageId.toPrimitives();
  }

  get userId(): string {
    return this.ownerId.toPrimitives();
  }

  get conversationId(): string {
    return this.messageConversationId.toPrimitives();
  }

  toPrimitives(): ChatMessagePrimitives {
    return {
      id: this.id,
      userId: this.userId,
      analysisReference: this.messageAnalysisReference.toPrimitives(),
      conversationId: this.conversationId,
      role: this.messageRole.toPrimitives(),
      content: this.messageContent.toPrimitives(),
      model: this.messageModel,
      metadata: this.messageMetadata ? { ...this.messageMetadata } : null,
      createdAt: this.messageCreatedAt.toPrimitives(),
    };
  }
}
