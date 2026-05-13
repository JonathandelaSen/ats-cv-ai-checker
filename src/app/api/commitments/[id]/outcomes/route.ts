import { NextRequest, NextResponse } from "next/server";
import { commitmentsModule } from "@/lib/container";
import { presentCommitmentOutcome } from "@/modules/commitments";
import { handleDomainError } from "@/modules/shared";
import {
  getAuthedSupabase,
  optionalNumber,
  optionalStringEnum,
  optionalText,
  requiredStringEnum,
  requiredText,
} from "../../validation";

const types = ["promotion", "role_change", "leadership", "mentoring", "money", "recognition", "learning", "other"] as const;
const statuses = ["expected", "achieved", "missed", "changed"] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const type = requiredStringEnum(body.type, types);
    const status = optionalStringEnum(body.status, statuses);
    const title = requiredText(body.title);
    const description = optionalText(body.description);
    const amount = optionalNumber(body.amount);
    const currency = optionalText(body.currency);
    const decidedAt = body.decidedAt === undefined ? undefined : typeof body.decidedAt === "string" || body.decidedAt === null ? body.decidedAt : undefined;
    if (
      !type ||
      !title ||
      (body.description !== undefined && description === undefined) ||
      (body.amount !== undefined && amount === undefined) ||
      (body.currency !== undefined && currency === undefined) ||
      (body.decidedAt !== undefined && decidedAt === undefined)
    ) {
      return NextResponse.json({ error: "Invalid commitment outcome payload" }, { status: 400 });
    }
    commitmentsModule.bindRequest(supabase);
    const outcome = await commitmentsModule.createOutcome.execute({
      userId: user.id,
      commitmentId: id,
      type,
      status,
      title,
      description,
      amount,
      currency,
      decidedAt,
    });
    return NextResponse.json(presentCommitmentOutcome(outcome), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
