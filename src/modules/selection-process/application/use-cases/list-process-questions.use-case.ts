import { UserId } from "@/modules/shared";
import type {
  ProcessQuestionReadModel,
  ProcessQuestionRepository,
} from "../../domain/repositories/process-question.repository";

export interface ListProcessQuestionsInput {
  userId: string;
  search?: string | null;
  cvId?: string | null;
  analysisId?: string | null;
  answered?: boolean | null;
}

export class ListProcessQuestionsUseCase {
  constructor(
    private readonly deps: { questionRepo: ProcessQuestionRepository }
  ) {}

  async execute(
    input: ListProcessQuestionsInput
  ): Promise<ProcessQuestionReadModel[]> {
    return this.deps.questionRepo.search({
      userId: UserId.fromPrimitives(input.userId),
      search: input.search,
      legacyCvId: input.cvId,
      sourceJobMatchAnalysisId: input.analysisId,
      answered: input.answered,
    });
  }
}
