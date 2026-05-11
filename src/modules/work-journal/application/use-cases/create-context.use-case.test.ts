import { describe, expect, it } from "vitest";
import {
  createMockTracker,
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { CreateContextUseCase } from "./create-context.use-case";

const supabase = getSupabaseClient();

describe("CreateContextUseCase", () => {
  it("creates a context and records observability events", async () => {
    const user = await createTestUser("wj-create-context");
    const contextRepo = new SupabaseWorkJournalContextRepository(supabase);
    const tracker = createMockTracker();
    const useCase = new CreateContextUseCase({ contextRepo, tracker });
    const name = testLabel("context");

    const created = await useCase.execute({
      user_id: user.id,
      type: "employment",
      name,
      role_or_label: "Staff Engineer",
      is_default: true,
    });

    await expect(contextRepo.list(user.id)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.id, name })])
    );
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        stage: "work_journal_context_create",
        status: "started",
      })
    );
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        stage: "work_journal_context_create",
        status: "success",
        metadata: { contextId: created.id, type: "employment" },
      })
    );
  });
});
