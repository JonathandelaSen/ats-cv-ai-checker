import { GoogleGenAI } from "@google/genai";
import type {
  InterviewQuestionAIInput,
  InterviewQuestionAIService,
} from "../../domain/repositories/interview-question-ai.service";
import {
  INTERVIEW_QUESTION_SYSTEM_PROMPT,
  buildInterviewQuestionPrompt,
} from "./interview-question-prompts";

function parseInterviewQuestionAIResponse(rawText: string): string {
  const parsed = JSON.parse(rawText || "{}") as Record<string, unknown>;
  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";

  if (!answer) {
    throw new Error(
      "La IA no pudo generar una respuesta segura. Añade más contexto personal.",
    );
  }

  return answer;
}

async function runInterviewQuestionModel(
  input: InterviewQuestionAIInput,
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

export class GeminiInterviewQuestionAIService
  implements InterviewQuestionAIService
{
  async generateAnswer(input: InterviewQuestionAIInput): Promise<string> {
    return runInterviewQuestionModel(input);
  }

  async editAnswer(input: InterviewQuestionAIInput): Promise<string> {
    return runInterviewQuestionModel(input);
  }
}
