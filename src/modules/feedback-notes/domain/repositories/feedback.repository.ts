import type {
  Feedback,
  FeedbackStatus,
} from "../entities/feedback.entity";

export interface FeedbackSearchCriteria {
  userId: string;
  status?: FeedbackStatus | "all" | null;
}

export interface FeedbackRepository {
  list(criteria: FeedbackSearchCriteria): Promise<Feedback[]>;
  findById(id: string, userId: string): Promise<Feedback | null>;
  save(feedback: Feedback): Promise<Feedback>;
  delete(id: string, userId: string): Promise<void>;
}
