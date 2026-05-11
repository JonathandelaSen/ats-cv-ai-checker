import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FeedbackEntry,
  type FeedbackEntryPrimitives,
} from "../../domain/entities/feedback-entry.entity";
import type { FeedbackEntryRepository } from "../../domain/repositories/feedback-entry.repository";

type FeedbackEntryRow = FeedbackEntryPrimitives;

function rowToEntry(row: FeedbackEntryRow): FeedbackEntry {
  return FeedbackEntry.fromPrimitives(row);
}

export class SupabaseFeedbackEntryRepository implements FeedbackEntryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listByFeedback(feedbackId: string, userId: string): Promise<FeedbackEntry[]> {
    const { data, error } = await this.supabase
      .from("feedback_notes_entries")
      .select("*")
      .eq("feedback_id", feedbackId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as FeedbackEntryRow[]).map(rowToEntry);
  }

  async findById(id: string, userId: string): Promise<FeedbackEntry | null> {
    const { data, error } = await this.supabase
      .from("feedback_notes_entries")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToEntry(data as FeedbackEntryRow) : null;
  }

  async save(entry: FeedbackEntry): Promise<FeedbackEntry> {
    const { data, error } = await this.supabase
      .from("feedback_notes_entries")
      .upsert(entry.toPrimitives(), { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToEntry(data as FeedbackEntryRow);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("feedback_notes_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  }
}
