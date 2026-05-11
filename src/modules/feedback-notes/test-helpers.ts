import {
  createMockTracker,
  getSupabaseClient,
} from "@/modules/test-helpers/setup";
import { SupabaseFeedbackEntryRepository } from "./infrastructure/repositories/supabase-feedback-entry.repository";
import { SupabaseFeedbackRepository } from "./infrastructure/repositories/supabase-feedback.repository";

export function makeFeedbackDeps() {
  const supabase = getSupabaseClient();
  const feedbackRepo = new SupabaseFeedbackRepository(supabase);
  const entryRepo = new SupabaseFeedbackEntryRepository(supabase);
  const tracker = createMockTracker();
  return { feedbackRepo, entryRepo, tracker };
}

export async function createFeedbackFixture(userId: string, personName = "Jon") {
  const { feedbackRepo } = makeFeedbackDeps();
  return feedbackRepo.save(
    (
      await import("./domain/entities/feedback.entity")
    ).Feedback.create({
      id: crypto.randomUUID(),
      user_id: userId,
      person_name: personName,
      now: new Date().toISOString(),
    })
  );
}

export async function createEntryFixture(
  userId: string,
  feedbackId: string,
  content = "Helped unblock the review."
) {
  const { entryRepo } = makeFeedbackDeps();
  return entryRepo.save(
    (
      await import("./domain/entities/feedback-entry.entity")
    ).FeedbackEntry.create({
      id: crypto.randomUUID(),
      user_id: userId,
      feedback_id: feedbackId,
      content,
      now: new Date().toISOString(),
    })
  );
}
