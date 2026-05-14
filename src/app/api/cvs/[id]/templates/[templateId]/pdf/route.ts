import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  getCVTemplate,
  type CVTemplateId,
  type CVTemplateLocale,
} from "@/lib/cv-templates";
import { renderTemplatePDF } from "@/lib/cv-template-pdf";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument, presentCVStructuredProfile } from "@/modules/cv-library";
import { parseTemplatePdfRequest } from "../../../../validation";
import { notFound, handleApiError } from "@/modules/shared";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id, templateId } = await params;
    const template = getCVTemplate(templateId);
    if (!template) {
      throw notFound("Template not found");
    }

    const document = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = document ? presentCVDocument(document) : null;
    if (!cv) {
      throw notFound("CV not found");
    }

    const structuredDocument = await cvLibraryModule
      .bindRequest(supabase)
      .getCVStructuredProfile.execute({ cvDocumentId: id, userId: user.id });
    const structured = structuredDocument
      ? presentCVStructuredProfile(structuredDocument)
      : null;
    if (!structured) {
      throw notFound("Structured profile not found");
    }

    const parsed = parseTemplatePdfRequest(req.nextUrl.searchParams);
    const requestedLocale = parsed.value.locale;
    const locale = template.locales.includes(requestedLocale as CVTemplateLocale)
      ? (requestedLocale as CVTemplateLocale)
      : "es";

    const pdf = await renderTemplatePDF({
      profile: structured.profile,
      templateId: template.templateId as CVTemplateId,
      locale,
    });

    const filename = `${cv.name.replace(/[^a-zA-Z0-9_-]/g, "_")}-${template.templateId}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
