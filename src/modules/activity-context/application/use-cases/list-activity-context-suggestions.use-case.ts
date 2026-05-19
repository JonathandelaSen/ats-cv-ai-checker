import { UserId } from "@/modules/shared";
import type { CVDataRepository } from "../../domain/repositories/cv-data.repository";
import type { ActivityContextRepository } from "../../domain/repositories/activity-context.repository";
import type { ActivityContextSuggestion } from "../../domain/value-objects/activity-context-suggestion.value-object";
import {
  activityContextSuggestionKey,
  suggestActivityContextsFromCVs,
} from "../../domain/services/suggest-activity-contexts.service";

export class ListActivityContextSuggestionsUseCase {
  constructor(
    private readonly deps: {
      activityContextRepo: ActivityContextRepository;
      cvDataRepo: CVDataRepository;
    }
  ) {}

  async execute(userId: string): Promise<ActivityContextSuggestion[]> {
    const ownerId = UserId.fromPrimitives(userId);
    const [cvs, contexts, hidden] = await Promise.all([
      this.deps.cvDataRepo.listCVs(userId),
      this.deps.activityContextRepo.search(ownerId),
      this.deps.activityContextRepo.listHiddenSuggestionKeys(ownerId),
    ]);
    const existing = new Set(
      contexts.map((context) =>
        activityContextSuggestionKey(context.toPrimitives().type, context.toPrimitives().name)
      )
    );

    return suggestActivityContextsFromCVs(cvs).filter((suggestion) => {
      const key = activityContextSuggestionKey(suggestion.type, suggestion.name);
      return !existing.has(key) && !hidden.has(key);
    });
  }
}
