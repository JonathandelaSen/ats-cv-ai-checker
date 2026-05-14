import type { QueryHandler } from "@/modules/shared";
import type { Analysis } from "@/lib/analysis-types";
import { GetCVAnalysisByIdUseCase } from "../use-cases/get-cv-analysis-by-id.use-case";
import { presentCVAnalysis } from "../presenters/cv-analysis-presenters";
import { GetCVAnalysisByIdQuery } from "./get-cv-analysis-by-id.query";

export class GetCVAnalysisByIdQueryHandler
  implements QueryHandler<GetCVAnalysisByIdQuery, Analysis | null>
{
  constructor(private readonly useCase: GetCVAnalysisByIdUseCase) {}

  async handle(query: GetCVAnalysisByIdQuery) {
    const entity = await this.useCase.execute(query.payload);
    return entity ? presentCVAnalysis(entity) : null;
  }
}
