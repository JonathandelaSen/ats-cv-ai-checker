import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { cvAnalysisModule } from "@/lib/container";
import { presentCVAnalysis } from "@/modules/cv-analysis";

async function getAuthedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
