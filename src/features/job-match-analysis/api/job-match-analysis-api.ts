import type {
  ListJobMatchAnalysesResponse,
  GetJobMatchAnalysisResponse,
  ScoreJobMatchAnalysisResponse,
  UpdateJobMatchAnalysisResponse,
  DeleteJobMatchAnalysisResponse,
  JobMatchAnalysisOfferStatus,
} from "@/app/api/job-match-analyses/responses";

export type JobMatchAnalysisSummary = ListJobMatchAnalysesResponse[number];
export type JobMatchAnalysisDetail = GetJobMatchAnalysisResponse;

export interface ScoreJobMatchAnalysisInput {
  provider: "gemini" | "mock";
  apiKey?: string;
  model: string;
  jobDescription: string;
  jobUrl: string | null;
}

export interface UpdateJobMatchAnalysisInput {
  jobUrl?: string | null;
  offerStatus?: JobMatchAnalysisOfferStatus;
  offerNotes?: string | null;
  offerNextAction?: string | null;
  offerNextActionAt?: string | null;
}

async function readJsonResponse<T>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(data.error || fallbackMessage);
  return data;
}

export async function listJobMatchAnalyses() {
  const res = await fetch("/api/job-match-analyses");
  return readJsonResponse<ListJobMatchAnalysesResponse>(
    res,
    "Could not load job match analyses."
  );
}

export async function getJobMatchAnalysis(id: string) {
  const res = await fetch(
    `/api/job-match-analyses/${encodeURIComponent(id)}`
  );
  return readJsonResponse<GetJobMatchAnalysisResponse>(
    res,
    "Could not load job match analysis."
  );
}

export async function deleteJobMatchAnalysis(id: string) {
  const res = await fetch(
    `/api/job-match-analyses/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  return readJsonResponse<DeleteJobMatchAnalysisResponse>(
    res,
    "Could not delete job match analysis."
  );
}

export async function scoreJobMatchAnalysis({
  id,
  input,
}: {
  id: string;
  input: ScoreJobMatchAnalysisInput;
}) {
  const res = await fetch(
    `/api/job-match-analyses/${encodeURIComponent(id)}/score`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  return readJsonResponse<ScoreJobMatchAnalysisResponse>(
    res,
    "Could not score job match analysis."
  );
}

export async function updateJobMatchAnalysis({
  id,
  updates,
}: {
  id: string;
  updates: UpdateJobMatchAnalysisInput;
}) {
  const body: Record<string, unknown> = {};
  if (updates.jobUrl !== undefined) body.job_url = updates.jobUrl;
  if (updates.offerStatus !== undefined) body.offer_status = updates.offerStatus;
  if (updates.offerNotes !== undefined) body.offer_notes = updates.offerNotes;
  if (updates.offerNextAction !== undefined) body.offer_next_action = updates.offerNextAction;
  if (updates.offerNextActionAt !== undefined) body.offer_next_action_at = updates.offerNextActionAt;

  const res = await fetch(
    `/api/job-match-analyses/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return readJsonResponse<UpdateJobMatchAnalysisResponse>(
    res,
    "Could not update job match analysis."
  );
}
