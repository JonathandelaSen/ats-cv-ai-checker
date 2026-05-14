import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class CommitmentNotFoundError extends DomainError {
  constructor() {
    super("Commitment not found.");
    this.name = "CommitmentNotFoundError";
  }
}
