import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import { getBestCVText, getCVSourceTextHash } from "@/lib/cv-profile";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument, presentCVStructuredProfile } from "@/modules/cv-library";
import { parseStructureCVProfileRequest } from "../../validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

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
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const body = await req.json();
    const parsed = parseStructureCVProfileRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
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
    if (existingResponse && existingResponse.source_text_hash === sourceTextHash && !parsed.value.force) {
      return NextResponse.json({ profile: existingResponse, cached: true });
    }

    const structured = await cvLibraryModule
      .bindRequest(supabase)
      .structureCVProfileWithAI.execute({
        apiKey: parsed.value.geminiApiKey,
        model: parsed.value.model,
        text,
      });

    const profile = await cvLibraryModule
      .bindRequest(supabase)
      .upsertCVStructuredProfile.execute({
      userId: user.id,
      cvDocumentId: id,
      schemaVersion: structured.schemaVersion,
      sourceTextHash,
      aiModel: parsed.value.model,
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
