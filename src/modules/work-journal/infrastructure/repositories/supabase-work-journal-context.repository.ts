import type { SupabaseClient } from "@supabase/supabase-js";
import { Timestamp, UserId } from "@/modules/shared";
import {
  WorkJournalContext,
  type WorkJournalContextPrimitives,
} from "../../domain/entities/journal-context.entity";
import {
  type WorkJournalContextRepository,
  type WorkJournalContextSearchCriteria,
} from "../../domain/repositories/work-journal-context.repository";
import { WorkJournalContextSuggestion } from "../../domain/value-objects/context-suggestion.value-object";
import { WorkJournalContextId } from "../../domain/value-objects/work-journal-context-id.value-object";
import { WorkJournalContextName } from "../../domain/value-objects/work-journal-context-name.value-object";
import { type ContextStatus, WorkJournalContextStatus } from "../../domain/value-objects/work-journal-context-status.value-object";
import { type ContextType, WorkJournalContextType } from "../../domain/value-objects/work-journal-context-type.value-object";
import { WorkJournalCreatedFromCv } from "../../domain/value-objects/work-journal-created-from-cv.value-object";
import { WorkJournalIsDefault } from "../../domain/value-objects/work-journal-is-default.value-object";
import { WorkJournalRoleOrLabel } from "../../domain/value-objects/work-journal-role-or-label.value-object";
import { WorkJournalSuggestionKey } from "../../domain/value-objects/work-journal-suggestion-key.value-object";

