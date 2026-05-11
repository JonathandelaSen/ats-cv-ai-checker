import { NextRequest, NextResponse } from "next/server";
import { createWorkJournalModule, presentWorkJournalContext } from "@/modules/work-journal";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
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
    const action = body.action as string;
    const type = normalizeContextType(body.type);
    const name = normalizeRequiredText(body.name);
    const role_or_label =
      body.role_or_label === undefined ? null : normalizeOptionalText(body.role_or_label);

    if (!type || !name || role_or_label === undefined) {
      return NextResponse.json({ error: "Invalid suggestion payload" }, { status: 400 });
    }

    if (action !== "promote" && action !== "hide") {
      return NextResponse.json({ error: "Invalid suggestion action" }, { status: 400 });
    }

    const tracker = new SupabaseEventTracker();
    const mod = createWorkJournalModule(supabase, tracker);

    const result = await mod.handleSuggestionAction.execute({
      userId: user.id,
      action,
      type,
      name,
      role_or_label,
      is_default: Boolean(body.is_default),
    });

    if ("ok" in result) return NextResponse.json(result);
    return NextResponse.json(presentWorkJournalContext(result), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
