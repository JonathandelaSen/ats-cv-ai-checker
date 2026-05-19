import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getLatestRecommendationAnalysisForCV } from "@/lib/analysis-queries";
import {
  getCVTemplate,
  type CVTemplateId,
  type CVTemplateLocale,
} from "@/lib/cv-templates";
import { cvLibraryModule } from "@/lib/container";
import {
  presentCVDocument,
  presentCVStructuredProfile,
} from "@/modules/cv-library";
import { parseEditCVProfileRequest } from "../../../validation";
import { ok, errorResponse, notFound, badRequest, handleApiError } from "@/modules/shared";

export const maxDuration = 60;

function parseStringArray(value: string | null): string[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const body = await req.json();
    const parsed = parseEditCVProfileRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }

    const cvDocument = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = cvDocument ? presentCVDocument(cvDocument) : null;
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

    const template = getCVTemplate(parsed.value.templateId ?? cv.template_id ?? "");
    if (!template) {
      throw badRequest("Selecciona una plantilla antes de editar el CV.");
    }
    const requestedLocale = parsed.value.locale ?? cv.template_locale ?? "es";
    const selectedTemplateId = template.templateId satisfies CVTemplateId;
    const selectedLocale = template.locales.includes(
      requestedLocale as CVTemplateLocale,
    )
      ? (requestedLocale as CVTemplateLocale)
      : "es";
    const latestAnalysis = await getLatestRecommendationAnalysisForCV(
      supabase,
      id,
      user.id,
    );

    const recommendations = latestAnalysis
      ? [
          ...parseStringArray(latestAnalysis.ai_improvements),
          ...parseStringArray(latestAnalysis.missing_keywords).map(
            (keyword) =>
              `Consider adding or strengthening this missing keyword if it is truthful: ${keyword}`,
          ),
        ]
      : [];

    const editedProfile = await cvLibraryModule
      .bindRequest(supabase)
      .editCVProfileWithAI.execute({
        provider: parsed.value.provider,
        apiKey: parsed.value.apiKey,
        model: parsed.value.model,
        profile: structured.profile,
        instruction: parsed.value.instruction,
        templateId: selectedTemplateId,
        locale: selectedLocale,
        recommendations,
      });

    const profile = await cvLibraryModule
      .bindRequest(supabase)
      .upsertCVStructuredProfile.execute({
        userId: user.id,
        cvDocumentId: id,
        schemaVersion: structured.schema_version,
        sourceTextHash: structured.source_text_hash,
        aiModel: parsed.value.model,
        profile: editedProfile,
        requestId: `cv-profile-edit-${id}`,
      });

    return ok({ profile: presentCVStructuredProfile(profile) });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
