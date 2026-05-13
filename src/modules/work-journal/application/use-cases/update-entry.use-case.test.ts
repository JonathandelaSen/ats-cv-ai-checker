import { describe, expect, it } from "vitest";
import {
  createMockTracker,
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { EntryNotFoundError } from "../../domain/errors/entry-not-found.error";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { SupabaseWorkJournalEntryRepository } from "../../infrastructure/repositories/supabase-work-journal-entry.repository";
import { UpdateEntryUseCase } from "./update-entry.use-case";

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
    useCase: new UpdateEntryUseCase({ contextRepo, entryRepo, tracker }),
  };
}

async function createContext(contextRepo: SupabaseWorkJournalContextRepository, userId: string) {
  return contextRepo.create({
    user_id: userId,
    type: "employment",
    name: testLabel("context"),
  });
}

describe("UpdateEntryUseCase", () => {
  it("updates fields on an existing entry", async () => {
    const user = await createTestUser("wj-update-entry");
    const { contextRepo, entryRepo, useCase } = makeUseCase();
    const context = await createContext(contextRepo, user.id);
    const entry = await entryRepo.create({
      user_id: user.id,
      context_id: context.id,
      date_start: "2026-06-01",
      date_end: null,
      topic: "Old",
      input_mode: "manual",
      raw_notes: "Old notes",
      final_text: "Old text",
    });

    const updated = await useCase.execute(entry.id, user.id, {
      topic: "New",
      final_text: "New text",
    });

    expect(updated.toPrimitives()).toMatchObject({ id: entry.id, topic: "New", finalText: "New text" });
    await expect(
      entryRepo.getById(entry.id, user.id).then((result) => result?.toPrimitives())
    ).resolves.toMatchObject({
      topic: "New",
      finalText: "New text",
    });
  });

  it("throws EntryNotFoundError when the entry does not exist", async () => {
    const user = await createTestUser("wj-update-entry-missing");
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute(crypto.randomUUID(), user.id, { topic: "Missing" })
    ).rejects.toBeInstanceOf(EntryNotFoundError);
  });

  it("throws ContextNotFoundError when moving to a missing context", async () => {
    const user = await createTestUser("wj-update-entry-missing-context");
    const { contextRepo, entryRepo, useCase } = makeUseCase();
    const context = await createContext(contextRepo, user.id);
    const entry = await entryRepo.create({
      user_id: user.id,
      context_id: context.id,
      date_start: "2026-06-01",
      date_end: null,
      topic: "Move",
      input_mode: "manual",
      raw_notes: "Move notes",
      final_text: "Move text",
    });

    await expect(
      useCase.execute(entry.id, user.id, { context_id: crypto.randomUUID() })
    ).rejects.toBeInstanceOf(ContextNotFoundError);
  });
});
