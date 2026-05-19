import { describe, expect, it } from "vitest";
import {
  createMockTracker,
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { SupabaseWorkJournalEntryRepository } from "../../infrastructure/repositories/supabase-work-journal-entry.repository";
import { CreateEntryUseCase } from "./create-entry.use-case";

const supabase = getSupabaseClient();

function makeUseCase() {
  const contextRepo = new SupabaseWorkJournalContextRepository();
  contextRepo.bindRequest(supabase);
  const entryRepo = new SupabaseWorkJournalEntryRepository();
  entryRepo.bindRequest(supabase);
  const tracker = createMockTracker();
  return {
    contextRepo,
    entryRepo,
    tracker,
    useCase: new CreateEntryUseCase({ entryRepo, tracker }),
  };
}

describe("CreateEntryUseCase", () => {
  it("creates an entry for the provided context id", async () => {
    const user = await createTestUser("wj-create-entry");
    const { contextRepo, entryRepo, tracker, useCase } = makeUseCase();
    const context = await contextRepo.create({
      user_id: user.id,
      type: "employment",
      name: testLabel("context"),
    });

    const entry = await useCase.execute({
      user_id: user.id,
      context_id: context.id,
      date_start: "2026-05-01",
      date_end: null,
      topic: "Integration",
      input_mode: "manual",
      raw_notes: "Added integration tests",
      final_text: "Added integration tests.",
    });

    await expect(
      entryRepo.getById(entry.id, user.id).then((result) => result?.toPrimitives())
    ).resolves.toMatchObject({
      id: entry.id,
      topic: "Integration",
      rawNotes: "Added integration tests",
      finalText: "Added integration tests.",
    });
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "work_journal_entry_create",
        status: "success",
        metadata: { entryId: entry.id, contextId: context.id },
      })
    );
  });
});
