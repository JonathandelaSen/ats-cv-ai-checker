import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import { cvAnalysisModule } from "@/lib/container";
import { presentCVAnalysis } from "@/modules/cv-analysis";

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
      return NextResponse.json(
        { error: "CV analysis not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(presentCVAnalysis(analysis));
  } catch (error: unknown) {
    console.error("Get CV analysis error:", error);
    return NextResponse.json(
      { error: "Failed to get CV analysis", details: getErrorMessage(error) },
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
    const deleted = await cvAnalysisModule
      .bindRequest(supabase)
      .deleteCVAnalysis.execute({ id, userId: user.id });
    if (!deleted) {
      return NextResponse.json(
        { error: "CV analysis not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete CV analysis error:", error);
    return NextResponse.json(
      { error: "Failed to delete CV analysis", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
