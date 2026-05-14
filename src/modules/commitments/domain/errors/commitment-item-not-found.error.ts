import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class CommitmentItemNotFoundError extends DomainError {
  constructor() {
    super("Commitment item not found.");
    this.name = "CommitmentItemNotFoundError";
  }
}
