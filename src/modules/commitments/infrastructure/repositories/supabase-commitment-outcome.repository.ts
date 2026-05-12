import type { SupabaseClient } from "@supabase/supabase-js";
import { EntityId, UserId } from "@/modules/shared";
import {
  CommitmentOutcome,
  type CommitmentOutcomePrimitives,
  type CommitmentOutcomeStatus,
  type CommitmentOutcomeType,
} from "../../domain/entities/commitment-outcome.entity";
import type { CommitmentOutcomeRepository } from "../../domain/repositories/commitment-outcome.repository";

interface CommitmentOutcomeRow {
  id: string;
  user_id: string;
  commitment_id: string;
  type: CommitmentOutcomeType;
  status: CommitmentOutcomeStatus;
  title: string;
  description: string | null;
  amount: number | string | null;
  currency: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToOutcome(row: CommitmentOutcomeRow): CommitmentOutcome {
  return CommitmentOutcome.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    commitmentId: row.commitment_id,
    type: row.type,
    status: row.status,
    title: row.title,
    description: row.description,
    amount: row.amount === null ? null : Number(row.amount),
    currency: row.currency,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function outcomeToRow(outcome: CommitmentOutcome): CommitmentOutcomeRow {
  const primitives: CommitmentOutcomePrimitives = outcome.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    commitment_id: primitives.commitmentId,
    type: primitives.type,
    status: primitives.status,
    title: primitives.title,
    description: primitives.description,
    amount: primitives.amount,
    currency: primitives.currency,
    decided_at: primitives.decidedAt,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export class SupabaseCommitmentOutcomeRepository implements CommitmentOutcomeRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async searchByUser(userId: UserId): Promise<CommitmentOutcome[]> {
    const { data, error } = await this.supabase
      .from("commitment_outcomes")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as CommitmentOutcomeRow[]).map(rowToOutcome);
  }

  async searchByCommitment(commitmentId: EntityId, userId: UserId): Promise<CommitmentOutcome[]> {
    const { data, error } = await this.supabase
      .from("commitment_outcomes")
      .select("*")
      .eq("commitment_id", commitmentId.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as CommitmentOutcomeRow[]).map(rowToOutcome);
  }

  async findById(id: EntityId, userId: UserId): Promise<CommitmentOutcome | null> {
    const { data, error } = await this.supabase
      .from("commitment_outcomes")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();
    if (error) throw error;
    return data ? rowToOutcome(data as CommitmentOutcomeRow) : null;
  }

  async save(outcome: CommitmentOutcome): Promise<CommitmentOutcome> {
    const { data, error } = await this.supabase
      .from("commitment_outcomes")
      .upsert(outcomeToRow(outcome), { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return rowToOutcome(data as CommitmentOutcomeRow);
  }

  async delete(id: EntityId, userId: UserId): Promise<void> {
    const { error } = await this.supabase
      .from("commitment_outcomes")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());
    if (error) throw error;
  }
}
