import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getLatestRecommendationAnalysisForCV } from "@/lib/analysis-queries";
import { getErrorMessage } from "@/lib/errors";
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
    const {
      geminiApiKey,
      model = "gemini-3.1-pro-preview",
      instruction,
      templateId,
      locale,
    } = (await req.json()) as {
      geminiApiKey?: string;
      model?: string;
      instruction?: string;
      templateId?: string;
      locale?: string;
    };

    if (!geminiApiKey?.trim()) {
      return NextResponse.json(
        { error: "Configura tu API key de Gemini antes de editar el CV." },
        { status: 400 },
      );
    }

    if (!instruction?.trim()) {
      return NextResponse.json(
        { error: "Escribe una instrucción para editar el CV." },
        { status: 400 },
      );
    }

    const cvDocument = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = cvDocument ? presentCVDocument(cvDocument) : null;
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const structuredDocument = await cvLibraryModule
      .bindRequest(supabase)
      .getCVStructuredProfile.execute({ cvDocumentId: id, userId: user.id });
    const structured = structuredDocument
      ? presentCVStructuredProfile(structuredDocument)
      : null;
    if (!structured) {
      return NextResponse.json(
        { error: "Structured profile not found" },
        { status: 404 },
      );
    }

    const template = getCVTemplate(templateId ?? cv.template_id ?? "");
    if (!template) {
      return NextResponse.json(
        { error: "Selecciona una plantilla antes de editar el CV." },
        { status: 400 },
      );
    }
    const requestedLocale = locale ?? cv.template_locale ?? "es";
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
        apiKey: geminiApiKey.trim(),
        model,
        profile: structured.profile,
        instruction: instruction.trim(),
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
        aiModel: model,
        profile: editedProfile,
        requestId: `cv-profile-edit-${id}`,
      });

    return NextResponse.json({ profile: presentCVStructuredProfile(profile) });
  } catch (error: unknown) {
    console.error("Structured profile edit error:", error);
    return NextResponse.json(
      {
        error: "Failed to edit CV profile",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
