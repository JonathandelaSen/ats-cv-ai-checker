import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentOutcome } from "@/modules/commitments";
import { ok, errorResponse, handleApiError } from "@/modules/shared";
import { parseUpdateCommitmentOutcomeRequest } from "../../validation";
import {
  toCommitmentOutcomeResponse,
  type CommitmentOutcomeResponse,
  type DeleteCommitmentResponse,
} from "../../responses";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = await req.json();
    const parsed = parseUpdateCommitmentOutcomeRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    commitmentsModule.bindRequest(supabase);
    const outcome = await commitmentsModule.updateOutcome.execute({
      userId: user.id,
      id,
      ...parsed.value,
    });
    return ok(
      toCommitmentOutcomeResponse(
        presentCommitmentOutcome(outcome)
      ) satisfies CommitmentOutcomeResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    commitmentsModule.bindRequest(supabase);
    await commitmentsModule.deleteOutcome.execute({ userId: user.id, id });
    return ok({ ok: true } satisfies DeleteCommitmentResponse);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
