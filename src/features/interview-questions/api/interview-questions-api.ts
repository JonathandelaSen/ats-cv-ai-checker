import type {
  DeleteInterviewQuestionResponse,
  GenerateInterviewQuestionResponse,
  GetInterviewQuestionResponse,
  InterviewQuestionOptionsResponse,
  ListInterviewQuestionsResponse,
  SaveInterviewQuestionResponse,
} from "@/app/api/interview-questions/responses";
import type { InterviewQuestionsFilters } from "../hooks/use-interview-questions-route-state";

export type InterviewQuestion = ListInterviewQuestionsResponse[number];

export interface UpdateInterviewQuestionInput {
  question: string;
  context: string | null;
  answer: string | null;
  cvId: string | null;
  analysisId: string | null;
}

export interface RunInterviewQuestionAIInput {
  geminiApiKey: string;
  model: string;
  context: string | null;
  instruction?: string;
  cvId: string | null;
  analysisId: string | null;
}

async function readJsonResponse<T>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(data.error || fallbackMessage);
  return data;
}

function withQuery(filters: InterviewQuestionsFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.cvId) params.set("cvId", filters.cvId);
  if (filters.analysisId) params.set("analysisId", filters.analysisId);
  if (filters.answered === "answered") params.set("answered", "true");
  if (filters.answered === "empty") params.set("answered", "false");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listInterviewQuestions(filters: InterviewQuestionsFilters) {
  const res = await fetch(`/api/interview-questions${withQuery(filters)}`);
  return readJsonResponse<ListInterviewQuestionsResponse>(
    res,
    "Could not load interview questions."
  );
}

export async function getInterviewQuestionOptions() {
  const res = await fetch("/api/interview-questions/options");
  return readJsonResponse<InterviewQuestionOptionsResponse>(
    res,
    "Could not load interview question options."
  );
}

export async function getInterviewQuestion(id: string) {
  const res = await fetch(`/api/interview-questions/${encodeURIComponent(id)}`);
  return readJsonResponse<GetInterviewQuestionResponse>(
    res,
    "Could not load interview question."
  );
}

export async function updateInterviewQuestion({
  id,
  updates,
}: {
  id: string;
  updates: Partial<UpdateInterviewQuestionInput>;
}) {
  const res = await fetch(`/api/interview-questions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return readJsonResponse<SaveInterviewQuestionResponse>(
    res,
    "Could not save interview question."
  );
}

export async function deleteInterviewQuestion(id: string) {
  const res = await fetch(`/api/interview-questions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return readJsonResponse<DeleteInterviewQuestionResponse>(
    res,
    "Could not delete interview question."
  );
}

export async function generateInterviewQuestionAnswer({
  id,
  input,
}: {
  id: string;
  input: RunInterviewQuestionAIInput;
}) {
  const res = await fetch(
    `/api/interview-questions/${encodeURIComponent(id)}/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  return readJsonResponse<GenerateInterviewQuestionResponse>(
    res,
    "Could not generate answer."
  );
}

export async function editInterviewQuestionAnswer({
  id,
  input,
}: {
  id: string;
  input: RunInterviewQuestionAIInput;
}) {
  const res = await fetch(
    `/api/interview-questions/${encodeURIComponent(id)}/edit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  return readJsonResponse<GenerateInterviewQuestionResponse>(
    res,
    "Could not edit answer."
  );
}
