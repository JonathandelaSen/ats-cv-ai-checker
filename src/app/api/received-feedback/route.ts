import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { receivedFeedbackModule } from "@/lib/container";
import { presentReceivedFeedback } from "@/modules/received-feedback";
import { handleDomainError } from "@/modules/shared";
import { parseCreateReceivedFeedbackRequest } from "./validation";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    receivedFeedbackModule.bindRequest(supabase);
    const feedback = await receivedFeedbackModule.listReceivedFeedback.execute(user.id);

    return NextResponse.json(feedback.map(presentReceivedFeedback));
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
    const parsed = parseCreateReceivedFeedbackRequest(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: parsed.error.status }
      );
    }

    receivedFeedbackModule.bindRequest(supabase);
    const feedback = await receivedFeedbackModule.createReceivedFeedback.execute({
      userId: user.id,
      ...parsed.value,
    });

    return NextResponse.json(presentReceivedFeedback(feedback), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
