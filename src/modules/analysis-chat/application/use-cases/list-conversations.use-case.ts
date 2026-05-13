import { UserId } from "@/modules/shared";
import type { Conversation } from "../../domain/entities/conversation.entity";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { AnalysisReference } from "../../domain/value-objects/analysis-reference.value-object";

export interface ListConversationsInput {
  userId: string;
  analysisId: string;
}

export class ListConversationsUseCase {
  constructor(
    private readonly deps: { conversationRepo: ConversationRepository },
  ) {}

  async execute(input: ListConversationsInput): Promise<Conversation[]> {
    return this.deps.conversationRepo.search({
      userId: UserId.fromPrimitives(input.userId),
      analysisReference: AnalysisReference.fromPrimitives({
        type: "job_match_analysis",
        id: input.analysisId,
      }),
    });
  }
}
