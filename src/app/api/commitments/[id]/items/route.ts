import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentItem } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import { parseCreateCommitmentItemRequest } from "../../validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = await req.json();
    const parsed = parseCreateCommitmentItemRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    commitmentsModule.bindRequest(supabase);
    const item = await commitmentsModule.createItem.execute({
      userId: user.id,
      commitmentId: id,
      ...parsed.value,
    });
    return NextResponse.json(presentCommitmentItem(item), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
