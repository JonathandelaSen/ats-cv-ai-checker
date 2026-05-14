import type { QueryHandler } from "@/modules/shared";
import { presentJobMatchAnalysisSummary } from "../presenters/job-match-analysis-presenters";
import { ListJobMatchAnalysisUsageByDocumentUseCase } from "../use-cases/list-job-match-analysis-usage-by-document.use-case";
import {
  ListJobMatchAnalysisUsageByDocumentQuery,
  type ListJobMatchAnalysisUsageByDocumentResult,
} from "./list-job-match-analysis-usage-by-document.query";

export class ListJobMatchAnalysisUsageByDocumentQueryHandler
  implements
    QueryHandler<
      ListJobMatchAnalysisUsageByDocumentQuery,
      ListJobMatchAnalysisUsageByDocumentResult[]
    >
{
  constructor(private readonly useCase: ListJobMatchAnalysisUsageByDocumentUseCase) {}

  async handle(query: ListJobMatchAnalysisUsageByDocumentQuery) {
    const analyses = await this.useCase.execute(query.payload);
    return analyses.map(presentJobMatchAnalysisSummary);
  }
}
