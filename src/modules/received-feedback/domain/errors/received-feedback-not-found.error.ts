import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class ReceivedFeedbackNotFoundError extends DomainError {
  constructor() {
    super("Received feedback not found.");
    this.name = "ReceivedFeedbackNotFoundError";
  }
}
