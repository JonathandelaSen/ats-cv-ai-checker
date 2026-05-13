import { EntityId } from "@/modules/shared";

export class AnalysisChatConversationId extends EntityId {
  private constructor(value: string) {
    super(value, "Analysis chat conversation id");
  }

  static fromPrimitives(value: string): AnalysisChatConversationId {
    return new AnalysisChatConversationId(value);
  }
}
