import type { FeedbackEntry } from "../entities/feedback-entry.entity";

export interface FeedbackEntryRepository {
  listByFeedback(feedbackId: string, userId: string): Promise<FeedbackEntry[]>;
  findById(id: string, userId: string): Promise<FeedbackEntry | null>;
  save(entry: FeedbackEntry): Promise<FeedbackEntry>;
  delete(id: string, userId: string): Promise<void>;
}
