import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitment,
  presentCommitmentsWorkspace } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import { parseCreateCommitmentRequest } from "./validation";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    commitmentsModule.bindRequest(supabase);
    const workspace = await commitmentsModule.listWorkspace.execute(user.id);
    return NextResponse.json(presentCommitmentsWorkspace(workspace));
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
    const parsed = parseCreateCommitmentRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    commitmentsModule.bindRequest(supabase);
    const commitment = await commitmentsModule.createCommitment.execute({
      userId: user.id,
      ...parsed.value,
      startDate: parsed.value.startDate ?? undefined,
    });
    return NextResponse.json(presentCommitment(commitment), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
