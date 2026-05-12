export class CommitmentContextNotFoundError extends Error {
  constructor() {
    super("Commitment context not found.");
    this.name = "CommitmentContextNotFoundError";
  }
}
