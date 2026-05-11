import { NextRequest, NextResponse } from "next/server";
import { createWorkJournalModule } from "@/modules/work-journal";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
import { getAuthedSupabase, normalizeOptionalText, normalizeRequiredText } from "../../validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = normalizeRequiredText(body.name);
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      updates.name = name;
    }
    if (body.role_or_label !== undefined) {
      const role = normalizeOptionalText(body.role_or_label);
      if (role === undefined) return NextResponse.json({ error: "Invalid label" }, { status: 400 });
      updates.role_or_label = role;
    }
    if (body.status !== undefined) {
      if (body.status !== "active" && body.status !== "archived") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.is_default !== undefined) updates.is_default = Boolean(body.is_default);

    const tracker = new SupabaseEventTracker();
    const mod = createWorkJournalModule(supabase, tracker);
    const context = await mod.updateContext.execute(id, user.id, updates);
    return NextResponse.json(context);
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
