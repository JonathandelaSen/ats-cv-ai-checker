import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker, QueryBus } from "@/modules/shared";
import { SupabaseEventTracker } from "@/modules/shared";
import { GetLegacyAnalysisChatContextQueryHandler } from "./application/queries/get-legacy-analysis-chat-context.query-handler";
import { GetLegacyAnalysisChatContextQuery } from "./application/queries/get-legacy-analysis-chat-context.query";
import { CreateConversationUseCase } from "./application/use-cases/create-conversation.use-case";
import { DeleteConversationUseCase } from "./application/use-cases/delete-conversation.use-case";
import { GetLegacyAnalysisChatContextUseCase } from "./application/use-cases/get-legacy-analysis-chat-context.use-case";
import { ListConversationsUseCase } from "./application/use-cases/list-conversations.use-case";
import { ListMessagesUseCase } from "./application/use-cases/list-messages.use-case";
import { RenameConversationUseCase } from "./application/use-cases/rename-conversation.use-case";
import { SendMessageUseCase } from "./application/use-cases/send-message.use-case";
import { LegacyAnalysisChatContextRepository } from "./infrastructure/repositories/legacy-analysis-chat-context.repository";
import { SupabaseChatMessageRepository } from "./infrastructure/repositories/supabase-chat-message.repository";
import { SupabaseConversationRepository } from "./infrastructure/repositories/supabase-conversation.repository";
import { GeminiAnalysisChatAIService } from "./infrastructure/services/gemini-analysis-chat-ai.service";

const conversationRepo = new SupabaseConversationRepository();
const messageRepo = new SupabaseChatMessageRepository();
const contextReader = new LegacyAnalysisChatContextRepository();
const aiService = new GeminiAnalysisChatAIService();
const tracker: EventTracker = new SupabaseEventTracker();

function createUseCases(queryBus: QueryBus) {
  return {
    listConversations: new ListConversationsUseCase({ conversationRepo }),
    createConversation: new CreateConversationUseCase({
      conversationRepo,
      tracker,
    }),
    renameConversation: new RenameConversationUseCase({
      conversationRepo,
      tracker,
    }),
    deleteConversation: new DeleteConversationUseCase({
      conversationRepo,
      tracker,
    }),
    listMessages: new ListMessagesUseCase({ messageRepo }),
    sendMessage: new SendMessageUseCase({
      conversationRepo,
      messageRepo,
      aiService,
      queryBus,
      tracker,
    }),
    getLegacyAnalysisChatContext: new GetLegacyAnalysisChatContextUseCase({
      contextReader,
    }),
  };
}

export type AnalysisChatModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): AnalysisChatModule;
};

export function createAnalysisChatModule(queryBus: QueryBus): AnalysisChatModule {
  const useCases = createUseCases(queryBus);

  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      conversationRepo.bindRequest(client);
      messageRepo.bindRequest(client);
      contextReader.bindRequest(client);
      return this;
    },
  };
}

export function registerAnalysisChatQueries(
  queryBus: QueryBus & {
    register: (queryName: string, handler: GetLegacyAnalysisChatContextQueryHandler) => void;
  }
) {
  queryBus.register(
    GetLegacyAnalysisChatContextQuery.queryName,
    new GetLegacyAnalysisChatContextQueryHandler(
      new GetLegacyAnalysisChatContextUseCase({ contextReader })
    )
  );
}
