import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class ConversationNotFoundError extends DomainError {
  constructor() {
    super("Conversation not found");
    this.name = "ConversationNotFoundError";
  }
}
