export class CommitmentItemNotFoundError extends Error {
  constructor() {
    super("Commitment item not found.");
    this.name = "CommitmentItemNotFoundError";
  }
}
