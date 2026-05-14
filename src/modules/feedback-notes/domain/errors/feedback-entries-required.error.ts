import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class FeedbackEntriesRequiredError extends DomainError {
  constructor(feedbackId: string) {
    super(`Feedback requires at least one entry: ${feedbackId}`);
    this.name = "FeedbackEntriesRequiredError";
  }
}
