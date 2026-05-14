import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class FeedbackClosedError extends DomainError {
  constructor(feedbackId: string) {
    super(`Feedback is closed: ${feedbackId}`);
    this.name = "FeedbackClosedError";
  }
}
