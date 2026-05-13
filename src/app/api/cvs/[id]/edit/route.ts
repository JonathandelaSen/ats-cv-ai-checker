import { NextRequest, NextResponse } from "next/server";
import { getLatestRecommendationAnalysisForCVFacade } from "@/lib/analysis-facade";
import { editCVProfileWithAI } from "@/lib/ai-cv-editing";
import { getErrorMessage } from "@/lib/errors";
import type { CVTemplateId, CVTemplateLocale } from "@/lib/cv-templates";
import { createClient } from "@/lib/supabase/server";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument } from "@/modules/cv-library";

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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const {
      geminiApiKey,
      model = "gemini-3.1-pro-preview",
      instruction,
    } = (await req.json()) as {
      geminiApiKey?: string;
      model?: string;
      instruction?: string;
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

    const document = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = document ? presentCVDocument(document) : null;
    if (!cv || cv.type !== "template") {
      return NextResponse.json(
        { error: "Template CV not found" },
        { status: 404 },
      );
    }
    if (!cv.profile) {
      return NextResponse.json({ error: "CV has no profile" }, { status: 400 });
    }

    const sourceCvId = cv.source_cv_id;
    const latestAnalysis = sourceCvId
      ? await getLatestRecommendationAnalysisForCVFacade(
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

    const editedProfile = await editCVProfileWithAI({
      apiKey: geminiApiKey.trim(),
      model,
      profile: cv.profile,
      instruction: instruction.trim(),
      templateId: (cv.template_id ?? "compact") as CVTemplateId,
      locale: (cv.template_locale ?? "es") as CVTemplateLocale,
      recommendations,
    });

    const updated = await cvLibraryModule
      .bindRequest(supabase)
      .updateTemplateCVDocumentProfile.execute({
        id,
        userId: user.id,
        aiModel: model,
        profile: editedProfile,
      });

    return NextResponse.json({
      version: updated ? presentCVDocument(updated) : null,
    });
  } catch (error: unknown) {
    console.error("CV edit error:", error);
    return NextResponse.json(
      { error: "Failed to edit CV", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
