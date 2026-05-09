import { NextRequest, NextResponse } from "next/server";
import {
  createWorkJournalContext,
  hideWorkJournalContextSuggestion,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeContextType,
  normalizeOptionalText,
  normalizeRequiredText,
} from "../../validation";

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action;
    const type = normalizeContextType(body.type);
    const name = normalizeRequiredText(body.name);
    const role_or_label =
      body.role_or_label === undefined ? null : normalizeOptionalText(body.role_or_label);

    if (!type || !name || role_or_label === undefined) {
      return NextResponse.json({ error: "Invalid suggestion payload" }, { status: 400 });
    }

    if (action === "hide") {
      await hideWorkJournalContextSuggestion(supabase, user.id, { type, name });
      return NextResponse.json({ ok: true });
    }

    if (action === "promote") {
      const context = await createWorkJournalContext(supabase, {
        user_id: user.id,
        type,
        name,
        role_or_label,
        is_default: Boolean(body.is_default),
        created_from_cv: true,
      });
      return NextResponse.json(context, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid suggestion action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
