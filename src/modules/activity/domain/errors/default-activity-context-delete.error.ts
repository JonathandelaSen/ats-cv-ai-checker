import { DomainError } from "@/modules/shared";

export class DefaultActivityContextDeleteError extends DomainError {
  constructor() {
    super("The General activity context cannot be deleted.");
    this.name = "DefaultActivityContextDeleteError";
  }
}
