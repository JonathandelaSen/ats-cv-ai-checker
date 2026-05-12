import { NextRequest, NextResponse } from "next/server";
import { createCommitmentsModule, presentCommitmentContext } from "@/modules/commitments";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
import {
  getAuthedSupabase,
  optionalStringEnum,
  optionalText,
  requiredText,
} from "../../validation";

const types = ["employment", "project", "personal", "other"] as const;
const statuses = ["active", "archived"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const type = optionalStringEnum(body.type, types);
    const name = body.name === undefined ? undefined : requiredText(body.name);
    const roleOrLabel = optionalText(body.roleOrLabel);
    const status = optionalStringEnum(body.status, statuses);
    if (name === null || roleOrLabel === undefined) {
      return NextResponse.json({ error: "Invalid commitment context payload" }, { status: 400 });
    }
    const mod = createCommitmentsModule(supabase, new SupabaseEventTracker());
    const context = await mod.updateContext.execute({
      userId: user.id,
      id,
      type,
      name,
      roleOrLabel,
      status,
    });
    return NextResponse.json(presentCommitmentContext(context));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
