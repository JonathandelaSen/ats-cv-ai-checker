import type { QueryHandler } from "@/modules/shared";
import { GetLegacyAnalysisChatContextUseCase } from "../use-cases/get-legacy-analysis-chat-context.use-case";
import {
  GetLegacyAnalysisChatContextQuery,
  type GetLegacyAnalysisChatContextInput,
} from "./get-legacy-analysis-chat-context.query";
import type { AnalysisChatContext } from "../../domain/repositories/analysis-chat-ai-service.repository";

export class GetLegacyAnalysisChatContextQueryHandler
  implements
    QueryHandler<
      GetLegacyAnalysisChatContextQuery,
      AnalysisChatContext | null
    >
{
  constructor(private readonly useCase: GetLegacyAnalysisChatContextUseCase) {}

  async handle(query: GetLegacyAnalysisChatContextQuery) {
    return this.useCase.execute(query.payload);
  }
}

export type { GetLegacyAnalysisChatContextInput };
