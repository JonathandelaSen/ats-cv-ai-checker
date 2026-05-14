import type { QueryHandler } from "@/modules/shared";
import { presentCVAnalysisSummary } from "../presenters/cv-analysis-presenters";
import { ListCVAnalysisUsageByDocumentUseCase } from "../use-cases/list-cv-analysis-usage-by-document.use-case";
import {
  ListCVAnalysisUsageByDocumentQuery,
  type ListCVAnalysisUsageByDocumentResult,
} from "./list-cv-analysis-usage-by-document.query";

export class ListCVAnalysisUsageByDocumentQueryHandler
  implements
    QueryHandler<
      ListCVAnalysisUsageByDocumentQuery,
      ListCVAnalysisUsageByDocumentResult[]
    >
{
  constructor(private readonly useCase: ListCVAnalysisUsageByDocumentUseCase) {}

  async handle(query: ListCVAnalysisUsageByDocumentQuery) {
    const analyses = await this.useCase.execute(query.payload);
    return analyses.map(presentCVAnalysisSummary);
  }
}
