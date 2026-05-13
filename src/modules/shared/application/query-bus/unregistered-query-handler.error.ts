export class UnregisteredQueryHandlerError extends Error {
  constructor(queryName: string) {
    super(`No query handler registered for "${queryName}".`);
    this.name = "UnregisteredQueryHandlerError";
  }
}
