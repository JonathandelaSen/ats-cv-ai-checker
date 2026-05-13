import type { QueryHandler } from "@/modules/shared";
import { GetAnalysisChatContextUseCase } from "../use-cases/get-analysis-chat-context.use-case";
import {
  GetAnalysisChatContextQuery,
  type GetAnalysisChatContextInput,
} from "./get-analysis-chat-context.query";
import type { AnalysisChatContext } from "../../domain/repositories/analysis-chat-ai-service.repository";

export class GetAnalysisChatContextQueryHandler implements QueryHandler<
  GetAnalysisChatContextQuery,
  AnalysisChatContext | null
> {
  constructor(private readonly useCase: GetAnalysisChatContextUseCase) {}

  async handle(query: GetAnalysisChatContextQuery) {
    return this.useCase.execute(query.payload);
  }
}

export type { GetAnalysisChatContextInput };
