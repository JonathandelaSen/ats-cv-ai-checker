import { NextRequest, NextResponse } from "next/server";
import { createCommitmentsModule, presentCommitmentOutcome } from "@/modules/commitments";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
import {
  getAuthedSupabase,
  optionalNumber,
  optionalStringEnum,
  optionalText,
  requiredText,
} from "../../validation";

const types = ["promotion", "role_change", "leadership", "mentoring", "money", "recognition", "learning", "other"] as const;
const statuses = ["expected", "achieved", "missed", "changed"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const type = optionalStringEnum(body.type, types);
    const status = optionalStringEnum(body.status, statuses);
    const title = body.title === undefined ? undefined : requiredText(body.title);
    const description = optionalText(body.description);
    const amount = optionalNumber(body.amount);
    const currency = optionalText(body.currency);
    const decidedAt = body.decidedAt === undefined ? undefined : typeof body.decidedAt === "string" || body.decidedAt === null ? body.decidedAt : undefined;
    if (
      title === null ||
      (body.description !== undefined && description === undefined) ||
      (body.amount !== undefined && amount === undefined) ||
      (body.currency !== undefined && currency === undefined) ||
      (body.decidedAt !== undefined && decidedAt === undefined)
    ) {
      return NextResponse.json({ error: "Invalid commitment outcome payload" }, { status: 400 });
    }
    const mod = createCommitmentsModule(supabase, new SupabaseEventTracker());
    const outcome = await mod.updateOutcome.execute({
      userId: user.id,
      id,
      type,
      status,
      title,
      description,
      amount,
      currency,
      decidedAt,
    });
    return NextResponse.json(presentCommitmentOutcome(outcome));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const mod = createCommitmentsModule(supabase, new SupabaseEventTracker());
    await mod.deleteOutcome.execute({ userId: user.id, id });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
