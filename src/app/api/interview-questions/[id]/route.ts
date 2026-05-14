import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  parseUpdateInterviewQuestionRequest,
  validateQuestionLinks,
} from "../validation";
import { selectionProcessModule } from "@/lib/container";
import { presentProcessQuestion } from "@/modules/selection-process";
import { ok, errorResponse, notFound, handleApiError } from "@/modules/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const question = await selectionProcessModule
      .bindRequest(supabase)
      .getProcessQuestion.execute({ id, userId: user.id });
    if (!question) {
      throw notFound("Question not found");
    }

    return ok(presentProcessQuestion(question));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

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
    const parsed = parseUpdateInterviewQuestionRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    const updates = parsed.value;

    if (
      updates.legacyCvId !== undefined ||
      updates.sourceJobMatchAnalysisId !== undefined
    ) {
      const existingReadModel = await selectionProcessModule
        .bindRequest(supabase)
        .getProcessQuestion.execute({ id, userId: user.id });
      const existing = existingReadModel ? presentProcessQuestion(existingReadModel) : null;
      if (!existing) {
        throw notFound("Question not found");
      }
      const links = await validateQuestionLinks(supabase, user.id, {
        cv_id: updates.legacyCvId === undefined ? existing.cv_id : updates.legacyCvId,
        analysis_id:
          updates.sourceJobMatchAnalysisId === undefined
            ? existing.analysis_id
            : updates.sourceJobMatchAnalysisId,
      });
      if (!links.ok) return links.response;
    }

    const updated = await selectionProcessModule
      .bindRequest(supabase)
      .updateProcessQuestion.execute({
      id,
      userId: user.id,
      ...updates,
    });
    if (!updated) {
      throw notFound("Question not found");
    }

    return ok(presentProcessQuestion(updated));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const deleted = await selectionProcessModule
      .bindRequest(supabase)
      .deleteProcessQuestion.execute({ id, userId: user.id });
    if (!deleted) {
      throw notFound("Question not found");
    }

    return ok({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
