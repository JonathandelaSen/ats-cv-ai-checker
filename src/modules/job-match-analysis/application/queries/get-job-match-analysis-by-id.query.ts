import type { Query } from "@/modules/shared";
import type { Analysis } from "@/lib/analysis-types";

export interface GetJobMatchAnalysisByIdInput {
  id: string;
  userId: string;
}

export class GetJobMatchAnalysisByIdQuery
  implements Query<GetJobMatchAnalysisByIdInput, Analysis | null>
{
  static readonly queryName = "job-match-analysis.get-by-id";
  readonly queryName = GetJobMatchAnalysisByIdQuery.queryName;

  constructor(public readonly payload: GetJobMatchAnalysisByIdInput) {}
}
