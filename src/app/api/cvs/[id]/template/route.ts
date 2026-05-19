import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getBestCVText, getCVSourceTextHash } from "@/lib/cv-profile";
import {
  getCVTemplate,
  type CVTemplateLocale,
} from "@/lib/cv-templates";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument, presentCVStructuredProfile } from "@/modules/cv-library";
import { parseTemplateCVRequest } from "../../validation";
import { ok, errorResponse, notFound, badRequest, handleApiError } from "@/modules/shared";

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
    const parsed = parseTemplateCVRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    const { templateId, locale, ai } = parsed.value;

    const template = templateId ? getCVTemplate(templateId) : null;
    if (!template) {
      throw notFound("Template not found");
    }

    const selectedLocale = template.locales.includes(locale as CVTemplateLocale)
      ? (locale as CVTemplateLocale)
      : "es";

    const document = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = document ? presentCVDocument(document) : null;
    if (!cv) {
      throw notFound("CV not found");
    }

    let profile = null;

    if (cv.type === "template" && cv.profile) {
      profile = {
        id: "template-profile-" + cv.id,
        user_id: user.id,
        cv_id: cv.id,
        schema_version: cv.schema_version ?? "",
        source_text_hash: cv.source_text_hash ?? "",
        ai_model: cv.ai_model ?? "",
        profile: cv.profile,
        created_at: cv.created_at,
        updated_at: cv.updated_at,
      };
    } else {
      const structuredDocument = await cvLibraryModule
        .bindRequest(supabase)
        .getCVStructuredProfile.execute({ cvDocumentId: id, userId: user.id });
      profile = structuredDocument
        ? presentCVStructuredProfile(structuredDocument)
        : null;
    }

    if (!profile) {
      if (!ai) {
        throw badRequest(
          "Configura tu proveedor de IA antes de preparar este CV para plantillas.",
        );
      }

      const text = getBestCVText(cv);
      if (!text) {
        throw badRequest("No extracted text available for this CV");
      }

      const structured = await cvLibraryModule
        .bindRequest(supabase)
        .structureCVProfileWithAI.execute({
          provider: ai.provider,
          apiKey: ai.apiKey,
          model: ai.model,
          text,
        });
      const savedProfile = await cvLibraryModule
        .bindRequest(supabase)
        .upsertCVStructuredProfile.execute({
        userId: user.id,
        cvDocumentId: id,
        schemaVersion: structured.schemaVersion,
        sourceTextHash: getCVSourceTextHash(text),
        aiModel: ai.model,
        profile: structured.profile,
        requestId: `cv-template-profile-${id}`,
      });
      profile = presentCVStructuredProfile(savedProfile);
    }

    const templateCV = await cvLibraryModule
      .bindRequest(supabase)
      .createTemplateCVDocument.execute({
      userId: user.id,
      sourceCvId: id,
      name: `${cv.name} · ${template.name}`,
      templateId: template.templateId,
      templateLocale: selectedLocale,
      schemaVersion: profile.schema_version,
      sourceTextHash: profile.source_text_hash,
      aiModel: profile.ai_model,
      profile: profile.profile,
      requestId: `cv-template-${id}`,
    });

    return ok({ version: presentCVDocument(templateCV), profile });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
