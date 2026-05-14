import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentContext } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import {
  optionalStringEnum,
  optionalText,
  requiredText,
} from "../../validation";

const types = ["employment", "project", "personal", "other"] as const;
const statuses = ["active", "archived"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const type = optionalStringEnum(body.type, types);
    const name = body.name === undefined ? undefined : requiredText(body.name);
    const roleOrLabel = optionalText(body.roleOrLabel);
    const status = optionalStringEnum(body.status, statuses);
    if (name === null || roleOrLabel === undefined) {
      return NextResponse.json({ error: "Invalid commitment context payload" }, { status: 400 });
    }
    commitmentsModule.bindRequest(supabase);
    const context = await commitmentsModule.updateContext.execute({
      userId: user.id,
      id,
      type,
      name,
      roleOrLabel,
      status,
    });
    return NextResponse.json(presentCommitmentContext(context));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
