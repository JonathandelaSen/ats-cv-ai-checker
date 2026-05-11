import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Feedback,
  type FeedbackPrimitives,
  type FeedbackStatus,
} from "../../domain/entities/feedback.entity";
import type {
  FeedbackRepository,
  FeedbackSearchCriteria,
} from "../../domain/repositories/feedback.repository";

interface FeedbackRow {
  id: string;
  user_id: string;
  person_name: string;
  status: FeedbackStatus;
  final_feedback: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToFeedback(row: FeedbackRow): Feedback {
  return Feedback.fromPrimitives({
    id: row.id,
    user_id: row.user_id,
    person_name: row.person_name,
    status: row.status,
    final_feedback: row.final_feedback,
    closed_at: row.closed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

function feedbackToRow(feedback: Feedback): FeedbackPrimitives {
  return feedback.toPrimitives();
}

export class SupabaseFeedbackRepository implements FeedbackRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async list(criteria: FeedbackSearchCriteria): Promise<Feedback[]> {
    let query = this.supabase
      .from("feedback_notes_feedbacks")
      .select("*")
      .eq("user_id", criteria.userId)
      .order("updated_at", { ascending: false });

    if (criteria.status && criteria.status !== "all") {
      query = query.eq("status", criteria.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as FeedbackRow[]).map(rowToFeedback);
  }

  async findById(id: string, userId: string): Promise<Feedback | null> {
    const { data, error } = await this.supabase
      .from("feedback_notes_feedbacks")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToFeedback(data as FeedbackRow) : null;
  }

  async save(feedback: Feedback): Promise<Feedback> {
    const { data, error } = await this.supabase
      .from("feedback_notes_feedbacks")
      .upsert(feedbackToRow(feedback), { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToFeedback(data as FeedbackRow);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("feedback_notes_feedbacks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  }
}
