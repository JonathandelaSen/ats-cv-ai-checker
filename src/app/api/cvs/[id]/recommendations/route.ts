import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getLatestRecommendationAnalysisForCV } from "@/lib/analysis-queries";
import { cvLibraryModule } from "@/lib/container";
import { ok, notFound, handleApiError } from "@/modules/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const cv = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    if (!cv) {
      throw notFound("CV not found");
    }

    const analysis = await getLatestRecommendationAnalysisForCV(
      supabase,
      id,
      user.id,
    );
    return ok({ analysis });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
