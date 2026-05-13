import type {
  ProcessQuestionReadModel,
  ProcessQuestionRelatedAnalysis,
  ProcessQuestionRelatedCV,
} from "../../domain/repositories/process-question.repository";

export interface ProcessQuestionResponse {
  id: string;
  user_id: string;
  question: string;
  context: string | null;
  answer: string | null;
  cv_id: string | null;
  analysis_id: string | null;
  ai_model: string | null;
  ai_generated_at: string | null;
  created_at: string;
  updated_at: string;
  cv?: ProcessQuestionRelatedCV | null;
  analysis?: ProcessQuestionRelatedAnalysis | null;
}

export function presentProcessQuestion(
  readModel: ProcessQuestionReadModel
): ProcessQuestionResponse {
  const primitives = readModel.question.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    question: primitives.question,
    context: primitives.context,
    answer: primitives.answer,
    cv_id: primitives.legacyCvId,
    analysis_id: primitives.sourceJobMatchAnalysisId,
    ai_model: primitives.aiModel,
    ai_generated_at: primitives.aiGeneratedAt,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
    cv: readModel.cv,
    analysis: readModel.analysis,
  };
}

export function presentProcessQuestions(
  readModels: ProcessQuestionReadModel[]
): ProcessQuestionResponse[] {
  return readModels.map(presentProcessQuestion);
}
