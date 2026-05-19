import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  jobMatchAnalysisModule,
  selectionProcessModule,
} from "@/lib/container";
import { presentJobMatchAnalysis } from "@/modules/job-match-analysis";
import { parseUpdateJobMatchAnalysisRequest } from "../validation";
import { toJobMatchAnalysisDetailResponse } from "../responses";
import { ok, errorResponse, notFound, handleApiError } from "@/modules/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const analysis = await jobMatchAnalysisModule
      .bindRequest(supabase)
      .getJobMatchAnalysisById.execute({ id, userId: user.id });
    if (!analysis) {
      throw notFound("Job match analysis not found");
    }
    return ok(toJobMatchAnalysisDetailResponse(presentJobMatchAnalysis(analysis)));
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
    const deleted = await jobMatchAnalysisModule
      .bindRequest(supabase)
      .deleteJobMatchAnalysis.execute({ id, userId: user.id });
    if (!deleted) {
      throw notFound("Job match analysis not found");
    }
    return ok({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const body = await req.json();
    const parsed = parseUpdateJobMatchAnalysisRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    const { allowedUpdates, followUpUpdates, includesOfferTracking } = parsed.value;

    if (includesOfferTracking) {
      const followUp = await selectionProcessModule
        .bindRequest(supabase)
        .updateFollowUpByAnalysis.execute({
          analysisId: id,
          userId: user.id,
          ...followUpUpdates,
        });
      if (!followUp) {
        throw notFound("Analysis not found or update failed");
      }
    }

    const entity =
      Object.keys(allowedUpdates).length > 0
        ? await jobMatchAnalysisModule
            .bindRequest(supabase)
            .updateJobMatchAnalysisJobUrl.execute({
              id,
              userId: user.id,
              jobUrl: allowedUpdates.job_url ?? null,
            })
        : await jobMatchAnalysisModule
            .bindRequest(supabase)
            .getJobMatchAnalysisById.execute({ id, userId: user.id });

    if (!entity) {
      throw notFound("Analysis not found or update failed");
    }

    const response = toJobMatchAnalysisDetailResponse(presentJobMatchAnalysis(entity));
    return ok({
      ...response,
      ...(followUpUpdates.status !== undefined
        ? { offerStatus: followUpUpdates.status }
        : {}),
      ...(followUpUpdates.notes !== undefined
        ? { offerNotes: followUpUpdates.notes }
        : {}),
      ...(followUpUpdates.nextAction !== undefined
        ? { offerNextAction: followUpUpdates.nextAction }
        : {}),
      ...(followUpUpdates.nextActionAt !== undefined
        ? { offerNextActionAt: followUpUpdates.nextActionAt }
        : {}),
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
