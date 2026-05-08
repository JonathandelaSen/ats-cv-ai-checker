import type { Analysis, AnalysisChatMessage, CVRecord } from "@/lib/db";

export interface OfferChatPromptInput {
  message: string;
  cv?: CVRecord | null;
  cvText?: string | null;
  analysis: Analysis;
  history?: AnalysisChatMessage[];
}

export const OFFER_CHAT_SYSTEM_PROMPT = `You are an expert job-search coach and ATS recruiter.

Reply in Spanish unless the user clearly asks for another language.

Rules:
- Return ONLY valid JSON with this shape: { "answer": "<final answer>" }.
- Use the CV, offer, and analysis context as the source of truth.
- Do not invent experience, dates, companies, achievements, or technical depth.
- When the user asks about a missing skill such as Redis, explain how important it appears in the offer, what not to claim, and what credible counter-positioning they can use.
- Be practical, candid, and specific. Give wording the user could actually say in an interview or cover message.
- If context is insufficient, say what is missing and ask for the smallest useful clarification.`;

function section(title: string, value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? `\n\n${title}:\n---\n${trimmed}\n---` : "";
}

function stringifyJson(value: string | Record<string, unknown> | null | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function recentConversation(history: AnalysisChatMessage[] | undefined) {
  const recent = (history ?? []).slice(-12);
  if (recent.length === 0) return "";

  return recent
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n\n");
}

export function buildOfferChatPrompt(input: OfferChatPromptInput): string {
  const cvSummary = input.cv
    ? [
        `CV linked: ${input.cv.name}`,
        input.cv.type ? `Type: ${input.cv.type}` : null,
        input.cv.profile
          ? `Structured CV profile JSON: ${JSON.stringify(input.cv.profile)}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const analysisSummary = [
    `Analysis title: ${input.analysis.title}`,
    `Score: ${input.analysis.ai_score ?? "not available"}`,
    input.analysis.ai_feedback ? `Feedback: ${input.analysis.ai_feedback}` : null,
    input.analysis.job_url ? `URL: ${input.analysis.job_url}` : null,
    input.analysis.job_key_data
      ? `job_key_data JSON: ${stringifyJson(input.analysis.job_key_data)}`
      : null,
    input.analysis.job_keywords
      ? `job_keywords JSON: ${stringifyJson(input.analysis.job_keywords)}`
      : null,
    input.analysis.matching_keywords
      ? `matching_keywords JSON: ${stringifyJson(input.analysis.matching_keywords)}`
      : null,
    input.analysis.missing_keywords
      ? `missing_keywords JSON: ${stringifyJson(input.analysis.missing_keywords)}`
      : null,
    input.analysis.ai_improvements
      ? `improvements JSON: ${stringifyJson(input.analysis.ai_improvements)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `User question:
${input.message.trim()}${section("Recent conversation", recentConversation(input.history))}${section("Linked offer analysis", analysisSummary)}${section("Linked job posting", input.analysis.job_description)}${section("Linked CV summary", cvSummary)}${section("Linked CV extracted text", input.cvText)}

Answer the user using only this context.`;
}
