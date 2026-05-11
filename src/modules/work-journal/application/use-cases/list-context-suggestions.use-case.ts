import type { WorkJournalContextSuggestion } from "../../domain/entities/context-suggestion.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type { CVDataRepository } from "../../domain/repositories/cv-data.repository";
import { suggestWorkJournalContextsFromCVs, contextKey } from "../../domain/services/suggest-contexts.service";

export class ListContextSuggestionsUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      cvDataRepo: CVDataRepository;
    }
  ) {}

  async execute(userId: string): Promise<WorkJournalContextSuggestion[]> {
    const [cvs, contexts, hidden] = await Promise.all([
      this.deps.cvDataRepo.listCVs(userId),
      this.deps.contextRepo.list(userId),
      this.deps.contextRepo.listHiddenSuggestionKeys(userId),
    ]);

    const existing = new Set(
      contexts.map((c) => contextKey(c.type, c.name))
    );

    return suggestWorkJournalContextsFromCVs(cvs).filter((suggestion) => {
      const key = contextKey(suggestion.type, suggestion.name);
      return !existing.has(key) && !hidden.has(key);
    });
  }
}
