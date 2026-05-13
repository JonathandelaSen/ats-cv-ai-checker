import {
  AggregateRoot,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import { AnalysisChatConversationId } from "../value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatTitle } from "../value-objects/analysis-chat-title.value-object";
import {
  AnalysisReference,
  type AnalysisReferencePrimitives,
} from "../value-objects/analysis-reference.value-object";

export interface ConversationPrimitives {
  id: string;
  userId: string;
  analysisReference: AnalysisReferencePrimitives;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationCreateParams {
  id: AnalysisChatConversationId;
  userId: UserIdType;
  analysisReference: AnalysisReference;
  title: AnalysisChatTitle;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class Conversation extends AggregateRoot {
  private constructor(
    private readonly conversationId: AnalysisChatConversationId,
    private readonly ownerId: UserIdType,
    private readonly conversationAnalysisReference: AnalysisReference,
    private conversationTitle: AnalysisChatTitle,
    private readonly conversationCreatedAt: Timestamp,
    private conversationUpdatedAt: Timestamp,
  ) {
    super();
  }

  static create(params: ConversationCreateParams): Conversation {
    return new Conversation(
      params.id,
      params.userId,
      params.analysisReference,
      params.title,
      params.createdAt,
      params.updatedAt,
    );
  }

  static fromPrimitives(primitives: ConversationPrimitives): Conversation {
    return new Conversation(
      AnalysisChatConversationId.fromPrimitives(primitives.id),
      UserId.fromPrimitives(primitives.userId),
      AnalysisReference.fromPrimitives(primitives.analysisReference),
      AnalysisChatTitle.fromPrimitives(primitives.title),
      Timestamp.fromPrimitives(primitives.createdAt),
      Timestamp.fromPrimitives(primitives.updatedAt),
    );
  }

  get id(): string {
    return this.conversationId.toPrimitives();
  }

  get userId(): string {
    return this.ownerId.toPrimitives();
  }

  get idValue(): AnalysisChatConversationId {
    return this.conversationId;
  }

  rename(title: AnalysisChatTitle, updatedAt?: Timestamp): void {
    this.conversationTitle = title;
    if (updatedAt) this.conversationUpdatedAt = updatedAt;
  }

  toPrimitives(): ConversationPrimitives {
    return {
      id: this.id,
      userId: this.userId,
      analysisReference: this.conversationAnalysisReference.toPrimitives(),
      title: this.conversationTitle.toPrimitives(),
      createdAt: this.conversationCreatedAt.toPrimitives(),
      updatedAt: this.conversationUpdatedAt.toPrimitives(),
    };
  }
}
