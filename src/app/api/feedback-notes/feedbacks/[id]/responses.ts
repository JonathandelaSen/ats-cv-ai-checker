import type { FeedbackResponse } from "../responses";

export { toFeedbackResponse, type FeedbackResponse } from "../responses";

export type GetFeedbackResponse = FeedbackResponse;
export type UpdateFeedbackResponse = FeedbackResponse;
export interface DeleteFeedbackResponse {
  ok: true;
}
