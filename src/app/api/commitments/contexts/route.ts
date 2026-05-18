import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentContext } from "@/modules/commitments";
import { created, errorResponse, handleApiError } from "@/modules/shared";
import { parseCreateCommitmentContextRequest } from "../validation";
import {
  toCommitmentContextResponse,
  type CommitmentContextResponse,
} from "../responses";

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const body = await req.json();
    const parsed = parseCreateCommitmentContextRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    commitmentsModule.bindRequest(supabase);
    const context = await commitmentsModule.createContext.execute({ userId: user.id, ...parsed.value });
    return created(
      toCommitmentContextResponse(
        presentCommitmentContext(context)
      ) satisfies CommitmentContextResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
