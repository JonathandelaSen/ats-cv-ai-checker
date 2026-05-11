export class FeedbackEntriesRequiredError extends Error {
  constructor(feedbackId: string) {
    super(`Feedback requires at least one entry: ${feedbackId}`);
    this.name = "FeedbackEntriesRequiredError";
  }
}
