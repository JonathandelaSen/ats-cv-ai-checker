import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { cvLibraryModule, jobMatchAnalysisModule } from "@/lib/container";
import {
  presentCVDocumentSummary,
} from "@/modules/cv-library";
import { presentJobMatchAnalysisSummary } from "@/modules/job-match-analysis";
import { handleApiError, ok } from "@/modules/shared";
import type { InterviewQuestionOptionsResponse } from "../responses";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const [cvs, analyses] = await Promise.all([
      cvLibraryModule
        .bindRequest(supabase)
        .listCVDocuments.execute({ userId: user.id }),
      jobMatchAnalysisModule
        .bindRequest(supabase)
        .listJobMatchAnalyses.execute({ userId: user.id }),
    ]);

    return ok({
      cvs: cvs.map(presentCVDocumentSummary).map((cv) => ({
        id: cv.id,
        name: cv.name,
      })),
      analyses: analyses.map(presentJobMatchAnalysisSummary).map((analysis) => ({
        id: analysis.id,
        title: analysis.title,
        analysisMode: "job_match",
      })),
    } satisfies InterviewQuestionOptionsResponse);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
