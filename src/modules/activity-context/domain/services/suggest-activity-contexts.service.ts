import type { ActivityContextType } from "../entities/activity-context.entity";
import type { CVSummaryForActivityContextSuggestions } from "../repositories/cv-data.repository";
import { ActivityContextSuggestion } from "../value-objects/activity-context-suggestion.value-object";

export const activityContextSuggestionKey = (type: ActivityContextType, name: string) =>
  `${type}:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;

export function suggestActivityContextsFromCVs(
  cvs: CVSummaryForActivityContextSuggestions[]
): ActivityContextSuggestion[] {
  const suggestions = new Map<string, ActivityContextSuggestion>();

  for (const cv of cvs) {
    if (cv.type !== "template" || !cv.profile) continue;

    for (const item of cv.profile.experience ?? []) {
      if (!item.company) continue;
      const suggestion = ActivityContextSuggestion.fromPrimitives({
        type: "employment",
        name: item.company,
        roleOrLabel: item.role ?? null,
        isCurrent: Boolean(item.dates?.current),
        source: "cv",
      });
      const key = activityContextSuggestionKey(suggestion.type, suggestion.name);
      const existing = suggestions.get(key);
      if (!existing || (!existing.isCurrent && suggestion.isCurrent)) {
        suggestions.set(key, suggestion);
      }
    }

    for (const item of cv.profile.projects ?? []) {
      if (!item.name) continue;
      const suggestion = ActivityContextSuggestion.fromPrimitives({
        type: "project",
        name: item.name,
        roleOrLabel: item.organization ?? item.issuer ?? null,
        isCurrent: false,
        source: "cv",
      });
      suggestions.set(activityContextSuggestionKey(suggestion.type, suggestion.name), suggestion);
    }
  }

  return Array.from(suggestions.values()).sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    if (a.type !== b.type) return a.type === "employment" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
