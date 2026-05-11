import { NextRequest, NextResponse } from "next/server";
import { createWorkJournalModule } from "@/modules/work-journal";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
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

    const tracker = new SupabaseEventTracker();
    const mod = createWorkJournalModule(supabase, tracker);

    await mod.ensureDefaultContext.execute(user.id);
    const [contexts, suggestions] = await Promise.all([
      mod.listContexts.execute(user.id),
      mod.listContextSuggestions.execute(user.id),
    ]);

    return NextResponse.json({ contexts, suggestions });
  } catch (error: unknown) {
    return handleDomainError(error);
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

    const tracker = new SupabaseEventTracker();
    const mod = createWorkJournalModule(supabase, tracker);

    const context = await mod.createContext.execute({
      user_id: user.id,
      type,
      name,
      role_or_label,
      is_default: Boolean(body.is_default),
      created_from_cv: Boolean(body.created_from_cv),
    });

    return NextResponse.json(context, { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
