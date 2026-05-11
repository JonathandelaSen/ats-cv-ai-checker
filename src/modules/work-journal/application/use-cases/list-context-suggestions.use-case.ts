import { UserId } from "@/modules/shared";
import type { WorkJournalContextSuggestion } from "../../domain/value-objects/context-suggestion.value-object";
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
      this.deps.contextRepo.search({ userId: UserId.fromPrimitives(userId) }),
      this.deps.contextRepo.listHiddenSuggestionKeys(UserId.fromPrimitives(userId)),
    ]);

    const existing = new Set(
      contexts.map((c) => contextKey(c.type, c.name))
    );

    return suggestWorkJournalContextsFromCVs(cvs).filter((suggestion) => {
      const key = contextKey(suggestion.type, suggestion.name);
      return (
        !existing.has(key) &&
        !Array.from(hidden).some((hiddenKey) => hiddenKey.toPrimitives() === key)
      );
    });
  }
}
