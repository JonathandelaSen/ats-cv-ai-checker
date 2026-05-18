import type { FeedbackEntryResponse } from "../../feedbacks/[id]/entries/responses";

export {
  toFeedbackEntryResponse,
  type FeedbackEntryResponse,
} from "../../feedbacks/[id]/entries/responses";

export type UpdateFeedbackEntryResponse = FeedbackEntryResponse;
export interface DeleteFeedbackEntryResponse {
  ok: true;
}
