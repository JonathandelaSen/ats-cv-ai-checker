import type {
  DraftEntryInput,
  JournalAIService,
} from "../../domain/repositories/journal-ai-service.repository";

class MockJournalAIService implements JournalAIService {
  async draftEntry(input: DraftEntryInput): Promise<string> {
    return `[mock-ai] ${input.topic ?? input.context.name}: ${input.notes}`;
  }
}

export class MockJournalAIServiceFactory {
  create(): JournalAIService {
    return new MockJournalAIService();
  }
}
