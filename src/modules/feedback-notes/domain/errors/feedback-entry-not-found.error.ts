import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class FeedbackEntryNotFoundError extends DomainError {
  constructor(entryId: string) {
    super(`Feedback entry not found: ${entryId}`);
    this.name = "FeedbackEntryNotFoundError";
  }
}
