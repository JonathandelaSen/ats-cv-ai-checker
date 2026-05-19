import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getBestCVText, getCVSourceTextHash } from "@/lib/cv-profile";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument, presentCVStructuredProfile } from "@/modules/cv-library";
import { parseStructureCVProfileRequest } from "../../validation";
import { ok, errorResponse, notFound, badRequest, handleApiError } from "@/modules/shared";

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
      throw notFound("CV not found");
    }

    const profile = await cvLibraryModule
      .bindRequest(supabase)
      .getCVStructuredProfile.execute({ cvDocumentId: id, userId: user.id });
    return ok({
      profile: profile ? presentCVStructuredProfile(profile) : null,
    });
  } catch (error: unknown) {
    return handleApiError(error);
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
      return errorResponse(parsed.error);
    }

    const cvDocument = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const cv = cvDocument ? presentCVDocument(cvDocument) : null;
    if (!cv) {
      throw notFound("CV not found");
    }

    const text = getBestCVText(cv);
    if (!text) {
      throw badRequest("No extracted text available for this CV");
    }

    const sourceTextHash = getCVSourceTextHash(text);
    const existing = await cvLibraryModule
      .bindRequest(supabase)
      .getCVStructuredProfile.execute({ cvDocumentId: id, userId: user.id });
    const existingResponse = existing ? presentCVStructuredProfile(existing) : null;
    if (existingResponse && existingResponse.source_text_hash === sourceTextHash && !parsed.value.force) {
      return ok({ profile: existingResponse, cached: true });
    }

    const structured = await cvLibraryModule
      .bindRequest(supabase)
      .structureCVProfileWithAI.execute({
        provider: parsed.value.provider,
        apiKey: parsed.value.apiKey,
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

    return ok({ profile: presentCVStructuredProfile(profile), cached: false });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
