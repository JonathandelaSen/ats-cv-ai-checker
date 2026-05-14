import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  generatePublicCVId,
  normalizePublicCVSlug,
} from "@/modules/cv-library";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument } from "@/modules/cv-library";
import { parseUpdateCVDocumentRequest } from "../validation";
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

    return ok(presentCVDocument(cv));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const rawBody = await req.json();
    const parsed = parseUpdateCVDocumentRequest(rawBody);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    const body = parsed.value;

    if (
      body.public_enabled !== undefined ||
      body.public_slug !== undefined ||
      body.confirmPublicExposure !== undefined
    ) {
      const existingDocument = await cvLibraryModule
        .bindRequest(supabase)
        .getCVDocument.execute({ id, userId: user.id });
      const existing = existingDocument ? presentCVDocument(existingDocument) : null;
      if (!existing || existing.type !== "template") {
        throw notFound("Template CV not found");
      }

      const nextEnabled = body.public_enabled ?? existing.public_enabled;
      if (
        body.public_enabled === true &&
        !existing.public_enabled &&
        body.confirmPublicExposure !== true
      ) {
        throw badRequest("Debes confirmar que entiendes que el CV será público.");
      }

      const normalizedSlug = normalizePublicCVSlug(
        body.public_slug ?? existing.public_slug ?? existing.name
      );
      if (!normalizedSlug) {
        throw badRequest("Elige una URL pública válida.");
      }

      const updated = await cvLibraryModule
        .bindRequest(supabase)
        .updateCVDocumentPublicSettings.execute({
          id,
          userId: user.id,
          publicEnabled: nextEnabled,
          publicId: existing.public_id ?? generatePublicCVId(),
          publicSlug: normalizedSlug,
        });
      if (!updated) {
        throw notFound("Template CV not found");
      }
      return ok(presentCVDocument(updated));
    }

    if (body.profile || body.template_locale) {
      const updated = await cvLibraryModule
        .bindRequest(supabase)
        .updateTemplateCVDocumentProfile.execute({
          id,
          userId: user.id,
          ...(body.name?.trim() ? { name: body.name.trim() } : {}),
          ...(body.profile ? { profile: body.profile } : {}),
          ...(body.template_locale ? { templateLocale: body.template_locale } : {}),
        });
      if (!updated) {
        throw notFound("Template CV not found");
      }
      return ok(presentCVDocument(updated));
    }

    const trimmedName = body.name?.trim();
    if (!trimmedName) {
      throw badRequest("Name is required");
    }

    const cv = await cvLibraryModule
      .bindRequest(supabase)
      .updateCVDocumentName.execute({ id, userId: user.id, name: trimmedName });
    if (!cv) {
      throw notFound("CV not found");
    }

    return ok(presentCVDocument(cv));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const result = await cvLibraryModule
      .bindRequest(supabase)
      .deleteCVDocument.execute({ id, userId: user.id });
    if (result.status === "not_found") {
      throw notFound("CV not found");
    }
    if (result.status === "in_use") {
      return NextResponse.json(
        {
          error: "No puedes borrar un CV con análisis asociados.",
          analyses: result.analyses,
        },
        { status: 409 }
      );
    }

    return ok({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
