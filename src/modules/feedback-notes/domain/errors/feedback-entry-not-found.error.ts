export class FeedbackEntryNotFoundError extends Error {
  constructor(entryId: string) {
    super(`Feedback entry not found: ${entryId}`);
    this.name = "FeedbackEntryNotFoundError";
  }
}
