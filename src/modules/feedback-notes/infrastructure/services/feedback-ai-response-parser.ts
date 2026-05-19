export function parseFinalFeedbackAIResponse(rawText: string): string {
  const parsed = JSON.parse(rawText || "{}") as Record<string, unknown>;
  const value = parsed.final_feedback;
  const finalFeedback =
    typeof value === "string" && value.trim() ? value.trim() : null;
  if (!finalFeedback) {
    throw new Error("La IA no pudo redactar el feedback con estas notas.");
  }
  return finalFeedback;
}
