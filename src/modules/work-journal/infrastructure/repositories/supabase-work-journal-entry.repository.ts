import type { SupabaseClient } from "@supabase/supabase-js";
import { UserId } from "@/modules/shared";
import {
  WorkJournalEntry,
  type WorkJournalEntryPrimitives,
} from "../../domain/entities/journal-entry.entity";
import type {
  WorkJournalEntryRepository,
  WorkJournalEntrySearchCriteria,
} from "../../domain/repositories/work-journal-entry.repository";
import {
  type EntryInputMode,
  WorkJournalContextId,
  WorkJournalDate,
  WorkJournalEntryId,
  WorkJournalFinalText,
  WorkJournalInputMode,
  WorkJournalNotes,
  WorkJournalOptionalDate,
  WorkJournalTimestamp,
  WorkJournalTopic,
} from "../../domain/value-objects/work-journal.value-object";

interface WorkJournalEntryRow {
  id: string;
  user_id: string;
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  input_mode: EntryInputMode;
  raw_notes: string;
  final_text: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryInput {
  user_id: string;
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  input_mode: EntryInputMode;
  raw_notes: string;
  final_text: string;
}

export interface UpdateEntryInput {
  context_id?: string;
  date_start?: string;
  date_end?: string | null;
  topic?: string | null;
  input_mode?: EntryInputMode;
  raw_notes?: string;
  final_text?: string;
}

export interface ListEntriesFilters {
  contextId?: string | null;
  search?: string | null;
  topic?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

function rowToPrimitives(row: WorkJournalEntryRow): WorkJournalEntryPrimitives {
  return {
    id: row.id,
    userId: row.user_id,
    contextId: row.context_id,
    dateStart: row.date_start,
    dateEnd: row.date_end,
    topic: row.topic,
    inputMode: row.input_mode,
    rawNotes: row.raw_notes,
    finalText: row.final_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function entryToRow(entry: WorkJournalEntry): WorkJournalEntryRow {
  const primitives = entry.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    context_id: primitives.contextId,
    date_start: primitives.dateStart,
    date_end: primitives.dateEnd,
    topic: primitives.topic,
    input_mode: primitives.inputMode,
    raw_notes: primitives.rawNotes,
    final_text: primitives.finalText,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

function rowToEntry(row: WorkJournalEntryRow): WorkJournalEntry {
  return WorkJournalEntry.fromPrimitives(rowToPrimitives(row));
}

function toEntryId(id: WorkJournalEntryId | string): WorkJournalEntryId {
  return typeof id === "string" ? WorkJournalEntryId.fromPrimitives(id) : id;
}

function toUserId(userId: UserId | string): UserId {
  return typeof userId === "string" ? UserId.fromPrimitives(userId) : userId;
}

export class SupabaseWorkJournalEntryRepository implements WorkJournalEntryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async search(criteria: WorkJournalEntrySearchCriteria): Promise<WorkJournalEntry[]> {
    let query = this.supabase
      .from("work_journal_entries")
      .select("*")
      .eq("user_id", criteria.userId.toPrimitives())
      .order("date_start", { ascending: false })
      .order("created_at", { ascending: false });

    if (criteria.contextId) query = query.eq("context_id", criteria.contextId.toPrimitives());
    const topic = criteria.topic?.toPrimitives();
    if (topic?.trim()) query = query.ilike("topic", `%${topic.trim()}%`);
    if (criteria.dateFrom) query = query.gte("date_start", criteria.dateFrom.toPrimitives());
    if (criteria.dateTo) query = query.lte("date_start", criteria.dateTo.toPrimitives());
    const search = criteria.search?.toPrimitives();
    if (search?.trim()) {
      const escaped = search.trim().replaceAll("%", "\\%");
      query = query.or(
        `raw_notes.ilike.%${escaped}%,final_text.ilike.%${escaped}%,topic.ilike.%${escaped}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as WorkJournalEntryRow[]).map(rowToEntry);
  }

  async findById(
    id: WorkJournalEntryId | string,
    userId: UserId | string
  ): Promise<WorkJournalEntry | null> {
    const entryId = toEntryId(id);
    const ownerId = toUserId(userId);
    const { data, error } = await this.supabase
      .from("work_journal_entries")
      .select("*")
      .eq("id", entryId.toPrimitives())
      .eq("user_id", ownerId.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    return data ? rowToEntry(data as WorkJournalEntryRow) : null;
  }

  async save(entry: WorkJournalEntry): Promise<WorkJournalEntry> {
    const { data, error } = await this.supabase
      .from("work_journal_entries")
      .upsert(entryToRow(entry), { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToEntry(data as WorkJournalEntryRow);
  }

  async delete(id: WorkJournalEntryId | string, userId: UserId | string): Promise<void> {
    const entryId = toEntryId(id);
    const ownerId = toUserId(userId);
    const { error } = await this.supabase
      .from("work_journal_entries")
      .delete()
      .eq("id", entryId.toPrimitives())
      .eq("user_id", ownerId.toPrimitives());

    if (error) throw error;
  }

  async list(userId: string, filters: ListEntriesFilters = {}): Promise<WorkJournalEntry[]> {
    return this.search({
      userId: UserId.fromPrimitives(userId),
      contextId: filters.contextId
        ? WorkJournalContextId.fromPrimitives(filters.contextId)
        : null,
      search: filters.search ? WorkJournalTopic.fromPrimitives(filters.search) : null,
      topic: filters.topic ? WorkJournalTopic.fromPrimitives(filters.topic) : null,
      dateFrom: filters.dateFrom ? WorkJournalDate.fromPrimitives(filters.dateFrom) : null,
      dateTo: filters.dateTo ? WorkJournalDate.fromPrimitives(filters.dateTo) : null,
    });
  }

  async getById(id: string, userId: string): Promise<WorkJournalEntry | null> {
    return this.findById(WorkJournalEntryId.fromPrimitives(id), UserId.fromPrimitives(userId));
  }

  async create(data: CreateEntryInput): Promise<WorkJournalEntry> {
    const now = new Date().toISOString();
    return this.save(
      WorkJournalEntry.create({
        id: WorkJournalEntryId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(data.user_id),
        contextId: WorkJournalContextId.fromPrimitives(data.context_id),
        dateStart: WorkJournalDate.fromPrimitives(data.date_start),
        dateEnd: WorkJournalOptionalDate.fromPrimitives(data.date_end),
        topic: WorkJournalTopic.fromPrimitives(data.topic),
        inputMode: WorkJournalInputMode.fromPrimitives(data.input_mode),
        rawNotes: WorkJournalNotes.fromPrimitives(data.raw_notes),
        finalText: WorkJournalFinalText.fromPrimitives(data.final_text),
        createdAt: WorkJournalTimestamp.fromPrimitives(now),
        updatedAt: WorkJournalTimestamp.fromPrimitives(now),
      })
    );
  }

  async update(
    id: string,
    userId: string,
    data: UpdateEntryInput
  ): Promise<WorkJournalEntry | null> {
    const entry = await this.getById(id, userId);
    if (!entry) return null;
    entry.update({
      contextId: data.context_id ? WorkJournalContextId.fromPrimitives(data.context_id) : undefined,
      dateStart: data.date_start ? WorkJournalDate.fromPrimitives(data.date_start) : undefined,
      dateEnd:
        data.date_end !== undefined
          ? WorkJournalOptionalDate.fromPrimitives(data.date_end)
          : undefined,
      topic: data.topic !== undefined ? WorkJournalTopic.fromPrimitives(data.topic) : undefined,
      inputMode: data.input_mode ? WorkJournalInputMode.fromPrimitives(data.input_mode) : undefined,
      rawNotes: data.raw_notes ? WorkJournalNotes.fromPrimitives(data.raw_notes) : undefined,
      finalText: data.final_text ? WorkJournalFinalText.fromPrimitives(data.final_text) : undefined,
    });
    return this.save(entry);
  }
}
