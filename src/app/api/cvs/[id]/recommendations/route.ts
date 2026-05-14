import { NextRequest, NextResponse } from "next/server";
import { getLatestRecommendationAnalysisForCV } from "@/lib/analysis-queries";
import { getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { cvLibraryModule } from "@/lib/container";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const cv = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const analysis = await getLatestRecommendationAnalysisForCV(
      supabase,
      id,
      user.id,
    );
    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
