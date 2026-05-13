import type { SupabaseClient } from "@supabase/supabase-js";
import { Timestamp, UserId } from "@/modules/shared";
import type { SupabaseAware } from "@/modules/shared/infrastructure/supabase-aware";
import {
  Conversation,
  type ConversationPrimitives,
} from "../../domain/entities/conversation.entity";
import type {
  ConversationRepository,
  ConversationSearchCriteria,
} from "../../domain/repositories/conversation.repository";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatTitle } from "../../domain/value-objects/analysis-chat-title.value-object";
import { AnalysisReference } from "../../domain/value-objects/analysis-reference.value-object";

interface ConversationRow {
  id: string;
  user_id: string;
  analysis_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

function rowToPrimitives(row: ConversationRow): ConversationPrimitives {
  return {
    id: row.id,
    userId: row.user_id,
    analysisReference: { type: "legacy_analysis", id: row.analysis_id },
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function conversationToRow(conversation: Conversation): ConversationRow {
  const primitives = conversation.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    analysis_id: primitives.analysisReference.id,
    title: primitives.title,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

function rowToConversation(row: ConversationRow) {
  return Conversation.fromPrimitives(rowToPrimitives(row));
}

export class SupabaseConversationRepository
  implements ConversationRepository, SupabaseAware
{
  private client!: SupabaseClient;

  bindRequest(client: SupabaseClient) {
    this.client = client;
  }

  async search(criteria: ConversationSearchCriteria): Promise<Conversation[]> {
    const analysisReference = criteria.analysisReference.toPrimitives();
    const { data, error } = await this.client
      .from("analysis_chat_conversations")
      .select("*")
      .eq("user_id", criteria.userId.toPrimitives())
      .eq("analysis_id", analysisReference.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as ConversationRow[]).map(rowToConversation);
  }

  async findById(
    id: AnalysisChatConversationId,
    userId: UserId
  ): Promise<Conversation | null> {
    const { data, error } = await this.client
      .from("analysis_chat_conversations")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    return data ? rowToConversation(data as ConversationRow) : null;
  }

  async save(conversation: Conversation): Promise<Conversation> {
    const { data, error } = await this.client
      .from("analysis_chat_conversations")
      .upsert(conversationToRow(conversation), { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToConversation(data as ConversationRow);
  }

  async delete(id: AnalysisChatConversationId, userId: UserId): Promise<void> {
    const { error } = await this.client
      .from("analysis_chat_conversations")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());

    if (error) throw error;
  }

  async create(input: {
    user_id: string;
    analysis_id: string;
    title?: string;
  }): Promise<Conversation> {
    const now = new Date().toISOString();
    return this.save(
      Conversation.create({
        id: AnalysisChatConversationId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.user_id),
        analysisReference: AnalysisReference.fromPrimitives({
          type: "legacy_analysis",
          id: input.analysis_id,
        }),
        title: AnalysisChatTitle.fromPrimitives(input.title ?? "Nueva conversación"),
        createdAt: Timestamp.fromPrimitives(now),
        updatedAt: Timestamp.fromPrimitives(now),
      })
    );
  }
}
