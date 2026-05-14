import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentItem } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import {
  optionalDate,
  optionalStringEnum,
  optionalText,
  requiredText,
} from "../../validation";

const statuses = ["todo", "in_progress", "done", "cancelled"] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const title = requiredText(body.title);
    const notes = optionalText(body.notes);
    const evidenceNotes = optionalText(body.evidenceNotes);
    const status = optionalStringEnum(body.status, statuses);
    const dueDate = optionalDate(body.dueDate);
    const orderIndex = typeof body.orderIndex === "number" ? body.orderIndex : undefined;
    if (
      !title ||
      (body.notes !== undefined && notes === undefined) ||
      (body.evidenceNotes !== undefined && evidenceNotes === undefined) ||
      (body.dueDate !== undefined && dueDate === undefined)
    ) {
      return NextResponse.json({ error: "Invalid commitment item payload" }, { status: 400 });
    }
    commitmentsModule.bindRequest(supabase);
    const item = await commitmentsModule.createItem.execute({
      userId: user.id,
      commitmentId: id,
      title,
      notes,
      evidenceNotes,
      status,
      dueDate,
      orderIndex,
    });
    return NextResponse.json(presentCommitmentItem(item), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
