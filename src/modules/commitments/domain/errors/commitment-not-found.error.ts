export class CommitmentNotFoundError extends Error {
  constructor() {
    super("Commitment not found.");
    this.name = "CommitmentNotFoundError";
  }
}
