import type { Query } from "@/modules/shared";
import type { Analysis } from "@/lib/analysis-types";

export interface GetCVAnalysisByIdInput {
  id: string;
  userId: string;
}

export class GetCVAnalysisByIdQuery
  implements Query<GetCVAnalysisByIdInput, Analysis | null>
{
  static readonly queryName = "cv-analysis.get-by-id";
  readonly queryName = GetCVAnalysisByIdQuery.queryName;

  constructor(public readonly payload: GetCVAnalysisByIdInput) {}
}
