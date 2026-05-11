import type { ContextType } from "../entities/journal-context.entity";
import type { CVSummaryForSuggestions } from "../repositories/cv-data.repository";
import { WorkJournalContextSuggestion } from "../value-objects/context-suggestion.value-object";

const contextKey = (type: ContextType, name: string) =>
  `${type}:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;

export { contextKey };

export function suggestWorkJournalContextsFromCVs(
  cvs: CVSummaryForSuggestions[]
): WorkJournalContextSuggestion[] {
  const suggestions = new Map<string, WorkJournalContextSuggestion>();

  for (const cv of cvs) {
    if (cv.type !== "template" || !cv.profile) continue;

    for (const item of cv.profile.experience ?? []) {
      if (!item.company) continue;
      const suggestion = WorkJournalContextSuggestion.fromPrimitives({
        type: "employment",
        name: item.company,
        roleOrLabel: item.role ?? null,
        isCurrent: Boolean(item.dates?.current),
        source: "cv",
      });
      const key = contextKey(suggestion.type, suggestion.name);
      const existing = suggestions.get(key);
      if (!existing || (!existing.isCurrent && suggestion.isCurrent)) {
        suggestions.set(key, suggestion);
      }
    }

    for (const item of cv.profile.projects ?? []) {
      if (!item.name) continue;
      const suggestion = WorkJournalContextSuggestion.fromPrimitives({
        type: "project",
        name: item.name,
        roleOrLabel: item.organization ?? item.issuer ?? null,
        isCurrent: false,
        source: "cv",
      });
      suggestions.set(contextKey(suggestion.type, suggestion.name), suggestion);
    }
  }

  return Array.from(suggestions.values()).sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    if (a.type !== b.type) return a.type === "employment" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
