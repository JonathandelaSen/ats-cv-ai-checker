import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { cvAnalysisModule } from "@/lib/container";
import { presentCVAnalysis } from "@/modules/cv-analysis";
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
    const analysis = await cvAnalysisModule
      .bindRequest(supabase)
      .getCVAnalysisById.execute({ id, userId: user.id });
    if (!analysis) {
      throw notFound("CV analysis not found");
    }
    return ok(presentCVAnalysis(analysis));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const deleted = await cvAnalysisModule
      .bindRequest(supabase)
      .deleteCVAnalysis.execute({ id, userId: user.id });
    if (!deleted) {
      throw notFound("CV analysis not found");
    }
    return ok({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
