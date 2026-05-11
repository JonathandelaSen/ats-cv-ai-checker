export class EntryNotFoundError extends Error {
  constructor(entryId: string) {
    super(`Work journal entry not found: ${entryId}`);
    this.name = "EntryNotFoundError";
  }
}
