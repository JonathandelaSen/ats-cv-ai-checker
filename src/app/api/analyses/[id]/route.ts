import { NextRequest, NextResponse } from "next/server";
import {
  OFFER_STATUSES,
  deleteAnalysis,
  updateAnalysis,
  type OfferStatus,
} from "@/lib/db";
import { getAnalysisFacade } from "@/lib/analysis-facade";
import { getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { selectionProcessModule } from "@/lib/container";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const analysis = await getAnalysisFacade(supabase, id, user.id);
    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Get analysis error:", error);
    return NextResponse.json(
      { error: "Failed to get analysis", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteAnalysis(supabase, id, user.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete analysis error:", error);
    return NextResponse.json(
      { error: "Failed to delete analysis", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = (await req.json()) as Record<string, unknown>;

    const normalizeOptionalText = (value: unknown) => {
      if (value === null) return null;
      if (typeof value !== "string") return undefined;
      return value.trim() || null;
    };

    const normalizeOptionalDate = (value: unknown) => {
      const normalized = normalizeOptionalText(value);
      if (normalized === null || normalized === undefined) return normalized;

      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    };

    const allowedUpdates: Parameters<typeof updateAnalysis>[3] = {};
    const followUpUpdates: {
      status?: OfferStatus;
      notes?: string | null;
      nextAction?: string | null;
      nextActionAt?: string | null;
    } = {};

    if (data.job_url !== undefined) {
      const jobUrl = normalizeOptionalText(data.job_url);
      if (jobUrl === undefined) {
        return NextResponse.json(
          { error: "Invalid job URL" },
          { status: 400 }
        );
      }
      allowedUpdates.job_url = jobUrl;
    }

    if (data.offer_status !== undefined) {
      if (
        typeof data.offer_status !== "string" ||
        !OFFER_STATUSES.includes(data.offer_status as OfferStatus)
      ) {
        return NextResponse.json(
          { error: "Invalid offer status" },
          { status: 400 }
        );
      }
      followUpUpdates.status = data.offer_status as OfferStatus;
    }

    if (data.offer_notes !== undefined) {
      const offerNotes = normalizeOptionalText(data.offer_notes);
      if (offerNotes === undefined) {
        return NextResponse.json(
          { error: "Invalid offer notes" },
          { status: 400 }
        );
      }
      followUpUpdates.notes = offerNotes;
    }

    if (data.offer_next_action !== undefined) {
      const nextAction = normalizeOptionalText(data.offer_next_action);
      if (nextAction === undefined) {
        return NextResponse.json(
          { error: "Invalid offer next action" },
          { status: 400 }
        );
      }
      followUpUpdates.nextAction = nextAction;
    }

    if (data.offer_next_action_at !== undefined) {
      const nextActionAt = normalizeOptionalDate(data.offer_next_action_at);
      if (nextActionAt === undefined) {
        return NextResponse.json(
          { error: "Invalid offer next action date" },
          { status: 400 }
        );
      }
      followUpUpdates.nextActionAt = nextActionAt;
    }

    const includesOfferTracking =
      followUpUpdates.status !== undefined ||
      followUpUpdates.notes !== undefined ||
      followUpUpdates.nextAction !== undefined ||
      followUpUpdates.nextActionAt !== undefined;

    if (Object.keys(allowedUpdates).length === 0 && !includesOfferTracking) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    let existing = null;
    if (includesOfferTracking) {
      existing = await getAnalysisFacade(supabase, id, user.id);
      if (!existing) {
        return NextResponse.json(
          { error: "Analysis not found or update failed" },
          { status: 404 }
        );
      }
      if (existing.analysis_mode !== "job_match") {
        return NextResponse.json(
          { error: "Offer tracking is only available for job match analyses" },
          { status: 400 }
        );
      }
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
          { status: 404 }
        );
      }
    }

    const updated =
      Object.keys(allowedUpdates).length > 0
        ? await updateAnalysis(supabase, id, user.id, allowedUpdates)
        : existing;
    if (!updated) {
      return NextResponse.json(
        { error: "Analysis not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updated,
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
    console.error("Update analysis error:", error);
    return NextResponse.json(
      { error: "Failed to update analysis", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
