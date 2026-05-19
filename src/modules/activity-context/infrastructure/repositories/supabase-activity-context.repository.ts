import { BoundSupabaseRepository, EntityId, UserId } from "@/modules/shared";
import { ActivityContext, type ActivityContextPrimitives, type ActivityContextStatus, type ActivityContextType } from "../../domain/entities/activity-context.entity";
import type { ActivityContextRepository } from "../../domain/repositories/activity-context.repository";
import { activityContextSuggestionKey } from "../../domain/services/suggest-activity-contexts.service";

interface ActivityContextRow {
  id: string;
  user_id: string;
  type: ActivityContextType;
  name: string;
  status: ActivityContextStatus;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

function rowToContext(row: ActivityContextRow): ActivityContext {
  return ActivityContext.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    status: row.status,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function contextToRow(context: ActivityContext): ActivityContextRow {
  const primitives: ActivityContextPrimitives = context.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    type: primitives.type,
    name: primitives.name,
    status: primitives.status,
    is_default: primitives.isDefault,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export class SupabaseActivityContextRepository extends BoundSupabaseRepository implements ActivityContextRepository {
  async search(userId: UserId): Promise<ActivityContext[]> {
    const { data, error } = await this.client
      .from("activity_contexts")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as ActivityContextRow[]).map(rowToContext);
  }

  async findById(id: EntityId, userId: UserId): Promise<ActivityContext | null> {
    const { data, error } = await this.client
      .from("activity_contexts")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();
    if (error) throw error;
    return data ? rowToContext(data as ActivityContextRow) : null;
  }

  async findDefault(userId: UserId): Promise<ActivityContext | null> {
    const { data, error } = await this.client
      .from("activity_contexts")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .eq("is_default", true)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToContext(data as ActivityContextRow) : null;
  }

  async save(context: ActivityContext): Promise<ActivityContext> {
    const { data, error } = await this.client
      .from("activity_contexts")
      .upsert(contextToRow(context), { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return rowToContext(data as ActivityContextRow);
  }

  async reassignRecordsToDefault(input: {
    userId: UserId;
    sourceContextId: EntityId;
    defaultContextId: EntityId;
  }): Promise<number> {
    const { data, error } = await this.client.rpc("reassign_activity_context_records", {
      p_user_id: input.userId.toPrimitives(),
      p_source_context_id: input.sourceContextId.toPrimitives(),
      p_default_context_id: input.defaultContextId.toPrimitives(),
    });
    if (error) throw error;
    return Number(data ?? 0);
  }

  async countAssignedRecords(id: EntityId, userId: UserId): Promise<number> {
    const { data, error } = await this.client.rpc("count_activity_context_records", {
      p_user_id: userId.toPrimitives(),
      p_context_id: id.toPrimitives(),
    });
    if (error) throw error;
    return Number(data ?? 0);
  }

  async listHiddenSuggestionKeys(userId: UserId): Promise<Set<string>> {
    const { data, error } = await this.client
      .from("work_journal_hidden_context_suggestions")
      .select("type, name_key")
      .eq("user_id", userId.toPrimitives());
    if (error) throw error;
    return new Set(
      (data ?? []).map((item) =>
        activityContextSuggestionKey(
          item.type as ActivityContextType,
          item.name_key as string
        )
      )
    );
  }

  async hideSuggestion(
    userId: UserId,
    input: { type: string; name: string }
  ): Promise<void> {
    const { error } = await this.client
      .from("work_journal_hidden_context_suggestions")
      .upsert(
        {
          user_id: userId.toPrimitives(),
          type: input.type,
          name_key: input.name.trim().toLowerCase().replace(/\s+/g, " "),
        },
        { onConflict: "user_id,type,name_key" }
      );
    if (error) throw error;
  }

  async delete(id: EntityId, userId: UserId): Promise<void> {
    const { error } = await this.client
      .from("activity_contexts")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());
    if (error) throw error;
  }
}
