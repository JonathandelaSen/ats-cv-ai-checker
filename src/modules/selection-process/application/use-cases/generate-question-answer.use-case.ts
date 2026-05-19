import type { Analysis, CVRecord } from "@/lib/analysis-types";
import {
  Timestamp,
  UserId,
  type AIProvider,
  type EventTracker,
} from "@/modules/shared";
import type {
  ProcessQuestionReadModel,
  ProcessQuestionRepository,
} from "../../domain/repositories/process-question.repository";
import type { InterviewQuestionAIServiceFactory } from "../../domain/repositories/interview-question-ai.service";
import { ProcessQuestionId } from "../../domain/value-objects/process-question-id.value-object";

export interface GenerateQuestionAnswerInput {
  id: string;
  userId: string;
  provider: AIProvider;
  apiKey?: string;
  model: string;
  context: string;
  legacyCvId?: string | null;
  sourceJobMatchAnalysisId?: string | null;
  cv?: CVRecord | null;
  cvText?: string | null;
  analysis?: Analysis | null;
  requestId: string;
}

export class GenerateQuestionAnswerUseCase {
  constructor(
    private readonly deps: {
      questionRepo: ProcessQuestionRepository;
      aiFactory: InterviewQuestionAIServiceFactory;
      tracker: EventTracker;
    },
  ) {}

  async execute(
    input: GenerateQuestionAnswerInput,
  ): Promise<ProcessQuestionReadModel | null> {
    const id = ProcessQuestionId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const existing = await this.deps.questionRepo.findById(id, userId);
    if (!existing) return null;

    const question = existing.question.toPrimitives();

    const aiService = this.deps.aiFactory.create({
      provider: input.provider,
      apiKey: input.apiKey,
      model: input.model,
    });
    const answer = await aiService.generateAnswer({
      question: question.question,
      context: input.context,
      cv: input.cv,
      cvText: input.cvText,
      analysis: input.analysis,
    });

    existing.question.update({
      context: input.context,
      answer,
      legacyCvId: input.legacyCvId,
      sourceJobMatchAnalysisId: input.sourceJobMatchAnalysisId,
      aiModel: input.model,
      aiGeneratedAt: new Date().toISOString(),
      updatedAt: Timestamp.fromPrimitives(new Date().toISOString()),
    });

    const saved = await this.deps.questionRepo.save(existing.question);

    await this.deps.tracker.record({
      userId: input.userId,
      requestId: input.requestId,
      stage: "selection_process_question_answer_generated",
      status: "success",
      source: "selection_process",
      cvId: saved.question.toPrimitives().legacyCvId,
      analysisId: saved.question.toPrimitives().sourceJobMatchAnalysisId,
      textLength: answer.length,
      metadata: {
        questionId: saved.question.id,
        model: input.model,
        provider: input.provider,
      },
    });

    return saved;
  }
}
