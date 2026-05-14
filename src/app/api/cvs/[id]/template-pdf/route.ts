import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import { getCVTemplate, type CVTemplateId, type CVTemplateLocale } from "@/lib/cv-templates";
import { renderTemplatePDF } from "@/lib/cv-template-pdf";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument } from "@/modules/cv-library";

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
    if (!cv || cv.type !== "template") {
      return NextResponse.json({ error: "Template CV not found" }, { status: 404 });
    }
    if (!cv.profile || !cv.template_id) {
      return NextResponse.json({ error: "CV has no profile or template" }, { status: 400 });
    }

    const template = getCVTemplate(cv.template_id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const pdf = await renderTemplatePDF({
      profile: cv.profile,
      templateId: template.templateId as CVTemplateId,
      locale: (cv.template_locale ?? "es") as CVTemplateLocale,
    });

    const filename = `${cv.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    const disposition = req.nextUrl.searchParams.get("download")
      ? "attachment"
      : "inline";

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Template PDF error:", error);
    return NextResponse.json(
      { error: "Error exporting template PDF", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
