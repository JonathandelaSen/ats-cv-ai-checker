export class FeedbackClosedError extends Error {
  constructor(feedbackId: string) {
    super(`Feedback is closed: ${feedbackId}`);
    this.name = "FeedbackClosedError";
  }
}
