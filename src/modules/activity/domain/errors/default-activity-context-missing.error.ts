import { DomainError } from "@/modules/shared";

export class DefaultActivityContextMissingError extends DomainError {
  constructor() {
    super("The user's General activity context is missing.");
    this.name = "DefaultActivityContextMissingError";
  }
}
