import { NextRequest, NextResponse } from "next/server";
import { createCommitmentsModule, presentCommitmentItem } from "@/modules/commitments";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
import {
  getAuthedSupabase,
  optionalDate,
  optionalStringEnum,
  optionalText,
  requiredText,
} from "../../validation";

const statuses = ["todo", "in_progress", "done", "cancelled"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const title = body.title === undefined ? undefined : requiredText(body.title);
    const notes = optionalText(body.notes);
    const evidenceNotes = optionalText(body.evidenceNotes);
    const status = optionalStringEnum(body.status, statuses);
    const dueDate = optionalDate(body.dueDate);
    const completedAt = body.completedAt === undefined ? undefined : typeof body.completedAt === "string" || body.completedAt === null ? body.completedAt : undefined;
    const orderIndex = typeof body.orderIndex === "number" ? body.orderIndex : undefined;
    if (
      title === null ||
      (body.notes !== undefined && notes === undefined) ||
      (body.evidenceNotes !== undefined && evidenceNotes === undefined) ||
      (body.dueDate !== undefined && dueDate === undefined) ||
      (body.completedAt !== undefined && completedAt === undefined)
    ) {
      return NextResponse.json({ error: "Invalid commitment item payload" }, { status: 400 });
    }
    const mod = createCommitmentsModule(supabase, new SupabaseEventTracker());
    const item = await mod.updateItem.execute({
      userId: user.id,
      id,
      title,
      notes,
      evidenceNotes,
      status,
      dueDate,
      completedAt,
      orderIndex,
    });
    return NextResponse.json(presentCommitmentItem(item));
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
    await mod.deleteItem.execute({ userId: user.id, id });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
