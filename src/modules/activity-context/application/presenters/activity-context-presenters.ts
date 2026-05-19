import type { ActivityContext } from "../../domain/entities/activity-context.entity";
import type { ActivityContextSuggestion } from "../../domain/value-objects/activity-context-suggestion.value-object";

export function presentActivityContext(context: ActivityContext) {
  return context.toPrimitives();
}

export function presentActivityContextSuggestion(suggestion: ActivityContextSuggestion) {
  const primitives = suggestion.toPrimitives();
  return {
    type: primitives.type,
    name: primitives.name,
    roleOrLabel: primitives.roleOrLabel,
  };
}
