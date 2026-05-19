import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getLatestRecommendationAnalysisForCV } from "@/lib/analysis-queries";
import type { CVTemplateId, CVTemplateLocale } from "@/lib/cv-templates";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument } from "@/modules/cv-library";
import { parseEditCVProfileRequest } from "../../validation";
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

    const document = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = document ? presentCVDocument(document) : null;
    if (!cv || cv.type !== "template") {
      throw notFound("Template CV not found");
    }
    if (!cv.profile) {
      throw badRequest("CV has no profile");
    }

    const sourceCvId = cv.source_cv_id;
    const latestAnalysis = sourceCvId
      ? await getLatestRecommendationAnalysisForCV(
          supabase,
          sourceCvId,
          user.id,
        )
      : null;
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
        profile: cv.profile,
        instruction: parsed.value.instruction,
        templateId: (cv.template_id ?? "compact") as CVTemplateId,
        locale: (cv.template_locale ?? "es") as CVTemplateLocale,
        recommendations,
      });

    const updated = await cvLibraryModule
      .bindRequest(supabase)
      .updateTemplateCVDocumentProfile.execute({
        id,
        userId: user.id,
        aiModel: parsed.value.model,
        profile: editedProfile,
      });

    return ok({
      version: updated ? presentCVDocument(updated) : null,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
