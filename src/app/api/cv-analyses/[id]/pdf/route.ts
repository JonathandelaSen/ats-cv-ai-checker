import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cvAnalysisModule } from "@/lib/container";
import { downloadAnalysisPdf } from "../../../_services/download-analysis-pdf.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const analysis = await cvAnalysisModule
    .bindRequest(supabase)
    .getCVAnalysisById.execute({ id, userId: user.id });
  if (!analysis) {
    return NextResponse.json({ error: "PDF no encontrado" }, { status: 404 });
  }

  const primitives = analysis.toPrimitives();
  return downloadAnalysisPdf(req, {
    supabase,
    filename: primitives.filename,
    pdfStoragePath: primitives.pdfStoragePath,
  });
}
