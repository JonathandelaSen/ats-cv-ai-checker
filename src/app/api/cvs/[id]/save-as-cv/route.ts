import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument } from "@/modules/cv-library";
import { parseSaveTemplateAsCVRequest } from "../../validation";
import { ok, errorResponse, notFound, handleApiError } from "@/modules/shared";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const body = await req.json();
    const parsed = parseSaveTemplateAsCVRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }

    const templateDocument = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const templateCV = templateDocument ? presentCVDocument(templateDocument) : null;
    if (!templateCV || templateCV.type !== "template" || !templateCV.profile) {
      throw notFound("Template CV not found");
    }

    const summaryText = templateCV.profile.summary || "";
    const expText = (templateCV.profile.experience || []).map(e => `${e.company} ${e.role}`).join(" ");

    const newCV = await cvLibraryModule
      .bindRequest(supabase)
      .createTemplateCVDocument.execute({
      userId: user.id,
      name: parsed.value.name,
      sourceCvId: templateCV.id,
      profile: templateCV.profile,
      filename: `version-${templateCV.template_id}.json`,
      templateId: templateCV.template_id ?? "",
      templateLocale: templateCV.template_locale ?? "es",
      schemaVersion: templateCV.schema_version ?? "",
      sourceTextHash: templateCV.source_text_hash ?? "",
      aiModel: templateCV.ai_model ?? "",
      textNode: `${summaryText} ${expText}`,
      requestId: `save-as-cv-${id}`,
    });

    const structured = await cvLibraryModule
      .bindRequest(supabase)
      .upsertCVStructuredProfile.execute({
      userId: user.id,
      cvDocumentId: newCV.id,
      sourceTextHash: templateCV.source_text_hash ?? "",
      aiModel: templateCV.ai_model ?? "",
      profile: templateCV.profile,
      requestId: `save-as-cv-profile-${id}`,
    });
    void structured;

    return ok({ cv: presentCVDocument(newCV) });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
