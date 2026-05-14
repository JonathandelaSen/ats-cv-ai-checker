import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import {
  jobMatchAnalysisModule,
  selectionProcessModule,
} from "@/lib/container";
import { presentJobMatchAnalysis } from "@/modules/job-match-analysis";
import { parseUpdateJobMatchAnalysisRequest } from "../validation";

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
      return NextResponse.json(
        { error: "Job match analysis not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(presentJobMatchAnalysis(analysis));
  } catch (error: unknown) {
    console.error("Get job match analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to get job match analysis",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
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
      return NextResponse.json(
        { error: "Job match analysis not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete job match analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete job match analysis",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
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
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    const { allowedUpdates, followUpUpdates, includesOfferTracking } = parsed.value;

    let existing = null;
    if (includesOfferTracking) {
      const followUp = await selectionProcessModule
        .bindRequest(supabase)
        .updateFollowUpByAnalysis.execute({
          analysisId: id,
          userId: user.id,
          ...followUpUpdates,
        });
      if (!followUp) {
        return NextResponse.json(
          { error: "Analysis not found or update failed" },
          { status: 404 },
        );
      }
    }

    const updated =
      Object.keys(allowedUpdates).length > 0
        ? await (async () => {
            const entity = await jobMatchAnalysisModule
              .bindRequest(supabase)
              .updateJobMatchAnalysisJobUrl.execute({
                id,
                userId: user.id,
                jobUrl: allowedUpdates.job_url ?? null,
              });
            return entity ? presentJobMatchAnalysis(entity) : null;
          })()
        : await (async () => {
            const entity = await jobMatchAnalysisModule
              .bindRequest(supabase)
              .getJobMatchAnalysisById.execute({ id, userId: user.id });
            return entity ? presentJobMatchAnalysis(entity) : null;
          })();

    existing = updated;
    if (!existing) {
      return NextResponse.json(
        { error: "Analysis not found or update failed" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...existing,
      ...(followUpUpdates.status !== undefined
        ? { offer_status: followUpUpdates.status }
        : {}),
      ...(followUpUpdates.notes !== undefined
        ? { offer_notes: followUpUpdates.notes }
        : {}),
      ...(followUpUpdates.nextAction !== undefined
        ? { offer_next_action: followUpUpdates.nextAction }
        : {}),
      ...(followUpUpdates.nextActionAt !== undefined
        ? { offer_next_action_at: followUpUpdates.nextActionAt }
        : {}),
    });
  } catch (error: unknown) {
    console.error("Update job match analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to update job match analysis",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
