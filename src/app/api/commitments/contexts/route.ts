import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentContext } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import {
  optionalText,
  requiredStringEnum,
  requiredText,
} from "../validation";

const types = ["employment", "project", "personal", "other"] as const;

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const body = (await req.json()) as Record<string, unknown>;
    const type = requiredStringEnum(body.type, types);
    const name = requiredText(body.name);
    const roleOrLabel = optionalText(body.roleOrLabel);
    if (!type || !name || (body.roleOrLabel !== undefined && roleOrLabel === undefined)) {
      return NextResponse.json({ error: "Invalid commitment context payload" }, { status: 400 });
    }
    commitmentsModule.bindRequest(supabase);
    const context = await commitmentsModule.createContext.execute({ userId: user.id, type, name, roleOrLabel });
    return NextResponse.json(presentCommitmentContext(context), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
