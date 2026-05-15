import { DomainError } from "@/modules/shared";

export class ActivityContextNotFoundError extends DomainError {
  constructor() {
    super("Activity context not found.");
    this.name = "ActivityContextNotFoundError";
  }
}
