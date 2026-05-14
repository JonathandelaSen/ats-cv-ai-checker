import type { AnalysisSummary } from "@/lib/analysis-types";
import type { Query } from "@/modules/shared";

export type ListCVAnalysisUsageByDocumentResult = AnalysisSummary;

export interface ListCVAnalysisUsageByDocumentInput {
  cvDocumentId: string;
  userId: string;
}

export class ListCVAnalysisUsageByDocumentQuery
  implements
    Query<
      ListCVAnalysisUsageByDocumentInput,
      ListCVAnalysisUsageByDocumentResult[]
    >
{
  static readonly queryName = "cv-analysis.list-usage-by-document";
  readonly queryName = ListCVAnalysisUsageByDocumentQuery.queryName;

  constructor(public readonly payload: ListCVAnalysisUsageByDocumentInput) {}
}
