export class ReceivedFeedbackNotFoundError extends Error {
  constructor() {
    super("Received feedback not found.");
    this.name = "ReceivedFeedbackNotFoundError";
  }
}
