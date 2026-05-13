import { BoundSupabaseRepository, type UserId } from "@/modules/shared";
import { ProcessQuestion } from "../../domain/entities/process-question.entity";
import type {
  ProcessQuestionReadModel,
  ProcessQuestionRelatedAnalysis,
  ProcessQuestionRelatedCV,
  ProcessQuestionRepository,
  ProcessQuestionSearchCriteria,
} from "../../domain/repositories/process-question.repository";
import type { ProcessQuestionId } from "../../domain/value-objects/process-question-id.value-object";

interface ProcessQuestionRow {
  id: string;
  user_id: string;
  job_opportunity_id: string | null;
  question: string;
  context: string | null;
  answer: string | null;
  ai_model: string | null;
  ai_generated_at: string | null;
  source_job_match_analysis_id: string | null;
  legacy_interview_question_id: string | null;
  legacy_cv_id: string | null;
  created_at: string;
  updated_at: string;
  cv?: ProcessQuestionRelatedCV | null;
  analysis?: ProcessQuestionRelatedAnalysis | null;
}

const PROCESS_QUESTION_SELECT = `
  *,
  cv:cvs(id, name, filename, type),
  analysis:analyses(id, cv_id, title, filename, analysis_mode, job_url, offer_status)
`;

function rowToQuestion(row: ProcessQuestionRow): ProcessQuestion {
  return ProcessQuestion.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    jobOpportunityId: row.job_opportunity_id,
    question: row.question,
    context: row.context,
    answer: row.answer,
    aiModel: row.ai_model,
    aiGeneratedAt: row.ai_generated_at,
    sourceJobMatchAnalysisId: row.source_job_match_analysis_id,
    legacyInterviewQuestionId: row.legacy_interview_question_id,
    legacyCvId: row.legacy_cv_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function questionToRow(question: ProcessQuestion): Omit<ProcessQuestionRow, "cv" | "analysis"> {
  const primitives = question.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    job_opportunity_id: primitives.jobOpportunityId,
    question: primitives.question,
    context: primitives.context,
    answer: primitives.answer,
    ai_model: primitives.aiModel,
    ai_generated_at: primitives.aiGeneratedAt,
    source_job_match_analysis_id: primitives.sourceJobMatchAnalysisId,
    legacy_interview_question_id: primitives.legacyInterviewQuestionId,
    legacy_cv_id: primitives.legacyCvId,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

function rowToReadModel(row: ProcessQuestionRow): ProcessQuestionReadModel {
  return {
    question: rowToQuestion(row),
    cv: row.cv ?? null,
    analysis: row.analysis ?? null,
  };
}

export class SupabaseProcessQuestionRepository
  extends BoundSupabaseRepository
  implements ProcessQuestionRepository
{
  async search(criteria: ProcessQuestionSearchCriteria): Promise<ProcessQuestionReadModel[]> {
    let query = this.client
      .from("process_questions")
      .select(PROCESS_QUESTION_SELECT)
      .eq("user_id", criteria.userId.toPrimitives())
      .order("created_at", { ascending: false });

    if (criteria.search?.trim()) {
      const search = criteria.search.trim().replaceAll("%", "\\%");
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }
    if (criteria.legacyCvId) query = query.eq("legacy_cv_id", criteria.legacyCvId);
    if (criteria.sourceJobMatchAnalysisId) {
      query = query.eq(
        "source_job_match_analysis_id",
        criteria.sourceJobMatchAnalysisId
      );
    }
    if (criteria.answered === true) query = query.not("answer", "is", null);
    if (criteria.answered === false) query = query.is("answer", null);

    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as ProcessQuestionRow[]).map(rowToReadModel);
  }

  async findById(
    id: ProcessQuestionId,
    userId: UserId
  ): Promise<ProcessQuestionReadModel | null> {
    const { data, error } = await this.client
      .from("process_questions")
      .select(PROCESS_QUESTION_SELECT)
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    return data ? rowToReadModel(data as ProcessQuestionRow) : null;
  }

  async save(question: ProcessQuestion): Promise<ProcessQuestionReadModel> {
    const { data, error } = await this.client
      .from("process_questions")
      .upsert(questionToRow(question), { onConflict: "id" })
      .select(PROCESS_QUESTION_SELECT)
      .single();

    if (error) throw error;
    return rowToReadModel(data as ProcessQuestionRow);
  }

  async delete(id: ProcessQuestionId, userId: UserId): Promise<boolean> {
    const { error, count } = await this.client
      .from("process_questions")
      .delete({ count: "exact" })
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());

    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
