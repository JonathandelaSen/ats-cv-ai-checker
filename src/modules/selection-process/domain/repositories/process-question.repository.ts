import type { UserId } from "@/modules/shared";
import type { ProcessQuestion } from "../entities/process-question.entity";
import type { ProcessQuestionId } from "../value-objects/process-question-id.value-object";

export interface ProcessQuestionRelatedCV {
  id: string;
  name: string;
  filename: string | null;
  type: "uploaded" | "template";
}

export interface ProcessQuestionRelatedAnalysis {
  id: string;
  cv_id: string | null;
  title: string;
  filename: string;
  analysis_mode: "general" | "job_match";
  job_url: string | null;
  offer_status:
    | "interesante"
    | "aplicado"
    | "entrevista"
    | "oferta"
    | "rechazado"
    | "descartado"
    | null;
}

export interface ProcessQuestionReadModel {
  question: ProcessQuestion;
  cv: ProcessQuestionRelatedCV | null;
  analysis: ProcessQuestionRelatedAnalysis | null;
}

export interface ProcessQuestionSearchCriteria {
  userId: UserId;
  search?: string | null;
  legacyCvId?: string | null;
  sourceJobMatchAnalysisId?: string | null;
  answered?: boolean | null;
}

export interface ProcessQuestionRepository {
  search(criteria: ProcessQuestionSearchCriteria): Promise<ProcessQuestionReadModel[]>;
  findById(
    id: ProcessQuestionId,
    userId: UserId
  ): Promise<ProcessQuestionReadModel | null>;
  save(question: ProcessQuestion): Promise<ProcessQuestionReadModel>;
  delete(id: ProcessQuestionId, userId: UserId): Promise<boolean>;
}
