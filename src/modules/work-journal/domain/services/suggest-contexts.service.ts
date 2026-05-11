import type { ContextType } from "../entities/journal-context.entity";
import type { WorkJournalContextSuggestion } from "../entities/context-suggestion.entity";
import type { CVSummaryForSuggestions } from "../repositories/cv-data.repository";

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
      const suggestion: WorkJournalContextSuggestion = {
        type: "employment",
        name: item.company,
        role_or_label: item.role ?? null,
        is_current: Boolean(item.dates?.current),
        source: "cv",
      };
      const key = contextKey(suggestion.type, suggestion.name);
      const existing = suggestions.get(key);
      if (!existing || (!existing.is_current && suggestion.is_current)) {
        suggestions.set(key, suggestion);
      }
    }

    for (const item of cv.profile.projects ?? []) {
      if (!item.name) continue;
      const suggestion: WorkJournalContextSuggestion = {
        type: "project",
        name: item.name,
        role_or_label: item.organization ?? item.issuer ?? null,
        is_current: false,
        source: "cv",
      };
      suggestions.set(contextKey(suggestion.type, suggestion.name), suggestion);
    }
  }

  return Array.from(suggestions.values()).sort((a, b) => {
    if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
    if (a.type !== b.type) return a.type === "employment" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
