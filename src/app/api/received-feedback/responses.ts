export interface ReceivedFeedbackResponse {
  id: string;
  userId: string;
  activityContextId: string;
  receivedDate: string;
  giverName: string;
  feedbackText: string;
  userNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ListReceivedFeedbackResponse = ReceivedFeedbackResponse[];
export type CreateReceivedFeedbackResponse = ReceivedFeedbackResponse;

interface ReceivedFeedbackPresenterOutput {
  id: string;
  userId: string;
  activityContextId: string;
  receivedDate: string;
  giverName: string;
  feedbackText: string;
  userNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toReceivedFeedbackResponse(
  input: ReceivedFeedbackPresenterOutput
): ReceivedFeedbackResponse {
  return {
    id: input.id,
    userId: input.userId,
    activityContextId: input.activityContextId,
    receivedDate: input.receivedDate,
    giverName: input.giverName,
    feedbackText: input.feedbackText,
    userNote: input.userNote,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
