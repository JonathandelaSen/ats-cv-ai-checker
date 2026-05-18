export interface InterviewQuestionRelatedCVResponse {
  id: string;
  name: string;
  filename: string | null;
}

export interface InterviewQuestionRelatedAnalysisResponse {
  id: string;
  title: string;
  analysisMode: string;
}

export interface InterviewQuestionResponse {
  id: string;
  userId: string;
  question: string;
  context: string | null;
  answer: string | null;
  cvId: string | null;
  analysisId: string | null;
  aiModel: string | null;
  aiGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
  cv?: InterviewQuestionRelatedCVResponse | null;
  analysis?: InterviewQuestionRelatedAnalysisResponse | null;
}

interface InterviewQuestionPresenterOutput {
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
  cv?: {
    id: string;
    name: string;
    filename: string | null;
  } | null;
  analysis?: {
    id: string;
    title: string;
    analysis_mode: string;
  } | null;
}

export type ListInterviewQuestionsResponse = InterviewQuestionResponse[];
export type GetInterviewQuestionResponse = InterviewQuestionResponse;
export type SaveInterviewQuestionResponse = InterviewQuestionResponse;
export type GenerateInterviewQuestionResponse = InterviewQuestionResponse | null;
export type EditInterviewQuestionResponse = InterviewQuestionResponse | null;

export interface DeleteInterviewQuestionResponse {
  ok: true;
}

export interface InterviewQuestionOptionsResponse {
  cvs: Array<{
    id: string;
    name: string;
  }>;
  analyses: Array<{
    id: string;
    title: string;
    analysisMode: "job_match";
  }>;
}

export function toInterviewQuestionResponse(
  input: InterviewQuestionPresenterOutput
): InterviewQuestionResponse {
  return {
    id: input.id,
    userId: input.user_id,
    question: input.question,
    context: input.context,
    answer: input.answer,
    cvId: input.cv_id,
    analysisId: input.analysis_id,
    aiModel: input.ai_model,
    aiGeneratedAt: input.ai_generated_at,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    cv: input.cv
      ? {
          id: input.cv.id,
          name: input.cv.name,
          filename: input.cv.filename,
        }
      : null,
    analysis: input.analysis
      ? {
          id: input.analysis.id,
          title: input.analysis.title,
          analysisMode: input.analysis.analysis_mode,
        }
      : null,
  };
}

export function toInterviewQuestionResponses(
  input: InterviewQuestionPresenterOutput[]
): ListInterviewQuestionsResponse {
  return input.map(toInterviewQuestionResponse);
}