interface WorkJournalContextRow {
  id: string;
  user_id: string;
  type: ContextType;
  name: string;
  role_or_label: string | null;
  status: ContextStatus;
  is_default: boolean;
  created_from_cv: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateContextInput {
  user_id: string;
  type: ContextType;
  name: string;
  role_or_label?: string | null;
  is_default?: boolean;
  created_from_cv?: boolean;
}

export interface UpdateContextInput {
  name?: string;
  role_or_label?: string | null;
  status?: ContextStatus;
  is_default?: boolean;
}

const contextKey = (type: ContextType, name: string) =>
  `${type}:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;

function toUserId(userId: UserId | string): UserId {
  return typeof userId === "string" ? UserId.fromPrimitives(userId) : userId;
}

function rowToPrimitives(row: WorkJournalContextRow): WorkJournalContextPrimitives {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    roleOrLabel: row.role_or_label,
    status: row.status,
    isDefault: row.is_default,
    createdFromCv: row.created_from_cv,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function contextToRow(context: WorkJournalContext): WorkJournalContextRow {
  const primitives = context.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    type: primitives.type,
    name: primitives.name,
    role_or_label: primitives.roleOrLabel,
    status: primitives.status,
    is_default: primitives.isDefault,
    created_from_cv: primitives.createdFromCv,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

function rowToContext(row: WorkJournalContextRow): WorkJournalContext {
  return WorkJournalContext.fromPrimitives(rowToPrimitives(row));
}

export class SupabaseWorkJournalContextRepository implements WorkJournalContextRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async search(criteria: WorkJournalContextSearchCriteria): Promise<WorkJournalContext[]> {
    const { data, error } = await this.supabase
      .from("work_journal_contexts")
      .select("*")
      .eq("user_id", criteria.userId.toPrimitives())
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as WorkJournalContextRow[]).map(rowToContext);
  }

  async findById(
    id: WorkJournalContextId,
    userId: UserId
  ): Promise<WorkJournalContext | null> {
    const { data, error } = await this.supabase
      .from("work_journal_contexts")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    return data ? rowToContext(data as WorkJournalContextRow) : null;
  }

  async save(context: WorkJournalContext): Promise<WorkJournalContext> {
    const row = contextToRow(context);

    if (row.is_default) {
      await this.supabase
        .from("work_journal_contexts")
        .update({ is_default: false })
        .eq("user_id", row.user_id)
        .neq("id", row.id);
    }

    const { data, error } = await this.supabase
      .from("work_journal_contexts")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToContext(data as WorkJournalContextRow);
  }

  async delete(id: WorkJournalContextId, userId: UserId): Promise<void> {
    const { error } = await this.supabase
      .from("work_journal_contexts")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());

    if (error) throw error;
  }

  async listHiddenSuggestionKeys(
    userId: UserId | string
  ): Promise<Set<WorkJournalSuggestionKey>> {
    const ownerId = toUserId(userId);
    const { data, error } = await this.supabase
      .from("work_journal_hidden_context_suggestions")
      .select("type, name_key")
      .eq("user_id", ownerId.toPrimitives());

    if (error) throw error;
    return new Set(
      (data ?? []).map((item) =>
        WorkJournalSuggestionKey.fromPrimitives(
          contextKey(item.type as ContextType, item.name_key as string)
        )
      )
    );
  }

  async hideSuggestion(
    userId: UserId | string,
    suggestion: WorkJournalContextSuggestion | { type: ContextType; name: string }
  ): Promise<void> {
    const ownerId = toUserId(userId);
    const suggestionType = suggestion.type;
    const suggestionName = suggestion.name;
    const { error } = await this.supabase
      .from("work_journal_hidden_context_suggestions")
      .upsert(
        {
          user_id: ownerId.toPrimitives(),
          type: suggestionType,
          name_key: suggestionName.trim().toLowerCase().replace(/\s+/g, " "),
        },
        { onConflict: "user_id,type,name_key" }
      );
    if (error) throw error;
  }

  async findLatestEntryContextId(userId: UserId | string): Promise<WorkJournalContextId | null> {
    const ownerId = toUserId(userId);
    const { data } = await this.supabase
      .from("work_journal_entries")
      .select("context_id, updated_at")
      .eq("user_id", ownerId.toPrimitives())
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.context_id
      ? WorkJournalContextId.fromPrimitives(data.context_id as string)
      : null;
  }

  async list(userId: string): Promise<WorkJournalContext[]> {
    return this.search({ userId: UserId.fromPrimitives(userId) });
  }

  async getById(id: string, userId: string): Promise<WorkJournalContext | null> {
    return this.findById(
      WorkJournalContextId.fromPrimitives(id),
      UserId.fromPrimitives(userId)
    );
  }

  async create(data: CreateContextInput): Promise<WorkJournalContext> {
    const now = new Date().toISOString();
    return this.save(
      WorkJournalContext.create({
        id: WorkJournalContextId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(data.user_id),
        type: WorkJournalContextType.fromPrimitives(data.type),
        name: WorkJournalContextName.fromPrimitives(data.name),
        roleOrLabel: WorkJournalRoleOrLabel.fromPrimitives(data.role_or_label ?? null),
        status: WorkJournalContextStatus.fromPrimitives("active"),
        isDefault: WorkJournalIsDefault.fromPrimitives(data.is_default ?? false),
        createdFromCv: WorkJournalCreatedFromCv.fromPrimitives(data.created_from_cv ?? false),
        createdAt: Timestamp.fromPrimitives(now),
        updatedAt: Timestamp.fromPrimitives(now),
      })
    );
  }

  async update(
    id: string,
    userId: string,
    data: UpdateContextInput
  ): Promise<WorkJournalContext | null> {
    const context = await this.getById(id, userId);
    if (!context) return null;
    context.update({
      name: data.name ? WorkJournalContextName.fromPrimitives(data.name) : undefined,
      roleOrLabel:
        data.role_or_label !== undefined
          ? WorkJournalRoleOrLabel.fromPrimitives(data.role_or_label)
          : undefined,
      status: data.status ? WorkJournalContextStatus.fromPrimitives(data.status) : undefined,
      isDefault:
        data.is_default !== undefined
          ? WorkJournalIsDefault.fromPrimitives(data.is_default)
          : undefined,
    });
    return this.save(context);
  }
}
