import type { SupabaseClient } from "@supabase/supabase-js";
import { UserId } from "@/modules/shared";
import type { SupabaseAware } from "@/modules/shared/infrastructure/supabase-aware";
import {
  ChatMessage,
  type ChatMessagePrimitives,
} from "../../domain/entities/chat-message.entity";
import type {
  ChatMessageRepository,
  ChatMessageSearchCriteria,
} from "../../domain/repositories/chat-message.repository";
import { AnalysisChatMessageId } from "../../domain/value-objects/analysis-chat-message-id.value-object";

interface ChatMessageRow {
  id: string;
  user_id: string;
  analysis_id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  model: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function rowToPrimitives(row: ChatMessageRow): ChatMessagePrimitives {
  return {
    id: row.id,
    userId: row.user_id,
    analysisReference: { type: "legacy_analysis", id: row.analysis_id },
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    model: row.model,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

function messageToRow(message: ChatMessage): ChatMessageRow {
  const primitives = message.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    analysis_id: primitives.analysisReference.id,
    conversation_id: primitives.conversationId,
    role: primitives.role,
    content: primitives.content,
    model: primitives.model,
    metadata: primitives.metadata,
    created_at: primitives.createdAt,
  };
}

function rowToMessage(row: ChatMessageRow) {
  return ChatMessage.fromPrimitives(rowToPrimitives(row));
}

export class SupabaseChatMessageRepository
  implements ChatMessageRepository, SupabaseAware
{
  private client!: SupabaseClient;

  bindRequest(client: SupabaseClient) {
    this.client = client;
  }

  async search(criteria: ChatMessageSearchCriteria): Promise<ChatMessage[]> {
    const { data, error } = await this.client
      .from("analysis_chat_messages")
      .select("*")
      .eq("user_id", criteria.userId.toPrimitives())
      .eq("conversation_id", criteria.conversationId.toPrimitives())
      .order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as ChatMessageRow[]).map(rowToMessage);
  }

  async findById(
    id: AnalysisChatMessageId,
    userId: UserId
  ): Promise<ChatMessage | null> {
    const { data, error } = await this.client
      .from("analysis_chat_messages")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    return data ? rowToMessage(data as ChatMessageRow) : null;
  }

  async save(message: ChatMessage): Promise<ChatMessage> {
    const row = messageToRow(message);
    const { data, error } = await this.client
      .from("analysis_chat_messages")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;

    await this.client
      .from("analysis_chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", row.conversation_id)
      .eq("user_id", row.user_id);

    return rowToMessage(data as ChatMessageRow);
  }

  async delete(id: AnalysisChatMessageId, userId: UserId): Promise<void> {
    const { error } = await this.client
      .from("analysis_chat_messages")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());

    if (error) throw error;
  }
}
