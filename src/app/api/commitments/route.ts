import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { activityContextsModule, commitmentsModule } from "@/lib/container";
import { presentCommitment,
  presentCommitmentsWorkspace } from "@/modules/commitments";
import { presentActivityContext } from "@/modules/activity-context";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import { parseCreateCommitmentRequest } from "./validation";
import {
  toCommitmentResponse,
  toCommitmentContextResponse,
  toCommitmentsWorkspaceResponse,
  type CommitmentResponse,
  type CommitmentsWorkspaceResponse,
} from "./responses";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    commitmentsModule.bindRequest(supabase);
    activityContextsModule.bindRequest(supabase);
    const [workspace, contexts] = await Promise.all([
      commitmentsModule.listWorkspace.execute(user.id),
      activityContextsModule.listActivityContexts.execute(user.id),
    ]);
    const presentedWorkspace = presentCommitmentsWorkspace(workspace);
    return ok({
      contexts: contexts.map((context) =>
        toCommitmentContextResponse({
          ...presentActivityContext(context),
          roleOrLabel: null,
        })
      ),
      commitments: toCommitmentsWorkspaceResponse(presentedWorkspace).commitments,
    } satisfies CommitmentsWorkspaceResponse);
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
    activityContextsModule.bindRequest(supabase);
    const commitment = await commitmentsModule.createCommitment.execute({
      userId: user.id,
      ...parsed.value,
      startDate: parsed.value.startDate ?? undefined,
    });
    return created(
      toCommitmentResponse(presentCommitment(commitment)) satisfies CommitmentResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
