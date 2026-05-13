import type { Query } from "@/modules/shared";
import type { AnalysisChatContext } from "../../domain/repositories/analysis-chat-ai-service.repository";

export interface GetLegacyAnalysisChatContextInput {
  analysisId: string;
  userId: string;
}

export class GetLegacyAnalysisChatContextQuery
  implements Query<GetLegacyAnalysisChatContextInput, AnalysisChatContext | null>
{
  static readonly queryName =
    "analysis-chat.get-legacy-analysis-chat-context";

  readonly queryName = GetLegacyAnalysisChatContextQuery.queryName;

  constructor(public readonly payload: GetLegacyAnalysisChatContextInput) {}
}
