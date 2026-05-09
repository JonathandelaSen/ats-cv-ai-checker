import { NextRequest, NextResponse } from "next/server";
import {
  deleteCV,
  getCV,
  updateCVName,
  updateCVProfile,
  updateCVPublicSettings,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import {
  generatePublicCVId,
  normalizePublicCVSlug,
  type PublicCVSettingsRequest,
} from "@/lib/public-cv";
import { createClient } from "@/lib/supabase/server";

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
    const cv = await getCV(supabase, id, user.id);
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    return NextResponse.json(cv);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      const existing = await getCV(supabase, id, user.id);
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

      const updated = await updateCVPublicSettings(supabase, id, user.id, {
        public_enabled: nextEnabled,
        public_id: existing.public_id ?? generatePublicCVId(),
        public_slug: normalizedSlug,
      });
      if (!updated) {
        return NextResponse.json({ error: "Template CV not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    if (body.profile || body.template_locale) {
      const updated = await updateCVProfile(supabase, id, user.id, {
        ...(body.name?.trim() ? { name: body.name.trim() } : {}),
        ...(body.profile ? { profile: body.profile as never } : {}),
        ...(body.template_locale ? { template_locale: body.template_locale } : {}),
      });
      if (!updated) {
        return NextResponse.json({ error: "Template CV not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    const trimmedName = body.name?.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const cv = await updateCVName(supabase, id, user.id, trimmedName);
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    return NextResponse.json(cv);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await deleteCV(supabase, id, user.id);
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
