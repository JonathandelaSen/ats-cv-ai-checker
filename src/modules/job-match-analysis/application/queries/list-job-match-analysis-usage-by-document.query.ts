import type { AnalysisSummary } from "@/lib/analysis-types";
import type { Query } from "@/modules/shared";

export type ListJobMatchAnalysisUsageByDocumentResult = AnalysisSummary;

export interface ListJobMatchAnalysisUsageByDocumentInput {
  cvDocumentId: string;
  userId: string;
}

export class ListJobMatchAnalysisUsageByDocumentQuery
  implements
    Query<
      ListJobMatchAnalysisUsageByDocumentInput,
      ListJobMatchAnalysisUsageByDocumentResult[]
    >
{
  static readonly queryName = "job-match-analysis.list-usage-by-document";
  readonly queryName = ListJobMatchAnalysisUsageByDocumentQuery.queryName;

  constructor(public readonly payload: ListJobMatchAnalysisUsageByDocumentInput) {}
}
