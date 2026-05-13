import type { Query } from "@/modules/shared";
import type { AnalysisChatContext } from "../../domain/repositories/analysis-chat-ai-service.repository";

export interface GetAnalysisChatContextInput {
  analysisId: string;
  userId: string;
}

export class GetAnalysisChatContextQuery implements Query<
  GetAnalysisChatContextInput,
  AnalysisChatContext | null
> {
  static readonly queryName = "analysis-chat.get-analysis-chat-context";

  readonly queryName = GetAnalysisChatContextQuery.queryName;

  constructor(public readonly payload: GetAnalysisChatContextInput) {}
}
