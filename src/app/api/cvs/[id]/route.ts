import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import {
  generatePublicCVId,
  normalizePublicCVSlug,
  type PublicCVSettingsRequest,
} from "@/modules/cv-library";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument } from "@/modules/cv-library";

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

    return NextResponse.json(presentCVDocument(cv));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
    const body = (await req.json()) as {
      name?: string;
      profile?: Record<string, unknown>;
      template_locale?: string;
    } & PublicCVSettingsRequest;

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
        return NextResponse.json({ error: "Template CV not found" }, { status: 404 });
      }

      const nextEnabled = body.public_enabled ?? existing.public_enabled;
      if (
        body.public_enabled === true &&
        !existing.public_enabled &&
        body.confirmPublicExposure !== true
      ) {
        return NextResponse.json(
          { error: "Debes confirmar que entiendes que el CV será público." },
          { status: 400 }
        );
      }

      const normalizedSlug = normalizePublicCVSlug(
        body.public_slug ?? existing.public_slug ?? existing.name
      );
      if (!normalizedSlug) {
        return NextResponse.json(
          { error: "Elige una URL pública válida." },
          { status: 400 }
        );
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
        return NextResponse.json({ error: "Template CV not found" }, { status: 404 });
      }
      return NextResponse.json(presentCVDocument(updated));
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
        return NextResponse.json({ error: "Template CV not found" }, { status: 404 });
      }
      return NextResponse.json(presentCVDocument(updated));
    }

    const trimmedName = body.name?.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const cv = await cvLibraryModule
      .bindRequest(supabase)
      .updateCVDocumentName.execute({ id, userId: user.id, name: trimmedName });
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    return NextResponse.json(presentCVDocument(cv));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
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

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
