import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getBestCVText, getCVSourceTextHash } from "@/lib/cv-profile";
import { createClient } from "@/lib/supabase/server";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument, presentCVStructuredProfile } from "@/modules/cv-library";

async function getAuthedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cv = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const profile = await cvLibraryModule
      .bindRequest(supabase)
      .getCVStructuredProfile.execute({ cvDocumentId: id, userId: user.id });
    return NextResponse.json({
      profile: profile ? presentCVStructuredProfile(profile) : null,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const {
      geminiApiKey,
      model = "gemini-3.1-pro-preview",
      force = false,
    } = (await req.json()) as {
      geminiApiKey?: string;
      model?: string;
      force?: boolean;
    };

    if (!geminiApiKey?.trim()) {
      return NextResponse.json(
        {
          error:
            "Configura tu API key de Gemini en Configuración antes de estructurar el CV.",
        },
        { status: 400 }
      );
    }

    const cvDocument = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = cvDocument ? presentCVDocument(cvDocument) : null;
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const text = getBestCVText(cv);
    if (!text) {
      return NextResponse.json(
        { error: "No extracted text available for this CV" },
        { status: 400 }
      );
    }

    const sourceTextHash = getCVSourceTextHash(text);
    const existing = await cvLibraryModule
      .bindRequest(supabase)
      .getCVStructuredProfile.execute({ cvDocumentId: id, userId: user.id });
    const existingResponse = existing ? presentCVStructuredProfile(existing) : null;
    if (existingResponse && existingResponse.source_text_hash === sourceTextHash && !force) {
      return NextResponse.json({ profile: existingResponse, cached: true });
    }

    const structured = await cvLibraryModule
      .bindRequest(supabase)
      .structureCVProfileWithAI.execute({
        apiKey: geminiApiKey.trim(),
        model,
        text,
      });

    const profile = await cvLibraryModule
      .bindRequest(supabase)
      .upsertCVStructuredProfile.execute({
      userId: user.id,
      cvDocumentId: id,
      schemaVersion: structured.schemaVersion,
      sourceTextHash,
      aiModel: model,
      profile: structured.profile,
      requestId: `cv-profile-${id}`,
    });

    return NextResponse.json({ profile: presentCVStructuredProfile(profile), cached: false });
  } catch (error: unknown) {
    console.error("Structured profile error:", error);
    return NextResponse.json(
      {
        error: "Failed to structure CV profile",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
