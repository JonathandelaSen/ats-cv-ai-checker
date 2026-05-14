import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentContext } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import { parseCreateCommitmentContextRequest } from "../validation";

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const body = await req.json();
    const parsed = parseCreateCommitmentContextRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    commitmentsModule.bindRequest(supabase);
    const context = await commitmentsModule.createContext.execute({ userId: user.id, ...parsed.value });
    return NextResponse.json(presentCommitmentContext(context), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
