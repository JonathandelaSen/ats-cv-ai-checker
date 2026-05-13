import { describe, expect, it } from "vitest";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { SupabaseWorkJournalEntryRepository } from "../../infrastructure/repositories/supabase-work-journal-entry.repository";
import { ListEntriesUseCase } from "./list-entries.use-case";

const supabase = getSupabaseClient();

describe("ListEntriesUseCase", () => {
  it("delegates filters and returns matching entries", async () => {
    const user = await createTestUser("wj-list-entries");
    const contextRepo = new SupabaseWorkJournalContextRepository();
    contextRepo.bindRequest(supabase);
    const entryRepo = new SupabaseWorkJournalEntryRepository();
    entryRepo.bindRequest(supabase);
    const useCase = new ListEntriesUseCase({ entryRepo });
    const context = await contextRepo.create({
      user_id: user.id,
      type: "employment",
      name: testLabel("context"),
    });
    const matching = await entryRepo.create({
      user_id: user.id,
      context_id: context.id,
      date_start: "2026-08-10",
      date_end: null,
      topic: "Release notes",
      input_mode: "manual",
      raw_notes: "Shipped search filters",
      final_text: "Shipped search filters.",
    });
    await entryRepo.create({
      user_id: user.id,
      context_id: context.id,
      date_start: "2026-08-11",
      date_end: null,
      topic: "Planning",
      input_mode: "manual",
      raw_notes: "Planned next sprint",
      final_text: "Planned next sprint.",
    });

    const result = await useCase.execute(user.id, {
      contextId: context.id,
      search: "search filters",
      topic: "Release",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
    });

    expect(result.map((entry) => entry.id)).toEqual([matching.id]);
  });
});
