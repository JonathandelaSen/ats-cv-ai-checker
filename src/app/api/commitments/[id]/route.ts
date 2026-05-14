import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitment } from "@/modules/commitments";
import { ok, errorResponse, handleApiError } from "@/modules/shared";
import { parseUpdateCommitmentRequest } from "../validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = await req.json();
    const parsed = parseUpdateCommitmentRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    commitmentsModule.bindRequest(supabase);
    const commitment = await commitmentsModule.updateCommitment.execute({
      userId: user.id,
      id,
      ...parsed.value,
    });
    return ok(presentCommitment(commitment));
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
    await commitmentsModule.deleteCommitment.execute({ userId: user.id, id });
    return ok({ ok: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
