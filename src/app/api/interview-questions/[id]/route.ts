import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeOptionalText,
  normalizeRequiredText,
  validateQuestionLinks,
} from "../validation";
import { selectionProcessModule } from "@/lib/container";
import { presentProcessQuestion } from "@/modules/selection-process";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = (await req.json()) as Record<string, unknown>;
    const updates: {
      question?: string;
      context?: string | null;
      answer?: string | null;
      legacyCvId?: string | null;
      sourceJobMatchAnalysisId?: string | null;
    } = {};

    if (data.question !== undefined) {
      const question = normalizeRequiredText(data.question);
      if (!question) {
        return NextResponse.json(
          { error: "Question is required" },
          { status: 400 }
        );
      }
      updates.question = question;
    }

    for (const key of ["context", "answer", "cv_id", "analysis_id"] as const) {
      if (data[key] === undefined) continue;
      const normalized = normalizeOptionalText(data[key]);
      if (normalized === undefined) {
        return NextResponse.json(
          { error: `Invalid ${key}` },
          { status: 400 }
        );
      }
      if (key === "cv_id") updates.legacyCvId = normalized;
      else if (key === "analysis_id") updates.sourceJobMatchAnalysisId = normalized;
      else updates[key] = normalized;
    }

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

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
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
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
