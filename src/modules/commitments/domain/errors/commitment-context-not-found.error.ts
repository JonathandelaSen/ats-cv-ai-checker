import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class CommitmentContextNotFoundError extends DomainError {
  constructor() {
    super("Commitment context not found.");
    this.name = "CommitmentContextNotFoundError";
  }
}
