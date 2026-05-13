import { UserId } from "@/modules/shared";
import type {
  ProcessQuestionReadModel,
  ProcessQuestionRepository,
} from "../../domain/repositories/process-question.repository";
import { ProcessQuestionId } from "../../domain/value-objects/process-question-id.value-object";

export interface GetProcessQuestionInput {
  id: string;
  userId: string;
}

export class GetProcessQuestionUseCase {
  constructor(
    private readonly deps: { questionRepo: ProcessQuestionRepository }
  ) {}

  async execute(input: GetProcessQuestionInput): Promise<ProcessQuestionReadModel | null> {
    return this.deps.questionRepo.findById(
      ProcessQuestionId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId)
    );
  }
}
