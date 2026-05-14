import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import {
  presentWorkJournalContext,
  presentWorkJournalContextSuggestion,
} from "@/modules/work-journal";
import { handleDomainError } from "@/modules/shared";
import {
  normalizeContextType,
  normalizeOptionalText,
  normalizeRequiredText,
} from "../validation";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    workJournalModule.bindRequest(supabase);

    await workJournalModule.ensureDefaultContext.execute(user.id);
    const [contexts, suggestions] = await Promise.all([
      workJournalModule.listContexts.execute(user.id),
      workJournalModule.listContextSuggestions.execute(user.id),
    ]);

    return NextResponse.json({
      contexts: contexts.map(presentWorkJournalContext),
      suggestions: suggestions.map(presentWorkJournalContextSuggestion),
    });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = (await req.json()) as Record<string, unknown>;
    const type = normalizeContextType(body.type);
    const name = normalizeRequiredText(body.name);
    const role_or_label =
      body.role_or_label === undefined ? null : normalizeOptionalText(body.role_or_label);

    if (!type || !name || role_or_label === undefined) {
      return NextResponse.json({ error: "Invalid context payload" }, { status: 400 });
    }
    workJournalModule.bindRequest(supabase);

    const context = await workJournalModule.createContext.execute({
      user_id: user.id,
      type,
      name,
      role_or_label,
      is_default: Boolean(body.is_default),
      created_from_cv: Boolean(body.created_from_cv),
    });

    return NextResponse.json(presentWorkJournalContext(context), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
