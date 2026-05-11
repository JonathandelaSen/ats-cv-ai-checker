export class ContextNotFoundError extends Error {
  constructor(contextId: string) {
    super(`Work journal context not found: ${contextId}`);
    this.name = "ContextNotFoundError";
  }
}
