import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentContext } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import { parseUpdateCommitmentContextRequest } from "../../validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = await req.json();
    const parsed = parseUpdateCommitmentContextRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    commitmentsModule.bindRequest(supabase);
    const context = await commitmentsModule.updateContext.execute({
      userId: user.id,
      id,
      ...parsed.value,
    });
    return NextResponse.json(presentCommitmentContext(context));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
