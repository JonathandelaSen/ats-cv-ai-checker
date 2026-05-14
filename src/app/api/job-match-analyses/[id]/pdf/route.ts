import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { jobMatchAnalysisModule } from "@/lib/container";
import { downloadAnalysisPdf } from "../../../_services/download-analysis-pdf.service";
import { notFound } from "@/modules/shared";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authContext = await getAuthenticatedRequestContext();
  if (!authContext.ok) return authContext.response;
  const { supabase, user } = authContext;

  const { id } = await params;
  const analysis = await jobMatchAnalysisModule
    .bindRequest(supabase)
    .getJobMatchAnalysisById.execute({ id, userId: user.id });
  if (!analysis) {
    throw notFound("PDF no encontrado");
  }

  const primitives = analysis.toPrimitives();
  return downloadAnalysisPdf(req, {
    supabase,
    filename: primitives.filename,
    pdfStoragePath: primitives.pdfStoragePath,
  });
}
