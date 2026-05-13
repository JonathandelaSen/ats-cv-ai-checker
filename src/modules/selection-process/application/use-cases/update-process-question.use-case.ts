import { Timestamp, UserId, type EventTracker } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type {
  ProcessQuestionReadModel,
  ProcessQuestionRepository,
} from "../../domain/repositories/process-question.repository";
import { JobOpportunityId } from "../../domain/value-objects/job-opportunity-id.value-object";
import { ProcessQuestionId } from "../../domain/value-objects/process-question-id.value-object";
import { ProcessQuestionText } from "../../domain/value-objects/process-question-text.value-object";

export interface UpdateProcessQuestionInput {
  id: string;
  userId: string;
  jobOpportunityId?: string | null;
  question?: string;
  context?: string | null;
  answer?: string | null;
  aiModel?: string | null;
  aiGeneratedAt?: string | null;
  sourceJobMatchAnalysisId?: string | null;
  legacyCvId?: string | null;
  requestId?: string;
}

export class UpdateProcessQuestionUseCase {
  constructor(
    private readonly deps: {
      questionRepo: ProcessQuestionRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: UpdateProcessQuestionInput): Promise<ProcessQuestionReadModel | null> {
    const id = ProcessQuestionId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const existing = await this.deps.questionRepo.findById(id, userId);
    if (!existing) return null;

    existing.question.update({
      question: input.question
        ? ProcessQuestionText.fromPrimitives(input.question)
        : undefined,
      context: input.context,
      answer: input.answer,
      jobOpportunityId:
        input.jobOpportunityId === undefined
          ? undefined
          : input.jobOpportunityId
            ? JobOpportunityId.fromPrimitives(input.jobOpportunityId)
            : null,
      sourceJobMatchAnalysisId: input.sourceJobMatchAnalysisId,
      legacyCvId: input.legacyCvId,
      aiModel: input.aiModel,
      aiGeneratedAt: input.aiGeneratedAt,
      updatedAt: Timestamp.fromPrimitives(new Date().toISOString()),
    });

    const saved = await this.deps.questionRepo.save(existing.question);
    await this.deps.tracker.record({
      userId: input.userId,
      requestId: input.requestId ?? createRequestId("process-question"),
      stage: "selection_process_question_updated",
      status: "success",
      source: "selection_process",
      cvId: saved.question.toPrimitives().legacyCvId,
      analysisId: saved.question.toPrimitives().sourceJobMatchAnalysisId,
      metadata: { questionId: saved.question.id },
    });
    return saved;
  }
}
