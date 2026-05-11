import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { createFeedbackFixture } from "../../test-helpers";
import { FeedbackEntry } from "../../domain/entities/feedback-entry.entity";
import { SupabaseFeedbackEntryRepository } from "./supabase-feedback-entry.repository";
import { getSupabaseClient } from "@/modules/test-helpers/setup";

const repo = new SupabaseFeedbackEntryRepository(getSupabaseClient());

describe("SupabaseFeedbackEntryRepository", () => {
  it("persists entries and lists them chronologically for a feedback", async () => {
    const user = await createTestUser("feedback-entry-repo-list");
    const feedback = await createFeedbackFixture(user.id);
    const first = await repo.save(
      FeedbackEntry.create({
        id: crypto.randomUUID(),
        user_id: user.id,
        feedback_id: feedback.id,
        content: "First",
        now: "2026-05-01T10:00:00.000Z",
      })
    );
    const second = await repo.save(
      FeedbackEntry.create({
        id: crypto.randomUUID(),
        user_id: user.id,
        feedback_id: feedback.id,
        content: "Second",
        now: "2026-05-02T10:00:00.000Z",
      })
    );

    await expect(
      repo.listByFeedback(feedback.id, user.id).then((entries) =>
        entries.map((entry) => entry.id)
      )
    ).resolves.toEqual([first.id, second.id]);
  });

  it("updates and deletes entries", async () => {
    const user = await createTestUser("feedback-entry-repo-update");
    const feedback = await createFeedbackFixture(user.id);
    const entry = await repo.save(
      FeedbackEntry.create({
        id: crypto.randomUUID(),
        user_id: user.id,
        feedback_id: feedback.id,
        content: "Original",
        now: new Date().toISOString(),
      })
    );
    entry.updateContent("Updated");
    await repo.save(entry);

    await expect(
      repo.findById(entry.id, user.id).then((item) => item?.toPrimitives())
    ).resolves.toMatchObject({ content: "Updated" });

    await repo.delete(entry.id, user.id);
    await expect(repo.findById(entry.id, user.id)).resolves.toBeNull();
  });
});
