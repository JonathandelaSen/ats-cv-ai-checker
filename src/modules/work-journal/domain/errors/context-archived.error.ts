import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class ContextArchivedError extends DomainError {
  constructor(contextId: string) {
    super(`Work journal context is archived: ${contextId}`);
    this.name = "ContextArchivedError";
  }
}
