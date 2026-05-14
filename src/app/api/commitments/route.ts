import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitment,
  presentCommitmentsWorkspace } from "@/modules/commitments";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import { parseCreateCommitmentRequest } from "./validation";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    commitmentsModule.bindRequest(supabase);
    const workspace = await commitmentsModule.listWorkspace.execute(user.id);
    return ok(presentCommitmentsWorkspace(workspace));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const body = await req.json();
    const parsed = parseCreateCommitmentRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    commitmentsModule.bindRequest(supabase);
    const commitment = await commitmentsModule.createCommitment.execute({
      userId: user.id,
      ...parsed.value,
      startDate: parsed.value.startDate ?? undefined,
    });
    return created(presentCommitment(commitment));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
