import type { QueryHandler } from "@/modules/shared";
import type { AnalysisSummary } from "@/lib/analysis-types";
import { ListJobMatchAnalysesUseCase } from "../use-cases/list-job-match-analyses.use-case";
import { presentJobMatchAnalysisSummary } from "../presenters/job-match-analysis-presenters";
import { ListJobMatchAnalysesQuery } from "./list-job-match-analyses.query";

export class ListJobMatchAnalysesQueryHandler
  implements QueryHandler<ListJobMatchAnalysesQuery, AnalysisSummary[]>
{
  constructor(private readonly useCase: ListJobMatchAnalysesUseCase) {}

  async handle(query: ListJobMatchAnalysesQuery) {
    const entities = await this.useCase.execute(query.payload);
    return entities.map(presentJobMatchAnalysisSummary);
  }
}
