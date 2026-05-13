import { NextRequest, NextResponse } from "next/server";
import { getCVTemplate, type CVTemplateId, type CVTemplateLocale } from "@/lib/cv-templates";
import { renderTemplatePDF } from "@/lib/cv-template-pdf";
import { getErrorMessage } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument } from "@/modules/cv-library";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string; slug: string }> }
) {
  try {
    const { publicId, slug } = await params;
    const supabase = createAdminClient();
    const document = await cvLibraryModule
      .bindRequest(supabase)
      .getPublishedCVDocument.execute({ publicId });
    const cv = document ? presentCVDocument(document) : null;

    if (!cv?.profile || !cv.template_id || !cv.public_id || !cv.public_slug) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    if (slug !== cv.public_slug) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const template = getCVTemplate(cv.template_id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const locale = template.locales.includes(cv.template_locale as CVTemplateLocale)
      ? (cv.template_locale as CVTemplateLocale)
      : "es";
    const pdf = await renderTemplatePDF({
      profile: cv.profile,
      templateId: template.templateId as CVTemplateId,
      locale,
    });
    const filename = `${cv.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Public CV PDF error:", error);
    return NextResponse.json(
      { error: "Error exporting public CV PDF", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
