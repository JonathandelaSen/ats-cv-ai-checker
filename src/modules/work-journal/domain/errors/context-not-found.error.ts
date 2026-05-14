import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class ContextNotFoundError extends DomainError {
  constructor(contextId: string) {
    super(`Work journal context not found: ${contextId}`);
    this.name = "ContextNotFoundError";
  }
}
