import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { cvAnalysisModule, jobMatchAnalysisModule } from "@/lib/container";
import { presentCVAnalysis } from "@/modules/cv-analysis";
import { presentJobMatchAnalysis } from "@/modules/job-match-analysis";
import { CV_PDFS_BUCKET } from "@/modules/cv-library";

export async function GET(
  req: NextRequest,
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
    const cvEntity = await cvAnalysisModule
      .bindRequest(supabase)
      .getCVAnalysisById.execute({ id, userId: user.id });
    const jobEntity = cvEntity
      ? null
      : await jobMatchAnalysisModule
          .bindRequest(supabase)
          .getJobMatchAnalysisById.execute({ id, userId: user.id });
    const analysis = cvEntity
      ? presentCVAnalysis(cvEntity)
      : jobEntity
        ? presentJobMatchAnalysis(jobEntity)
        : null;

    if (!analysis || !analysis.pdf_storage_path) {
      return NextResponse.json({ error: "PDF no encontrado" }, { status: 404 });
    }

    const { data, error } = await supabase.storage
      .from(CV_PDFS_BUCKET)
      .download(analysis.pdf_storage_path);

    if (error || !data) {
      return NextResponse.json({ error: "PDF no encontrado" }, { status: 404 });
    }

    const disposition = req.nextUrl.searchParams.get("download")
      ? "attachment"
      : "inline";

    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(analysis.filename)}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Download PDF error:", error);
    return NextResponse.json(
      { error: "Error descargando el PDF", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
