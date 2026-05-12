export class CommitmentOutcomeNotFoundError extends Error {
  constructor() {
    super("Commitment outcome not found.");
    this.name = "CommitmentOutcomeNotFoundError";
  }
}
