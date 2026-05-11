import type { FeedbackStatus } from "../../domain/entities/feedback.entity";
import type { FeedbackRepository } from "../../domain/repositories/feedback.repository";

export class ListFeedbacksUseCase {
  constructor(private readonly deps: { feedbackRepo: FeedbackRepository }) {}

  execute(userId: string, status: FeedbackStatus | "all" = "active") {
    return this.deps.feedbackRepo.list({ userId, status });
  }
}
