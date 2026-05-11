export class FeedbackNotFoundError extends Error {
  constructor(feedbackId: string) {
    super(`Feedback not found: ${feedbackId}`);
    this.name = "FeedbackNotFoundError";
  }
}
