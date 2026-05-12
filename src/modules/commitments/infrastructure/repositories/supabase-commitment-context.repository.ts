import type { SupabaseClient } from "@supabase/supabase-js";
import { EntityId, UserId } from "@/modules/shared";
import {
  CommitmentContext,
  type CommitmentContextPrimitives,
  type CommitmentContextStatus,
  type CommitmentContextType,
} from "../../domain/entities/commitment-context.entity";
import type { CommitmentContextRepository } from "../../domain/repositories/commitment-context.repository";

interface CommitmentContextRow {
  id: string;
  user_id: string;
  type: CommitmentContextType;
  name: string;
  role_or_label: string | null;
  status: CommitmentContextStatus;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

function rowToContext(row: CommitmentContextRow): CommitmentContext {
  return CommitmentContext.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    roleOrLabel: row.role_or_label,
    status: row.status,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function contextToRow(context: CommitmentContext): CommitmentContextRow {
  const primitives: CommitmentContextPrimitives = context.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    type: primitives.type,
    name: primitives.name,
    role_or_label: primitives.roleOrLabel,
    status: primitives.status,
    is_default: primitives.isDefault,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export class SupabaseCommitmentContextRepository implements CommitmentContextRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async search(userId: UserId): Promise<CommitmentContext[]> {
    const { data, error } = await this.supabase
      .from("commitment_contexts")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .order("status", { ascending: true })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as CommitmentContextRow[]).map(rowToContext);
  }

  async findById(id: EntityId, userId: UserId): Promise<CommitmentContext | null> {
    const { data, error } = await this.supabase
      .from("commitment_contexts")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();
    if (error) throw error;
    return data ? rowToContext(data as CommitmentContextRow) : null;
  }

  async findDefault(userId: UserId): Promise<CommitmentContext | null> {
    const { data, error } = await this.supabase
      .from("commitment_contexts")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .eq("is_default", true)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    return data ? rowToContext(data as CommitmentContextRow) : null;
  }

  async save(context: CommitmentContext): Promise<CommitmentContext> {
    const { data, error } = await this.supabase
      .from("commitment_contexts")
      .upsert(contextToRow(context), { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return rowToContext(data as CommitmentContextRow);
  }

  async delete(id: EntityId, userId: UserId): Promise<void> {
    const { error } = await this.supabase
      .from("commitment_contexts")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());
    if (error) throw error;
  }
}
