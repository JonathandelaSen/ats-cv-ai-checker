import { draftWorkJournalEntry } from "@/lib/ai-work-journal";
import type {
  DraftEntryInput,
  JournalAIService,
} from "../../domain/repositories/journal-ai-service.repository";

export class GeminiJournalAIService implements JournalAIService {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async draftEntry(input: DraftEntryInput): Promise<string> {
    return draftWorkJournalEntry({
      apiKey: this.config.apiKey,
      model: this.config.model,
      context: {
        type: input.context.type,
        name: input.context.name,
        role_or_label: input.context.roleOrLabel,
      },
      dateStart: input.dateStart,
      dateEnd: input.dateEnd,
      topic: input.topic,
      notes: input.notes,
    });
  }
}
