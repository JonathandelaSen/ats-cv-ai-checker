import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class FeedbackNotFoundError extends DomainError {
  constructor(feedbackId: string) {
    super(`Feedback not found: ${feedbackId}`);
    this.name = "FeedbackNotFoundError";
  }
}
