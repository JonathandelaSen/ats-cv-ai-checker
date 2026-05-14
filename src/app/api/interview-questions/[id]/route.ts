import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import {
  parseUpdateInterviewQuestionRequest,
  validateQuestionLinks,
} from "../validation";
import { selectionProcessModule } from "@/lib/container";
import { presentProcessQuestion } from "@/modules/selection-process";

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
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(presentProcessQuestion(question));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
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
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(presentProcessQuestion(updated));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
