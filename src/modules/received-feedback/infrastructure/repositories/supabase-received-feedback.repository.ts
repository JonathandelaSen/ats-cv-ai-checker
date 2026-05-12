import type { SupabaseClient } from "@supabase/supabase-js";
import { ReceivedFeedback, type ReceivedFeedbackPrimitives } from "../../domain/entities/received-feedback.entity";
import type {
  ReceivedFeedbackRepository,
  ReceivedFeedbackSearchCriteria,
} from "../../domain/repositories/received-feedback.repository";
import type { ReceivedFeedbackId } from "../../domain/value-objects/received-feedback-id.value-object";
import type { UserId } from "@/modules/shared";

interface ReceivedFeedbackRow {
  id: string;
  user_id: string;
  received_date: string;
  giver_name: string;
  feedback_text: string;
  user_note: string | null;
  created_at: string;
  updated_at: string;
}

function rowToReceivedFeedback(row: ReceivedFeedbackRow): ReceivedFeedback {
  return ReceivedFeedback.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    receivedDate: row.received_date,
    giverName: row.giver_name,
    feedbackText: row.feedback_text,
    userNote: row.user_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function feedbackToRow(feedback: ReceivedFeedback): ReceivedFeedbackRow {
  const primitives: ReceivedFeedbackPrimitives = feedback.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    received_date: primitives.receivedDate,
    giver_name: primitives.giverName,
    feedback_text: primitives.feedbackText,
    user_note: primitives.userNote,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export class SupabaseReceivedFeedbackRepository implements ReceivedFeedbackRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async search(criteria: ReceivedFeedbackSearchCriteria): Promise<ReceivedFeedback[]> {
    const { data, error } = await this.supabase
      .from("received_feedback")
      .select("*")
      .eq("user_id", criteria.userId.toPrimitives())
      .order("received_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(criteria.limit);

    if (error) throw error;
    return ((data ?? []) as ReceivedFeedbackRow[]).map(rowToReceivedFeedback);
  }

  async findById(id: ReceivedFeedbackId, userId: UserId): Promise<ReceivedFeedback | null> {
    const { data, error } = await this.supabase
      .from("received_feedback")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    return data ? rowToReceivedFeedback(data as ReceivedFeedbackRow) : null;
  }

  async save(feedback: ReceivedFeedback): Promise<ReceivedFeedback> {
    const { data, error } = await this.supabase
      .from("received_feedback")
      .upsert(feedbackToRow(feedback), { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToReceivedFeedback(data as ReceivedFeedbackRow);
  }

  async delete(id: ReceivedFeedbackId, userId: UserId): Promise<void> {
    const { error } = await this.supabase
      .from("received_feedback")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());

    if (error) throw error;
  }
}
