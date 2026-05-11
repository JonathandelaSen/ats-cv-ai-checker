import { NextRequest, NextResponse } from "next/server";
import {
  createFeedbackNotesModule,
  presentFeedback,
} from "@/modules/feedback-notes";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
import { getAuthedSupabase, normalizeRequiredText } from "../../../validation";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const geminiApiKey = normalizeRequiredText(body.geminiApiKey);
    const model = normalizeRequiredText(body.model) ?? "gemini-3.1-pro-preview";
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Configura tu API key de Gemini antes de generar feedback." },
        { status: 400 }
      );
    }

    const tracker = new SupabaseEventTracker();
    const mod = createFeedbackNotesModule(supabase, tracker);
    const useCase = mod.createGenerateFinalFeedbackUseCase({
      apiKey: geminiApiKey,
      model,
    });
    const feedback = await useCase.execute(user.id, id);
    const entries = await mod.listEntries.execute(user.id, id);
    return NextResponse.json(presentFeedback(feedback, entries.length));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
