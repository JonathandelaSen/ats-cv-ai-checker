import type { SupabaseClient } from "@supabase/supabase-js";
import { EntityId, UserId } from "@/modules/shared";
import {
  Commitment,
  type CommitmentPrimitives,
  type CommitmentPriority,
  type CommitmentSource,
  type CommitmentStatus,
} from "../../domain/entities/commitment.entity";
import type { CommitmentRepository } from "../../domain/repositories/commitment.repository";

interface CommitmentRow {
  id: string;
  user_id: string;
  context_id: string;
  title: string;
  description: string | null;
  success_criteria: string | null;
  result_notes: string | null;
  source: CommitmentSource;
  status: CommitmentStatus;
  priority: CommitmentPriority | null;
  start_date: string;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

function rowToCommitment(row: CommitmentRow): Commitment {
  return Commitment.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    contextId: row.context_id,
    title: row.title,
    description: row.description,
    successCriteria: row.success_criteria,
    resultNotes: row.result_notes,
    source: row.source,
    status: row.status,
    priority: row.priority,
    startDate: row.start_date,
    targetDate: row.target_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function commitmentToRow(commitment: Commitment): CommitmentRow {
  const primitives: CommitmentPrimitives = commitment.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    context_id: primitives.contextId,
    title: primitives.title,
    description: primitives.description,
    success_criteria: primitives.successCriteria,
    result_notes: primitives.resultNotes,
    source: primitives.source,
    status: primitives.status,
    priority: primitives.priority,
    start_date: primitives.startDate,
    target_date: primitives.targetDate,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export class SupabaseCommitmentRepository implements CommitmentRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async search(userId: UserId): Promise<Commitment[]> {
    const { data, error } = await this.supabase
      .from("commitments")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as CommitmentRow[]).map(rowToCommitment);
  }

  async findById(id: EntityId, userId: UserId): Promise<Commitment | null> {
    const { data, error } = await this.supabase
      .from("commitments")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();
    if (error) throw error;
    return data ? rowToCommitment(data as CommitmentRow) : null;
  }

  async save(commitment: Commitment): Promise<Commitment> {
    const { data, error } = await this.supabase
      .from("commitments")
      .upsert(commitmentToRow(commitment), { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return rowToCommitment(data as CommitmentRow);
  }

  async delete(id: EntityId, userId: UserId): Promise<void> {
    const { error } = await this.supabase
      .from("commitments")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());
    if (error) throw error;
  }
}
