import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitment } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import {
  optionalDate,
  optionalStringEnum,
  optionalText,
  requiredText,
} from "../validation";

const sources = ["manager", "self", "company", "project", "other"] as const;
const statuses = ["active", "paused", "achieved", "missed", "cancelled"] as const;
const priorities = ["low", "medium", "high"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const contextId = body.contextId === undefined ? undefined : requiredText(body.contextId);
    const title = body.title === undefined ? undefined : requiredText(body.title);
    const description = optionalText(body.description);
    const successCriteria = optionalText(body.successCriteria);
    const resultNotes = optionalText(body.resultNotes);
    const source = optionalStringEnum(body.source, sources);
    const status = optionalStringEnum(body.status, statuses);
    const priority = body.priority === null ? null : optionalStringEnum(body.priority, priorities);
    const startDate = optionalDate(body.startDate);
    const targetDate = optionalDate(body.targetDate);
    if (
      contextId === null ||
      title === null ||
      (body.description !== undefined && description === undefined) ||
      (body.successCriteria !== undefined && successCriteria === undefined) ||
      (body.resultNotes !== undefined && resultNotes === undefined) ||
      (body.startDate !== undefined && startDate === undefined) ||
      (body.targetDate !== undefined && targetDate === undefined)
    ) {
      return NextResponse.json({ error: "Invalid commitment payload" }, { status: 400 });
    }
    commitmentsModule.bindRequest(supabase);
    const commitment = await commitmentsModule.updateCommitment.execute({
      userId: user.id,
      id,
      contextId: contextId ?? undefined,
      title: title ?? undefined,
      description,
      successCriteria,
      resultNotes,
      source,
      status,
      priority,
      startDate: startDate ?? undefined,
      targetDate,
    });
    return NextResponse.json(presentCommitment(commitment));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    commitmentsModule.bindRequest(supabase);
    await commitmentsModule.deleteCommitment.execute({ userId: user.id, id });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
