import { UserId, type EventTracker } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type { ProcessQuestionRepository } from "../../domain/repositories/process-question.repository";
import { ProcessQuestionId } from "../../domain/value-objects/process-question-id.value-object";

export interface DeleteProcessQuestionInput {
  id: string;
  userId: string;
  requestId?: string;
}

export class DeleteProcessQuestionUseCase {
  constructor(
    private readonly deps: {
      questionRepo: ProcessQuestionRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: DeleteProcessQuestionInput): Promise<boolean> {
    const deleted = await this.deps.questionRepo.delete(
      ProcessQuestionId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId)
    );
    if (deleted) {
      await this.deps.tracker.record({
        userId: input.userId,
        requestId: input.requestId ?? createRequestId("process-question"),
        stage: "selection_process_question_deleted",
        status: "success",
        source: "selection_process",
        metadata: { questionId: input.id },
      });
    }
    return deleted;
  }
}
