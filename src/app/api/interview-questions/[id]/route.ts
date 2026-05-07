import { NextRequest, NextResponse } from "next/server";
import {
  deleteInterviewQuestion,
  getInterviewQuestion,
  updateInterviewQuestion,
  type UpdateInterviewQuestionInput,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeOptionalText,
  normalizeRequiredText,
  validateQuestionLinks,
} from "../validation";

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
    const question = await getInterviewQuestion(supabase, id, user.id);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(question);
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
    const updates: UpdateInterviewQuestionInput = {};

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
      updates[key] = normalized;
    }

    if (updates.cv_id !== undefined || updates.analysis_id !== undefined) {
      const existing = await getInterviewQuestion(supabase, id, user.id);
      if (!existing) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
      const links = await validateQuestionLinks(supabase, user.id, {
        cv_id: updates.cv_id === undefined ? existing.cv_id : updates.cv_id,
        analysis_id:
          updates.analysis_id === undefined
            ? existing.analysis_id
            : updates.analysis_id,
      });
      if (!links.ok) return links.response;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await updateInterviewQuestion(
      supabase,
      id,
      user.id,
      updates
    );
    if (!updated) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
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
    const deleted = await deleteInterviewQuestion(supabase, id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
