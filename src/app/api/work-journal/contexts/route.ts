import { NextRequest, NextResponse } from "next/server";
import {
  createWorkJournalContext,
  ensureDefaultWorkJournalContext,
  listWorkJournalContexts,
  listWorkJournalContextSuggestions,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeContextType,
  normalizeOptionalText,
  normalizeRequiredText,
} from "../validation";

export async function GET() {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDefaultWorkJournalContext(supabase, user.id);
    const [contexts, suggestions] = await Promise.all([
      listWorkJournalContexts(supabase, user.id),
      listWorkJournalContextSuggestions(supabase, user.id),
    ]);

    return NextResponse.json({ contexts, suggestions });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const type = normalizeContextType(body.type);
    const name = normalizeRequiredText(body.name);
    const role_or_label =
      body.role_or_label === undefined ? null : normalizeOptionalText(body.role_or_label);

    if (!type || !name || role_or_label === undefined) {
      return NextResponse.json({ error: "Invalid context payload" }, { status: 400 });
    }

    const context = await createWorkJournalContext(supabase, {
      user_id: user.id,
      type,
      name,
      role_or_label,
      is_default: Boolean(body.is_default),
      created_from_cv: Boolean(body.created_from_cv),
    });

    return NextResponse.json(context, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
