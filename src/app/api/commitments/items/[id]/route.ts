import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentItem } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import { parseUpdateCommitmentItemRequest } from "../../validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = await req.json();
    const parsed = parseUpdateCommitmentItemRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    commitmentsModule.bindRequest(supabase);
    const item = await commitmentsModule.updateItem.execute({
      userId: user.id,
      id,
      ...parsed.value,
    });
    return NextResponse.json(presentCommitmentItem(item));
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
    await commitmentsModule.deleteItem.execute({ userId: user.id, id });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
