export type FeedbackStatusResponse = "active" | "closed";

export interface FeedbackResponse {
  id: string;
  userId: string;
  personName: string;
  status: FeedbackStatusResponse;
  finalFeedback: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  entryCount?: number;
}

interface FeedbackPresenterOutput {
  id: string;
  user_id: string;
  person_name: string;
  status: FeedbackStatusResponse;
  final_feedback: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  entry_count?: number;
}

export type ListFeedbacksResponse = FeedbackResponse[];
export type CreateFeedbackResponse = FeedbackResponse;

export function toFeedbackResponse(
  feedback: FeedbackPresenterOutput
): FeedbackResponse {
  return {
    id: feedback.id,
    userId: feedback.user_id,
    personName: feedback.person_name,
    status: feedback.status,
    finalFeedback: feedback.final_feedback,
    closedAt: feedback.closed_at,
    createdAt: feedback.created_at,
    updatedAt: feedback.updated_at,
    entryCount: feedback.entry_count,
  };
}
