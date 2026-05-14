import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { cvLibraryModule } from "@/lib/container";
import { CV_PDFS_BUCKET, presentCVDocument } from "@/modules/cv-library";
import { parseTemplatePdfRequest } from "../../validation";
import { notFound, handleApiError } from "@/modules/shared";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const document = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = document ? presentCVDocument(document) : null;

    if (cv?.type === "template") {
      const targetUrl = new URL(`/api/cvs/${id}/template-pdf`, req.url);
      const parsedPdfRequest = parseTemplatePdfRequest(req.nextUrl.searchParams);
      if (parsedPdfRequest.value.download) {
        targetUrl.searchParams.set("download", "1");
      }
      return NextResponse.redirect(targetUrl);
    }

    if (!cv?.pdf_storage_path) {
      throw notFound("PDF no encontrado");
    }

    const { data, error } = await supabase.storage
      .from(CV_PDFS_BUCKET)
      .download(cv.pdf_storage_path);

    if (error || !data) {
      throw notFound("PDF no encontrado");
    }

    const parsedPdfRequest = parseTemplatePdfRequest(req.nextUrl.searchParams);
    const disposition = parsedPdfRequest.value.download
      ? "attachment"
      : "inline";

    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(cv.filename ?? "cv.pdf")}"`,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
