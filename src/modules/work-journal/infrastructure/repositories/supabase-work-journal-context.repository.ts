import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type {
  CreateContextInput,
  UpdateContextInput,
  WorkJournalContextRepository,
} from "../../domain/repositories/work-journal-context.repository";
import type { ContextType } from "../../domain/entities/journal-context.entity";

const contextKey = (type: ContextType, name: string) =>
  `${type}:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;

export class SupabaseWorkJournalContextRepository implements WorkJournalContextRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async list(userId: string): Promise<WorkJournalContext[]> {
    const { data, error } = await this.supabase
      .from("work_journal_contexts")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as WorkJournalContext[];
  }

  async getById(id: string, userId: string): Promise<WorkJournalContext | null> {
    const { data, error } = await this.supabase
      .from("work_journal_contexts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return (data as WorkJournalContext | null) ?? null;
  }

  async create(data: CreateContextInput): Promise<WorkJournalContext> {
    if (data.is_default) {
      await this.supabase
        .from("work_journal_contexts")
        .update({ is_default: false })
        .eq("user_id", data.user_id);
    }

    const { data: context, error } = await this.supabase
      .from("work_journal_contexts")
      .insert({
        user_id: data.user_id,
        type: data.type,
        name: data.name,
        role_or_label: data.role_or_label ?? null,
        is_default: data.is_default ?? false,
        created_from_cv: data.created_from_cv ?? false,
      })
      .select("*")
      .single();

    if (error) throw error;
    return context as WorkJournalContext;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateContextInput
  ): Promise<WorkJournalContext | null> {
    if (data.is_default) {
      await this.supabase
        .from("work_journal_contexts")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    const { data: context, error } = await this.supabase
      .from("work_journal_contexts")
      .update(data)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return (context as WorkJournalContext | null) ?? null;
  }

  async listHiddenSuggestionKeys(userId: string): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from("work_journal_hidden_context_suggestions")
      .select("type, name_key")
      .eq("user_id", userId);

    if (error) throw error;
    return new Set(
      (data ?? []).map((item) =>
        contextKey(item.type as ContextType, item.name_key as string)
      )
    );
  }

  async hideSuggestion(
    userId: string,
    input: { type: ContextType; name: string }
  ): Promise<void> {
    const { error } = await this.supabase
      .from("work_journal_hidden_context_suggestions")
      .upsert(
        {
          user_id: userId,
          type: input.type,
          name_key: input.name.trim().toLowerCase().replace(/\s+/g, " "),
        },
        { onConflict: "user_id,type,name_key" }
      );
    if (error) throw error;
  }

  async findLatestEntryContextId(userId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from("work_journal_entries")
      .select("context_id, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data?.context_id as string | undefined) ?? null;
  }
}
