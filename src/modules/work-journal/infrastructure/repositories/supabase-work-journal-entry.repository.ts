import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type {
  CreateEntryInput,
  ListEntriesFilters,
  UpdateEntryInput,
  WorkJournalEntryRepository,
} from "../../domain/repositories/work-journal-entry.repository";

const WORK_JOURNAL_ENTRY_SELECT = "*, context:work_journal_contexts(*)";

function normalizeWorkJournalEntry(row: Record<string, unknown>): WorkJournalEntry {
  return {
    ...(row as unknown as WorkJournalEntry),
    context:
      ((row.context ?? row.work_journal_contexts ?? null) as WorkJournalContext | null) ?? null,
  };
}

export class SupabaseWorkJournalEntryRepository implements WorkJournalEntryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async list(userId: string, filters: ListEntriesFilters = {}): Promise<WorkJournalEntry[]> {
    let query = this.supabase
      .from("work_journal_entries")
      .select(WORK_JOURNAL_ENTRY_SELECT)
      .eq("user_id", userId)
      .order("date_start", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.contextId) query = query.eq("context_id", filters.contextId);
    if (filters.topic?.trim()) query = query.ilike("topic", `%${filters.topic.trim()}%`);
    if (filters.dateFrom) query = query.gte("date_start", filters.dateFrom);
    if (filters.dateTo) query = query.lte("date_start", filters.dateTo);
    if (filters.search?.trim()) {
      const search = filters.search.trim().replaceAll("%", "\\%");
      query = query.or(
        `raw_notes.ilike.%${search}%,final_text.ilike.%${search}%,topic.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) =>
      normalizeWorkJournalEntry(row as Record<string, unknown>)
    );
  }

  async getById(id: string, userId: string): Promise<WorkJournalEntry | null> {
    const { data, error } = await this.supabase
      .from("work_journal_entries")
      .select(WORK_JOURNAL_ENTRY_SELECT)
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeWorkJournalEntry(data as Record<string, unknown>) : null;
  }

  async create(data: CreateEntryInput): Promise<WorkJournalEntry> {
    const { data: entry, error } = await this.supabase
      .from("work_journal_entries")
      .insert(data)
      .select(WORK_JOURNAL_ENTRY_SELECT)
      .single();

    if (error) throw error;
    return normalizeWorkJournalEntry(entry as Record<string, unknown>);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateEntryInput
  ): Promise<WorkJournalEntry | null> {
    const { data: entry, error } = await this.supabase
      .from("work_journal_entries")
      .update(data)
      .eq("id", id)
      .eq("user_id", userId)
      .select(WORK_JOURNAL_ENTRY_SELECT)
      .maybeSingle();

    if (error) throw error;
    return entry ? normalizeWorkJournalEntry(entry as Record<string, unknown>) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from("work_journal_entries")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
