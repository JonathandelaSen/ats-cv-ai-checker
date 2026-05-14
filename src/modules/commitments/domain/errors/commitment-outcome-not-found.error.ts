import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class CommitmentOutcomeNotFoundError extends DomainError {
  constructor() {
    super("Commitment outcome not found.");
    this.name = "CommitmentOutcomeNotFoundError";
  }
}
