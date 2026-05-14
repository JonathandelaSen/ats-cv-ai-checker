import type { QueryHandler } from "@/modules/shared";
import type { AnalysisSummary } from "@/lib/analysis-types";
import { ListCVAnalysesUseCase } from "../use-cases/list-cv-analyses.use-case";
import { presentCVAnalysisSummary } from "../presenters/cv-analysis-presenters";
import { ListCVAnalysesQuery } from "./list-cv-analyses.query";

export class ListCVAnalysesQueryHandler
  implements QueryHandler<ListCVAnalysesQuery, AnalysisSummary[]>
{
  constructor(private readonly useCase: ListCVAnalysesUseCase) {}

  async handle(query: ListCVAnalysesQuery) {
    const entities = await this.useCase.execute(query.payload);
    return entities.map(presentCVAnalysisSummary);
  }
}
