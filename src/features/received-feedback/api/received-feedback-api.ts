import type {
  CreateActivityContextResponse,
  ListActivityContextsResponse,
} from "@/app/api/activity-contexts/responses";
import type {
  CreateReceivedFeedbackResponse,
  ListReceivedFeedbackResponse,
  ReceivedFeedbackResponse,
} from "@/app/api/received-feedback/responses";
import type {
  DeleteReceivedFeedbackResponse,
  UpdateReceivedFeedbackResponse,
} from "@/app/api/received-feedback/[id]/responses";

export type ReceivedFeedbackItem = ListReceivedFeedbackResponse[number];
export type ActivityContext = ListActivityContextsResponse["contexts"][number];
export type ActivityContextType = ActivityContext["type"];

export interface SaveReceivedFeedbackInput {
  activityContextId: string;
  receivedDate: string;
  giverName: string;
  feedbackText: string;
  userNote: string | null;
}

export interface CreateActivityContextInput {
  name: string;
  type: ActivityContextType;
}

async function readJsonResponse<T>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

export async function listReceivedFeedback() {
  const res = await fetch("/api/received-feedback");
  return readJsonResponse<ListReceivedFeedbackResponse>(
    res,
    "Could not load received feedback."
  );
}

export async function listActivityContexts() {
  const res = await fetch("/api/activity-contexts");
  return readJsonResponse<ListActivityContextsResponse>(
    res,
    "Could not load contexts."
  );
}

export async function createActivityContext(input: CreateActivityContextInput) {
  const res = await fetch("/api/activity-contexts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJsonResponse<CreateActivityContextResponse>(
    res,
    "Could not create context."
  );
}

export async function createReceivedFeedback(input: SaveReceivedFeedbackInput) {
  const res = await fetch("/api/received-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJsonResponse<CreateReceivedFeedbackResponse>(
    res,
    "Could not save received feedback."
  );
}

export async function updateReceivedFeedback({
  id,
  updates,
}: {
  id: string;
  updates: Partial<SaveReceivedFeedbackInput>;
}) {
  const res = await fetch(`/api/received-feedback/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return readJsonResponse<UpdateReceivedFeedbackResponse>(
    res,
    "Could not save received feedback."
  );
}

export async function deleteReceivedFeedback(item: ReceivedFeedbackResponse) {
  const res = await fetch(`/api/received-feedback/${item.id}`, {
    method: "DELETE",
  });
  return readJsonResponse<DeleteReceivedFeedbackResponse>(
    res,
    "Could not delete received feedback."
  );
}
