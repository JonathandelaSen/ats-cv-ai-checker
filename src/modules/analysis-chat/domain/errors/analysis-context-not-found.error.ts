export class AnalysisContextNotFoundError extends Error {
  constructor() {
    super("Analysis not found");
    this.name = "AnalysisContextNotFoundError";
  }
}
