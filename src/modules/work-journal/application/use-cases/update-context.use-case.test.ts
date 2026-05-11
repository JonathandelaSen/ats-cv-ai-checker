import { describe, expect, it } from "vitest";
import {
  createMockTracker,
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { UpdateContextUseCase } from "./update-context.use-case";

const supabase = getSupabaseClient();

describe("UpdateContextUseCase", () => {
  it("updates a context and records observability", async () => {
    const user = await createTestUser("wj-update-context");
    const contextRepo = new SupabaseWorkJournalContextRepository(supabase);
    const tracker = createMockTracker();
    const useCase = new UpdateContextUseCase({ contextRepo, tracker });
    const context = await contextRepo.create({
      user_id: user.id,
      type: "employment",
      name: testLabel("context"),
    });

    const updated = await useCase.execute(context.id, user.id, {
      name: "Renamed context",
      is_default: true,
    });

    expect(updated).toMatchObject({
      id: context.id,
      name: "Renamed context",
      is_default: true,
    });
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        stage: "work_journal_context_update",
        status: "success",
        metadata: { contextId: context.id, fields: ["name", "is_default"] },
      })
    );
  });

  it("throws ContextNotFoundError when the context does not exist", async () => {
    const user = await createTestUser("wj-update-context-missing");
    const contextRepo = new SupabaseWorkJournalContextRepository(supabase);
    const tracker = createMockTracker();
    const useCase = new UpdateContextUseCase({ contextRepo, tracker });

    await expect(
      useCase.execute(crypto.randomUUID(), user.id, { name: "Missing" })
    ).rejects.toBeInstanceOf(ContextNotFoundError);
    expect(tracker.record).not.toHaveBeenCalled();
  });
});
