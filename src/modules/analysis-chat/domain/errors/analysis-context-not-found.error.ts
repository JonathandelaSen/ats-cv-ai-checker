import { DomainError } from "@/modules/shared/domain/errors/domain-error";

export class AnalysisContextNotFoundError extends DomainError {
  constructor() {
    super("Analysis not found");
    this.name = "AnalysisContextNotFoundError";
  }
}
