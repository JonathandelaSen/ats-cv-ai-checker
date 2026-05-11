import type { FeedbackEntry } from "../../domain/entities/feedback-entry.entity";
import type { Feedback } from "../../domain/entities/feedback.entity";

export function presentFeedback(feedback: Feedback, entryCount?: number) {
  const primitives = feedback.toPrimitives();
  return {
    ...primitives,
    entry_count: entryCount,
  };
}

export function presentFeedbackEntry(entry: FeedbackEntry) {
  return entry.toPrimitives();
}
