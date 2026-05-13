import { BoundSupabaseRepository, type UserId } from "@/modules/shared";
import { FollowUp } from "../../domain/entities/follow-up.entity";
import type { FollowUpRepository } from "../../domain/repositories/follow-up.repository";

interface FollowUpRow {
  id: string;
  user_id: string;
  job_opportunity_id: string;
  status: "interesante" | "aplicado" | "entrevista" | "oferta" | "rechazado" | "descartado";
  notes: string | null;
  next_action: string | null;
  next_action_at: string | null;
  source_job_match_analysis_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToFollowUp(row: FollowUpRow): FollowUp {
  return FollowUp.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    jobOpportunityId: row.job_opportunity_id,
    status: row.status,
    notes: row.notes,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    sourceJobMatchAnalysisId: row.source_job_match_analysis_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function followUpToRow(followUp: FollowUp): FollowUpRow {
  const primitives = followUp.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    job_opportunity_id: primitives.jobOpportunityId,
    status: primitives.status,
    notes: primitives.notes,
    next_action: primitives.nextAction,
    next_action_at: primitives.nextActionAt,
    source_job_match_analysis_id: primitives.sourceJobMatchAnalysisId,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export class SupabaseFollowUpRepository
  extends BoundSupabaseRepository
  implements FollowUpRepository
{
  async findBySourceJobMatchAnalysisId(
    analysisId: string,
    userId: UserId
  ): Promise<FollowUp | null> {
    const { data, error } = await this.client
      .from("follow_ups")
      .select("*")
      .eq("source_job_match_analysis_id", analysisId)
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    if (data) return rowToFollowUp(data as FollowUpRow);

    const { data: analysis, error: analysisError } = await this.client
      .from("analyses")
      .select(
        "id, user_id, title, job_description, job_url, job_key_data, offer_status, offer_notes, offer_next_action, offer_next_action_at, created_at, updated_at, analysis_mode"
      )
      .eq("id", analysisId)
      .eq("user_id", userId.toPrimitives())
      .eq("analysis_mode", "job_match")
      .maybeSingle();

    if (analysisError) throw analysisError;
    if (!analysis) return null;

    const jobKeyData = (analysis.job_key_data ?? {}) as Record<string, unknown>;
    const arrayField = (key: string) =>
      Array.isArray(jobKeyData[key])
        ? (jobKeyData[key] as unknown[]).filter(
            (item): item is string => typeof item === "string"
          )
        : [];

    const opportunityRow = {
      user_id: analysis.user_id,
      title:
        typeof jobKeyData.title === "string" ? jobKeyData.title : analysis.title,
      company: typeof jobKeyData.company === "string" ? jobKeyData.company : null,
      location: typeof jobKeyData.location === "string" ? jobKeyData.location : null,
      remote: typeof jobKeyData.remote === "string" ? jobKeyData.remote : null,
      salary: typeof jobKeyData.salary === "string" ? jobKeyData.salary : null,
      seniority:
        typeof jobKeyData.seniority === "string" ? jobKeyData.seniority : null,
      contract_type:
        typeof jobKeyData.contractType === "string" ? jobKeyData.contractType : null,
      benefits: arrayField("benefits"),
      requirements: arrayField("requirements"),
      responsibilities: arrayField("responsibilities"),
      notable_points: arrayField("notablePoints"),
      description: analysis.job_description,
      url: analysis.job_url,
      source_job_match_analysis_id: analysis.id,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at,
    };

    const { data: existingOpportunity, error: existingOpportunityError } =
      await this.client
        .from("job_opportunities")
        .select("id")
        .eq("source_job_match_analysis_id", analysis.id)
        .maybeSingle();
    if (existingOpportunityError) throw existingOpportunityError;

    const opportunityQuery = existingOpportunity
      ? this.client
          .from("job_opportunities")
          .update(opportunityRow)
          .eq("id", existingOpportunity.id)
      : this.client.from("job_opportunities").insert(opportunityRow);

    const { data: opportunity, error: opportunityError } = await opportunityQuery
      .select("id")
      .single();

    if (opportunityError) throw opportunityError;

    const { data: created, error: followUpError } = await this.client
      .from("follow_ups")
      .upsert(
        {
          user_id: analysis.user_id,
          job_opportunity_id: opportunity.id,
          status: analysis.offer_status ?? "interesante",
          notes: analysis.offer_notes,
          next_action: analysis.offer_next_action,
          next_action_at: analysis.offer_next_action_at,
          source_job_match_analysis_id: analysis.id,
          created_at: analysis.created_at,
          updated_at: analysis.updated_at,
        },
        { onConflict: "user_id,job_opportunity_id" }
      )
      .select("*")
      .single();

    if (followUpError) throw followUpError;
    return rowToFollowUp(created as FollowUpRow);
  }

  async save(followUp: FollowUp): Promise<FollowUp> {
    const { data, error } = await this.client
      .from("follow_ups")
      .upsert(followUpToRow(followUp), { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToFollowUp(data as FollowUpRow);
  }
}
