import type { Query } from "@/modules/shared";
import type { AnalysisSummary } from "@/lib/analysis-types";

export interface ListCVAnalysesInput {
  userId: string;
}

export class ListCVAnalysesQuery
  implements Query<ListCVAnalysesInput, AnalysisSummary[]>
{
  static readonly queryName = "cv-analysis.list";
  readonly queryName = ListCVAnalysesQuery.queryName;

  constructor(public readonly payload: ListCVAnalysesInput) {}
}
