import { UserId } from "@/modules/shared";
import type { ReceivedFeedback } from "../../domain/entities/received-feedback.entity";
import type { ReceivedFeedbackRepository } from "../../domain/repositories/received-feedback.repository";

export class ListReceivedFeedbackUseCase {
  constructor(
    private readonly deps: {
      receivedFeedbackRepo: ReceivedFeedbackRepository;
    }
  ) {}

  async execute(userId: string): Promise<ReceivedFeedback[]> {
    return this.deps.receivedFeedbackRepo.search({
      userId: UserId.fromPrimitives(userId),
      limit: 100,
    });
  }
}
