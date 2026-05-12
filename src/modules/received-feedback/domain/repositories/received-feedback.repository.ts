import type { UserId } from "@/modules/shared";
import type { ReceivedFeedback } from "../entities/received-feedback.entity";
import type { ReceivedFeedbackId } from "../value-objects/received-feedback-id.value-object";

export interface ReceivedFeedbackSearchCriteria {
  userId: UserId;
  limit: number;
}

export interface ReceivedFeedbackRepository {
  search(criteria: ReceivedFeedbackSearchCriteria): Promise<ReceivedFeedback[]>;
  findById(id: ReceivedFeedbackId, userId: UserId): Promise<ReceivedFeedback | null>;
  save(feedback: ReceivedFeedback): Promise<ReceivedFeedback>;
  delete(id: ReceivedFeedbackId, userId: UserId): Promise<void>;
}
