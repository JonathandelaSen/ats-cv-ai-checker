import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getBestCVText, getCVSourceTextHash } from "@/lib/cv-profile";
import { getErrorMessage } from "@/lib/errors";
import {
  getCVTemplate,
  type CVTemplateLocale,
} from "@/lib/cv-templates";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument, presentCVStructuredProfile } from "@/modules/cv-library";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const {
      templateId,
      locale = "es",
      geminiApiKey,
      model = "gemini-3.1-pro-preview",
    } = (await req.json()) as {
      templateId?: string;
      locale?: string;
      geminiApiKey?: string;
      model?: string;
    };

    const template = templateId ? getCVTemplate(templateId) : null;
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const selectedLocale = template.locales.includes(locale as CVTemplateLocale)
      ? (locale as CVTemplateLocale)
      : "es";

    const document = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = document ? presentCVDocument(document) : null;
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
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
      if (!geminiApiKey?.trim()) {
        return NextResponse.json(
          {
            error:
              "Configura tu API key de Gemini antes de preparar este CV para plantillas.",
          },
          { status: 400 }
        );
      }

      const text = getBestCVText(cv);
      if (!text) {
        return NextResponse.json(
          { error: "No extracted text available for this CV" },
          { status: 400 }
        );
      }

      const structured = await cvLibraryModule
        .bindRequest(supabase)
        .structureCVProfileWithAI.execute({
          apiKey: geminiApiKey.trim(),
          model,
          text,
        });
      const savedProfile = await cvLibraryModule
        .bindRequest(supabase)
        .upsertCVStructuredProfile.execute({
        userId: user.id,
        cvDocumentId: id,
        schemaVersion: structured.schemaVersion,
        sourceTextHash: getCVSourceTextHash(text),
        aiModel: model,
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

    return NextResponse.json({ version: presentCVDocument(templateCV), profile });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Template selection error:", message, error);
    return NextResponse.json(
      {
        error: message || "Failed to select CV template",
        details: message,
      },
      { status: 500 }
    );
  }
}
