import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitment,
  presentCommitmentsWorkspace } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import {
  optionalDate,
  optionalStringEnum,
  optionalText,
  requiredStringEnum,
  requiredText,
} from "./validation";

const sources = ["manager", "self", "company", "project", "other"] as const;
const priorities = ["low", "medium", "high"] as const;

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
    const body = (await req.json()) as Record<string, unknown>;
    const contextId = requiredText(body.contextId);
    const title = requiredText(body.title);
    const source = requiredStringEnum(body.source, sources);
    const description = optionalText(body.description);
    const successCriteria = optionalText(body.successCriteria);
    const resultNotes = optionalText(body.resultNotes);
    const priority = optionalStringEnum(body.priority, priorities) ?? null;
    const startDate = optionalDate(body.startDate);
    const targetDate = optionalDate(body.targetDate);
    if (
      !contextId ||
      !title ||
      !source ||
      (body.description !== undefined && description === undefined) ||
      (body.successCriteria !== undefined && successCriteria === undefined) ||
      (body.resultNotes !== undefined && resultNotes === undefined) ||
      (body.startDate !== undefined && startDate === undefined) ||
      (body.targetDate !== undefined && targetDate === undefined)
    ) {
      return NextResponse.json({ error: "Invalid commitment payload" }, { status: 400 });
    }
    commitmentsModule.bindRequest(supabase);
    const commitment = await commitmentsModule.createCommitment.execute({
      userId: user.id,
      contextId,
      title,
      source,
      description,
      successCriteria,
      resultNotes,
      priority,
      startDate: startDate ?? undefined,
      targetDate,
    });
    return NextResponse.json(presentCommitment(commitment), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
