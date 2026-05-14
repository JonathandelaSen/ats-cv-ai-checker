import type { Query } from "@/modules/shared";
import type { AnalysisSummary } from "@/lib/analysis-types";

export interface ListJobMatchAnalysesInput {
  userId: string;
}

export class ListJobMatchAnalysesQuery
  implements Query<ListJobMatchAnalysesInput, AnalysisSummary[]>
{
  static readonly queryName = "job-match-analysis.list";
  readonly queryName = ListJobMatchAnalysesQuery.queryName;

  constructor(public readonly payload: ListJobMatchAnalysesInput) {}
}
