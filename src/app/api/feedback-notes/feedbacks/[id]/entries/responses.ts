export interface FeedbackEntryResponse {
  id: string;
  userId: string;
  feedbackId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackEntryPresenterOutput {
  id: string;
  user_id: string;
  feedback_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ListFeedbackEntriesResponse = FeedbackEntryResponse[];
export type CreateFeedbackEntryResponse = FeedbackEntryResponse;

export function toFeedbackEntryResponse(
  entry: FeedbackEntryPresenterOutput
): FeedbackEntryResponse {
  return {
    id: entry.id,
    userId: entry.user_id,
    feedbackId: entry.feedback_id,
    content: entry.content,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}
