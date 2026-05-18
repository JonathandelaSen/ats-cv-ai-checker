import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import { presentWorkJournalContext } from "@/modules/work-journal";
import { ok, errorResponse, handleApiError } from "@/modules/shared";
import { parseUpdateWorkJournalContextRequest } from "../../validation";
import {
  toWorkJournalContextResponse,
  type UpdateWorkJournalContextResponse,
} from "../responses";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = await req.json();
    const parsed = parseUpdateWorkJournalContextRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    workJournalModule.bindRequest(supabase);
    const context = await workJournalModule.updateContext.execute(id, user.id, parsed.value);
    return ok(
      toWorkJournalContextResponse(
        presentWorkJournalContext(context)
      ) satisfies UpdateWorkJournalContextResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
