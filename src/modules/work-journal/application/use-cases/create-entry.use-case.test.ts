import { describe, expect, it } from "vitest";
import {
  createMockTracker,
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { ContextArchivedError } from "../../domain/errors/context-archived.error";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { SupabaseWorkJournalEntryRepository } from "../../infrastructure/repositories/supabase-work-journal-entry.repository";
import { CreateEntryUseCase } from "./create-entry.use-case";

const supabase = getSupabaseClient();

function makeUseCase() {
  const contextRepo = new SupabaseWorkJournalContextRepository(supabase);
  const entryRepo = new SupabaseWorkJournalEntryRepository(supabase);
  const tracker = createMockTracker();
  return {
    contextRepo,
    entryRepo,
    tracker,
    useCase: new CreateEntryUseCase({ contextRepo, entryRepo, tracker }),
  };
}

describe("CreateEntryUseCase", () => {
  it("creates an entry and marks its context as default", async () => {
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

    await expect(entryRepo.getById(entry.id, user.id)).resolves.toMatchObject({
      id: entry.id,
      topic: "Integration",
      raw_notes: "Added integration tests",
      final_text: "Added integration tests.",
    });
    await expect(contextRepo.getById(context.id, user.id)).resolves.toMatchObject({
      is_default: true,
    });
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "work_journal_entry_create",
        status: "success",
        metadata: { entryId: entry.id, contextId: context.id },
      })
    );
  });

  it("throws ContextNotFoundError when the context does not exist", async () => {
    const user = await createTestUser("wj-create-entry-missing-context");
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        user_id: user.id,
        context_id: crypto.randomUUID(),
        date_start: "2026-05-01",
        date_end: null,
        topic: null,
        input_mode: "manual",
        raw_notes: "Notes",
        final_text: "Final text",
      })
    ).rejects.toBeInstanceOf(ContextNotFoundError);
  });

  it("throws ContextArchivedError when the context is archived", async () => {
    const user = await createTestUser("wj-create-entry-archived");
    const { contextRepo, useCase } = makeUseCase();
    const context = await contextRepo.create({
      user_id: user.id,
      type: "project",
      name: testLabel("archived"),
    });
    await contextRepo.update(context.id, user.id, { status: "archived" });

    await expect(
      useCase.execute({
        user_id: user.id,
        context_id: context.id,
        date_start: "2026-05-01",
        date_end: null,
        topic: null,
        input_mode: "manual",
        raw_notes: "Notes",
        final_text: "Final text",
      })
    ).rejects.toBeInstanceOf(ContextArchivedError);
  });
});
