import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class EntryNotFoundError extends DomainError {
  constructor(entryId: string) {
    super(`Work journal entry not found: ${entryId}`);
    this.name = "EntryNotFoundError";
  }
}
