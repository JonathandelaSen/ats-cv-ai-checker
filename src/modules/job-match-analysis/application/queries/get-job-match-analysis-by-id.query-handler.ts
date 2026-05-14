import type { QueryHandler } from "@/modules/shared";
import type { Analysis } from "@/lib/analysis-types";
import { GetJobMatchAnalysisByIdUseCase } from "../use-cases/get-job-match-analysis-by-id.use-case";
import { presentJobMatchAnalysis } from "../presenters/job-match-analysis-presenters";
import { GetJobMatchAnalysisByIdQuery } from "./get-job-match-analysis-by-id.query";

export class GetJobMatchAnalysisByIdQueryHandler
  implements QueryHandler<GetJobMatchAnalysisByIdQuery, Analysis | null>
{
  constructor(private readonly useCase: GetJobMatchAnalysisByIdUseCase) {}

  async handle(query: GetJobMatchAnalysisByIdQuery) {
    const entity = await this.useCase.execute(query.payload);
    return entity ? presentJobMatchAnalysis(entity) : null;
  }
}
