import type { SupabaseClient } from "@supabase/supabase-js";
import { EntityId, UserId } from "@/modules/shared";
import {
  CommitmentItem,
  type CommitmentItemPrimitives,
  type CommitmentItemStatus,
} from "../../domain/entities/commitment-item.entity";
import type { CommitmentItemRepository } from "../../domain/repositories/commitment-item.repository";

interface CommitmentItemRow {
  id: string;
  user_id: string;
  commitment_id: string;
  title: string;
  notes: string | null;
  evidence_notes: string | null;
  status: CommitmentItemStatus;
  due_date: string | null;
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

function rowToItem(row: CommitmentItemRow): CommitmentItem {
  return CommitmentItem.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    commitmentId: row.commitment_id,
    title: row.title,
    notes: row.notes,
    evidenceNotes: row.evidence_notes,
    status: row.status,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function itemToRow(item: CommitmentItem): CommitmentItemRow {
  const primitives: CommitmentItemPrimitives = item.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    commitment_id: primitives.commitmentId,
    title: primitives.title,
    notes: primitives.notes,
    evidence_notes: primitives.evidenceNotes,
    status: primitives.status,
    due_date: primitives.dueDate,
    completed_at: primitives.completedAt,
    order_index: primitives.orderIndex,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export class SupabaseCommitmentItemRepository implements CommitmentItemRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async searchByUser(userId: UserId): Promise<CommitmentItem[]> {
    const { data, error } = await this.supabase
      .from("commitment_items")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as CommitmentItemRow[]).map(rowToItem);
  }

  async searchByCommitment(commitmentId: EntityId, userId: UserId): Promise<CommitmentItem[]> {
    const { data, error } = await this.supabase
      .from("commitment_items")
      .select("*")
      .eq("commitment_id", commitmentId.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as CommitmentItemRow[]).map(rowToItem);
  }

  async findById(id: EntityId, userId: UserId): Promise<CommitmentItem | null> {
    const { data, error } = await this.supabase
      .from("commitment_items")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();
    if (error) throw error;
    return data ? rowToItem(data as CommitmentItemRow) : null;
  }

  async save(item: CommitmentItem): Promise<CommitmentItem> {
    const { data, error } = await this.supabase
      .from("commitment_items")
      .upsert(itemToRow(item), { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return rowToItem(data as CommitmentItemRow);
  }

  async delete(id: EntityId, userId: UserId): Promise<void> {
    const { error } = await this.supabase
      .from("commitment_items")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());
    if (error) throw error;
  }
}
