export class ContextArchivedError extends Error {
  constructor(contextId: string) {
    super(`Work journal context is archived: ${contextId}`);
    this.name = "ContextArchivedError";
  }
}
