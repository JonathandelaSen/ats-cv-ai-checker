import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { cvAnalysisModule } from "@/lib/container";
import { downloadAnalysisPdf } from "../../../_services/download-analysis-pdf.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authContext = await getAuthenticatedRequestContext();
  if (!authContext.ok) return authContext.response;
  const { supabase, user } = authContext;

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
