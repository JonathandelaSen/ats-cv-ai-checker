import { GoogleGenAI } from "@google/genai";
import type { Analysis, CVRecord } from "@/lib/db";
import {
  INTERVIEW_QUESTION_SYSTEM_PROMPT,
  buildInterviewQuestionPrompt,
} from "@/lib/ai-interview-question-prompts";

export interface InterviewQuestionAIInput {
  apiKey: string;
  model: string;
  question: string;
  context: string;
  currentAnswer?: string | null;
  instruction?: string | null;
  cv?: CVRecord | null;
  cvText?: string | null;
  analysis?: Analysis | null;
}

export function parseInterviewQuestionAIResponse(rawText: string): string {
  const parsed = JSON.parse(rawText || "{}") as Record<string, unknown>;
  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";

  if (!answer) {
    throw new Error(
      "La IA no pudo generar una respuesta segura. Añade más contexto personal."
    );
  }

  return answer;
}

async function runInterviewQuestionModel(
  input: InterviewQuestionAIInput
): Promise<string> {
  const googleAI = new GoogleGenAI({ apiKey: input.apiKey });
  const response = await googleAI.models.generateContent({
    model: input.model,
    contents: [
      {
        role: "user",
        parts: [{ text: buildInterviewQuestionPrompt(input) }],
      },
    ],
    config: {
      systemInstruction: INTERVIEW_QUESTION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  return parseInterviewQuestionAIResponse(response.text || "{}");
}

export async function generateInterviewQuestionAnswer(
  input: InterviewQuestionAIInput
): Promise<string> {
  return runInterviewQuestionModel(input);
}

export async function editInterviewQuestionAnswer(
  input: InterviewQuestionAIInput
): Promise<string> {
  return runInterviewQuestionModel(input);
}
