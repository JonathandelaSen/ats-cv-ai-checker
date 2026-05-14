import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import {
  presentWorkJournalContext,
  presentWorkJournalContextSuggestion,
} from "@/modules/work-journal";
import { handleDomainError } from "@/modules/shared";
import { parseCreateWorkJournalContextRequest } from "../validation";

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

    const body = await req.json();
    const parsed = parseCreateWorkJournalContextRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    workJournalModule.bindRequest(supabase);

    const context = await workJournalModule.createContext.execute({
      user_id: user.id,
      ...parsed.value,
    });

    return NextResponse.json(presentWorkJournalContext(context), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
