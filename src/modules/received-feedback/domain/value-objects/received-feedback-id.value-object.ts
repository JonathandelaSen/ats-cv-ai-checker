import { EntityId } from "@/modules/shared";

export class ReceivedFeedbackId extends EntityId {
  private constructor(value: string) {
    super(value, "Received feedback id");
  }

  static fromPrimitives(value: string): ReceivedFeedbackId {
    return new ReceivedFeedbackId(value);
  }
}
